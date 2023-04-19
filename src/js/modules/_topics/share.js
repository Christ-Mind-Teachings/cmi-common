//import axios from "axios";
//import globals from "../../globals";
import {getMailList, sendMail} from "../_ajax/share";
import {getUserInfo} from "../_user/netlify";
import {gs} from "../_language/lang";
import {displayWarning} from "./message";
import {purify} from "../_util/sanitize";

const quoteMessageSelector = "#quote-modal-message";
const shareMessageSelector = "#share-modal .message";
let shareInfo = {};
let sid;

export function initShareByEmail(si) {
  sid = si.sid;
  loadEmailList();
}

function resetSendIndicator() {
  $("#quote-modal-share").addClass("loading blue").removeClass("red");
}

function setSendSuccess() {
  $("#quote-modal-share > i").removeClass("paper plane");
  $("#quote-modal-share > i").addClass("thumbs up");
  $("#quote-modal-share").removeClass("loading");

  setTimeout(() => {
    $("#quote-modal-share > i").removeClass("thumbs up");
    $("#quote-modal-share > i").addClass("paper plane");
  }, 2 * 1000);
}

function setSendFailure() {
  $("#quote-modal-share > i").removeClass("paper plane");
  $("#quote-modal-share > i").addClass("thumbs down");
  $("#quote-modal-share").removeClass("loading blue").addClass("red");

  setTimeout(() => {
    $("#quote-modal-share > i").removeClass("thumbs down");
    $("#quote-modal-share > i").addClass("paper plane");
  }, 2 * 1000);
}

/*
 * format message to wrap pargraphs in <p> tags
 */
function formatMessage(message) {
  message = message.replace(/\n/g, "@@");
  message = message.replace(/@@*/g, "@@");

  let mArray = message.split("@@");

  message = mArray.reduce((current, p) => {
    return `${current}<p>${purify(p)}</p>`;
  }, "");

  return message;
}

/*
 * Format recipientArray into a string of email addresses and
 * a structure of recipient variables per Mailgun
 */
function formatRecipientInfo(recipientArray) {
  let addresses = [];
  let info = {};

  recipientArray.forEach((i) => {
    let [email, first, last] = i.split(":");
    addresses.push(email);
    info[email] = {first: first === "" ? "No First Name" : first, last: last === "" ? "No Last Name" : last};
  });

  return {
    to: addresses.join(","),
    variables: JSON.stringify(info)
  };
}

export function submitEmail(q) {
  const userInfo = getUserInfo();
  let formData = $("#email-modal-share-form").form("get values");

  if (formData.mailList.length === 0 && formData.emailAddresses.length === 0) {
    displayWarning(shareMessageSelector, gs("error:e9", "Please enter a message"));

    //don't close email address window
    return false;
  }

  shareInfo.to = "";
  if (formData.mailList.length > 0) {
    let info = formatRecipientInfo(formData.mailList);
    shareInfo.to = info.to;
    shareInfo.variables = info.variables;
  }

  if (formData.emailAddresses.length > 0) {
    if (shareInfo.to.length > 0) {
      shareInfo.to = `${shareInfo.to}, ${formData.emailAddresses}`;
    }
    else {
      shareInfo.to = formData.emailAddresses;
    }
  }

  shareInfo.senderName = userInfo.name;
  shareInfo.senderEmail = userInfo.email;
  shareInfo.sid = sid;
  shareInfo.citation = `~ ${q.citation}`;
  shareInfo.quote = q.quote;
  shareInfo.url = `${location.origin}${q.url}`;

  if (formData.emailMessage) {
    shareInfo.message = formatMessage(formData.emailMessage);
  }

  // start loading indicator
  resetSendIndicator();

  sendMail(shareInfo)
    .then((response) => {
      if (response === "success") {
        setSendSuccess();
      }
      else {
        setSendFailure();
        console.log("post message; %s", response);
      }
    })
    .catch((error) => {
      setSendFailure();
      console.error("share error: %s", error);
    });

  return true;
}

//generate the option element of a select statement
function generateOption(item) {
  return `<option value="${item.address}:${item.first}:${item.last}">${item.first} ${item.last}</option>`;
}

function makeMaillistSelect(maillist) {
  let listnames = gs("label:listnames", "Mail List Names");
  let selectaddress = gs("label:selectaddress", "Select Email Address(es)");

  return (`
    <label>${listnames}</label>
    <select name="mailList" id="maillist-modal-address-list" multiple="" class="search ui dropdown">
      <option value="">${selectaddress}</option>
      ${maillist.map(item => `${generateOption(item)}`).join("")}
    </select>
  `);
}

/*
  Called by initShareByEmail()
  - load only when user signed in, fail silently, it's not an error
*/
async function loadEmailList() {
  const userInfo = getUserInfo();

  if (!userInfo) return;

  let api = `${userInfo.userId}/maillist`;

  try {
    let maillist = await getMailList(userInfo.userId);
    let selectHtml = makeMaillistSelect(maillist);

    $("#maillist-modal-select").html(selectHtml);
    $("#maillist-modal-address-list.dropdown").dropdown();
  }
  catch( err ) {
    notify.error(`${gs("error1:e10", "Error getting email list:")}: ${err}`);
  };
}



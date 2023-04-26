import {transcriptDriver, pageNavigationDriver} from "../_util/driver";
import clipboard from "../_bookmark/clipboard";

/**
 * Set action for each option in the help menu
 *
 * Note:
 * createClickHandlers() is called for both page and
 * transcript pages. The pageTour arg is null when
 * called for transcript pages.
 */
function createClickHandlers(si, pageTour) {

  $("#help-menu").on("click", "div.item", function(e) {
    e.preventDefault();

    //this is a source specific tour of the home page
    if ($(this).hasClass("page-tour")) {
      pageTour();
    }

    //a generic tour of the home page, uses source title
    //for context
    if ($(this).hasClass("page-navtour")) {
      pageNavigationDriver(si.title);
    }

    //a generic tour of a transcript page, uses source title
    //for context
    if ($(this).hasClass("transcript-tour")) {
      transcriptDriver(si.title);
    }

    //displays the about page
    //-- not used currently
    if ($(this).hasClass("about-src")) {
      location.href = "/about/";
    }

    //navigates to the CMI quick documentation page
    if ($(this).hasClass("read-documentation")) {
      location.href = "/acq/quick/";
    }

    //navigates to the CMI video documentation page
    if ($(this).hasClass("view-documentation")) {
      location.href = "/acq/video/";
    }

    //displays the CMI contact page
    if ($(this).hasClass("contact-me")) {
      location.href = "/acq/contact/";
    }
  });

  //enables signed in user features
  $(".login-menu-option-account").on("click", "div.item", function(e) {
    if ($(this).hasClass("profile-management")) {
      location.href = "/profile/email/";
    }

    if ($(this).hasClass("topic-management")) {
      location.href = "/profile/topicMgt/";
    }
  });

  //enables quickly jumping to the home page of other sources
  $("#quick-links").on("click", "div.item", function(e) {
    e.preventDefault();

    let href = $(this).attr("data-href");
    location.href = href;
  });
}

/**
 * Initialize homepage menu help option.
 *
 * @param {object} - sourceInfo, derrived from constants.js
 * @param {object} - callerPageTour, driver.js tour for home page
 */
export function pageHelpInit(sourceInfo, callerPageTour) {
  createClickHandlers(sourceInfo, callerPageTour);
}

/**
 * Initialize transcript menu help option.
 *
 * @param {object} - sourceInfo, derrived from constants.js
 */
export function transcriptHelpInit(sourceInfo) {
  createClickHandlers(sourceInfo);

  //get pagekey and setup copy to clipboard
  if ($(".copy-page-key").length > 0) {
    let pageKey = sourceInfo.keyInfo.genPageKey();

    if (pageKey !== -1) {
      $(".copy-page-key").attr("data-clipboard-text", pageKey).text(`Key: ${pageKey}`);
      clipboard.register(".copy-page-key");
    }
    else {
      $("#help-copy-pagekey").remove();
    }
  }

  let key = sourceInfo.keyInfo.genPageKey();

  //video pages don't have keys
  if (key === -1) return;

  //Add page title to help menu
  sourceInfo.getPageInfo(key)
    .then((info) => {
      //console.log("pageInfo: %o", info);
      let title = `${info.source}<br/>${info.bookTitle}`;

      if (info.subTitle) {
        title = `${title}<br/>${info.subTitle}`;
      }

      title = `${title}<br/>${info.title}`;
      $("#transcript-page-info").html(title);
    });
}


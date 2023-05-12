import scroll from "scroll-into-view";

import clipboard from "../_bookmark/clipboard";
import {gs} from "../_language/lang";

const uiTocModal = ".toc.ui.modal";
const uiOpenTocModal = ".toc-modal-open";
const uiModalOpacity = 0.5;

let g_sourceInfo;

/*
* If there is timing or a timer defined for a toc item
* set the class accordingly. A clock icon is displayed
* info.timing, a user icon when info.timer and no icon
* otherwise.
*/
function getTimerClass(info) {
  if (info.timing) {
    return " __timing";
  }
  if (info.timer) {
    return " __timer";
  }
  return "";
}

//generate html for Contents
function makeContents(book, contents, type) {
  var c = {counter: 0};
  var klass = "ui list";

  if (type) {
    klass = `${klass} ${type}`;
  }

  let html = `
    <div class="${klass}">
      ${contents.map(unit => `
        ${g_sourceInfo.tocExtension(book, unit, c)}
      `).join("")}
    </div>
  `;

  //console.log("%s has %s pages", book, c.counter);

  return {html: html, count: c.counter};
}

//called for transcript pages
function loadTOC() {
  //console.log("transcript page: loading toc");
  const tocString = gs("label:l3", "Table of Contents");
  let book = $("#contents-modal-open").attr("data-book").toLowerCase();

  g_sourceInfo.getConfig(book)
    .then((contents) => {
      $(".toc-image").attr("src", `${contents.image}`);
      $(".toc-title").html(`${tocString}: <em>${contents.title}</em>`);

      let {html, count} = makeContents(book, contents.contents, contents.toc || "");
      $(".toc-list").html(html);
      highlightCurrentTranscript(contents.bid, count);
    })
    .catch((error) => {
      console.error(error);
      $(".toc-image").attr("src", "/public/img/site/toc_modal.png");
      $(".toc-title").html(`${tocString}: <em>Error</em>`);
      $(".toc-list").html(`<p>Error: ${error.message}</p>`);
      $(uiTocModal).modal("show");
    });
}

/*
  set next/prev controls on menu for workbook transcripts
*/
function nextPrev($el, max) {
  let LAST_ID = max;
  let prevId = -1, nextId = -1, href, text;
  let lid = $el.attr("data-lid");
  let lessonId = parseInt(lid, 10);

  //disable prev control
  if (lessonId === 1) {
    $("#toc-previous-page").addClass("disabled");
  }
  else {
    $("#toc-previous-page").removeClass("disabled");
    prevId = lessonId - 1;
  }

  //disable next control
  if (lessonId === LAST_ID) {
    $("#toc-next-page").addClass("disabled");
  }
  else {
    $("#toc-next-page").removeClass("disabled");
    nextId = lessonId + 1;
  }

  if (prevId > -1) {
    href = $(`a[data-lid="${prevId}"]`).attr("href");
    text = $(`a[data-lid="${prevId}"]`).text();

    //set prev tooltip and href
    $("#toc-previous-page > span").attr("data-tooltip", `${text}`);
    $("#toc-previous-page").attr("href", `${href}`);
  }

  if (nextId > -1) {
    href = $(`a[data-lid="${nextId}"]`).attr("href");
    text = $(`a[data-lid="${nextId}"]`).text();

    //set prev tooltip and href
    $("#toc-next-page > span").attr("data-tooltip", `${text}`);
    $("#toc-next-page").attr("href", `${href}`);
  }
}

/*
  If we're on a transcript page, highlight the
  current transcript in the list
*/
function highlightCurrentTranscript(bid, max = 1) {
  let page = location.pathname;
  let $el = $(`.toc-list a[href='${page}']`);

  //remove href to deactivate link for current page
  $el.addClass("current-unit").removeAttr("href");

  nextPrev($el, max);
}

/*
  Calls to this function are valid for transcript pages.
*/
export function getBookId() {
  return $(uiOpenTocModal).attr("data-book");
}

export default {

  /*
   * Init the modal dialog with data from JSON file
   * or local storage
   */
  initialize: function(si, env) {

    g_sourceInfo = si;

    //modal dialog settings
    $(uiTocModal).modal({
      dimmerSettings: {opacity: uiModalOpacity},
      observeChanges: true,
      onVisible: function() {
        let $el = $(".toc-list a.current-unit");
        scroll($el.get(0), {
          isScrollable: function(target, defaultIsScrollable) {
            return defaultIsScrollable(target) || target.className.includes('scrolling');
          }
        });
      }
    });

    //load toc once for transcript pages
    if (env === "transcript") {
      loadTOC();
    }

    /*
     * TOC populated by JSON file from AJAX call if not found
     * in local storage.
     *
     * Read value of data-book attribute to identify name of file
     * with contents.
     */
    $(uiOpenTocModal).on("click", (e) => {
      e.preventDefault();
      let book = $(e.currentTarget).attr("data-book").toLowerCase();

      //load the TOC if we're not on a transcript page
      if (env !== "transcript") {
        g_sourceInfo.getConfig(book)
          .then((contents) => {
            let share_url=`${location.origin}${location.pathname}?tocbook=${book}`;

            $(".toc-image").attr("src", `${contents.image}`);
            $(".toc-title").html(`<i data-clipboard-text="${share_url}" title="Copy to Clipboard" class="tiny share alternate icon toc-share"></i>&nbsp;${gs("label:l3", "Table of Contents")}: <em>${contents.title}</em>`);

            let {html, count} = makeContents(book, contents.contents, contents.toc || "");
            $(".toc-list").html(html);
            $(uiTocModal).modal("show");

            clipboard.register(".share.icon.toc-share");
          })
          .catch((error) => {
            console.error(error);
            $(".toc-image").attr("src", "/public/img/site/toc_modal.png");
            $(".toc-title").html(`${gs('label:l3', 'Table of Contents')}: <em>Error</em>`);
            $(".toc-list").html(`<p>${gs("error:e6", "Failed to load configuration file")} ${book}.json`);
            $(uiTocModal).modal("show");
          });
      }
      else {
        $(uiTocModal).modal("show");
      }
    });
  }
};

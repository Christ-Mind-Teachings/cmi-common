import {TweenMax} from "gsap";

import {pageHelpInit, transcriptHelpInit} from "./help";
import auth from "../_user/netlify";
import fb from "../_util/facebook";

import bookmark from "../_bookmark/bookmark";
import {initShareByEmail} from "../_bookmark/shareByEmail";
import share from "../_share/share";

//let storeKey;
let g_sourceInfo;

/*
 * Init page with no bookmark, FB and help support.
 */
export function initBareBonesHomePage(si) {
  auth.initialize();
  initStickyMenu();
  initAnimation("[animate]");
}

export function initHomePage(si, tour) {
  auth.initialize();
  initStickyMenu();
  initAnimation("[animate]");
  pageHelpInit(si, tour);

  //used when sharing quotes or bookmarks
  fb.initialize();

  homePageBookmarkInit(si);
}

//Init page with no search, bookmark, FB or help support
export function initBareBonesTranscriptPage(si) {
  g_sourceInfo = si;
  auth.initialize();

  //test if browser is mobile based on the css media query
  const isMobile = window.matchMedia("only screen and (max-width: 768px)").matches;
  selectTranscriptMenu(isMobile);

  /*
  if (isMobile) {
    initMobileSpecifics();
  }
 */

  initStickyMenu();
}

export function initTranscriptPage(si) {
  g_sourceInfo = si;
  auth.initialize();

  //test if browser is mobile based on the css media query
  const isMobile = window.matchMedia("only screen and (max-width: 768px)").matches;
  selectTranscriptMenu(isMobile);

  /*
  if (isMobile) {
    initMobileSpecifics();
  }
 */

  initStickyMenu();
  labelParagraphs();
  setParagraphNumberDisplayState();
  createParagraphNumberToggleListener();

  transcriptHelpInit(si);

  //used when sharing quotes or bookmarks
  fb.initialize();

  transcriptPageBookmarkInit(si);
}

function transcriptPageBookmarkInit(si) {

  share.initialize(si).then((pid) => {
    bookmark.initialize(pid, si);
  });

  initShareByEmail(si);
}

function homePageBookmarkInit(si) {
  bookmark.initialize(null, si);
  initShareByEmail(si);
}

//function initMobileSpecifics() {
function selectTranscriptMenu(mobile) {
  if (mobile) {
    $("#transcript-menu-large").remove();
  }
  else {
    $("#transcript-menu-mobile").remove();
  }
}

/*
 * For all transcript paragraphs -
 *   That are not footnotes and that don't have class .omit
 *
 * Assign id="p + paragraph number" and class="cmiTranPara"
 *
 * This is used for bookmarks and audio playback and also represent
 * paragraphs that are indexed for search
 *
 * This code is specific to transcript pages but included in
 * common.js because bookmarks and playfromhere features depend
 * on paragraphs having class cmiTranPara.
 */
function labelParagraphs() {
  var count = 0;
  var omit = 0;
  var transcriptParagraphs = $(".transcript p");

  if (transcriptParagraphs.length === 0) {
    return;
  }

  //add .cmiTranPara, #id and paragraph numbers to each paragraph that doesn't have .omit
  transcriptParagraphs.each(function(idx) {
    //skip omitted paragraphs (they are omitted in the markdown file)
    if ($(this).hasClass("omit")) {
      omit++;
      return;
    }

    //skip footnote paragraphs
    if ($(this).parents("div.footnotes").length > 0) {
      //console.log("footnote paragraph");
      return;
    }
    count++;
    $(this)
      .attr("id", "p" + idx)
      .addClass("cmiTranPara")
      .prepend(`<span class='pnum'>(p${idx})&nbsp;</span>`);

  });

  //log number of not omitted paragraphs
  //-- used to verify search indexing
  //console.log("page: number of paragraphs: %s", count + omit);
  //console.log("conf: number of paragraphs: %s", config.unit.pNum);
}

//create listener to toggle display of paragraph numbers
function createParagraphNumberToggleListener() {
  $(".toggle-paragraph-markers").on("click", function(e) {
    e.preventDefault();
    let el = $(".transcript.ui.text.container");
    if (el.hasClass("hide-pnum")) {
      el.removeClass("hide-pnum");
      g_sourceInfo.setValue("pnDisplay", "on");
      //storeSet(storeKey, "on");
      setParagraphNumberDisplay("on");
    }
    else {
      el.addClass("hide-pnum");
      g_sourceInfo.setValue("pnDisplay", "off");
      //storeSet(storeKey, "off");
      setParagraphNumberDisplay("off");
    }
  });
}

function setParagraphNumberDisplay(state) {
  if (state === "on") {
    $(".toggle-paragraph-markers > span .paragraph-corner-icon").addClass("hide");
  }
  else {
    $(".toggle-paragraph-markers > span .paragraph-corner-icon").removeClass("hide");
  }
}

function setParagraphNumberDisplayState() {
  let toggleAvailable = $(".toggle-paragraph-markers").length === 0 ? false: true;

  //let state = storeGet(storeKey);
  let state = g_sourceInfo.getValue("pnDisplay");
  let el = $(".transcript.ui.text.container");
  let current = el.hasClass("hide-pnum") ? "off": "on";

  //if toggle menu option not available set page to hide paragraph numbers and return
  if (!toggleAvailable) {
    $(".transcript.ui.text.container").addClass("hide-pnum");
    return;
  }

  //if not set use current value
  if (!state) {
    state = current;
    //storeSet(storeKey, state);
    g_sourceInfo.setValue("pnDisplay", state);
  }

  if (state !== current) {
    if (state === "on") {
      el.removeClass("hide-pnum");
    }
    else {
      el.addClass("hide-pnum");
    }
  }

  setParagraphNumberDisplay(state);
}

/*
  Fix main menu to top of page when scrolled
*/
export function initStickyMenu() {
  // fix main menu to page on passing
  $(".main.menu").visibility({
    type: "fixed",
    onFixed: function(el) {
      //console.log("menu is fixed");
    },
    onUnfixed: function(el) {
      //console.log("menu is un fixed");
    }
  });

  $("#transcript-menu-mobile").visibility({
    type: "fixed",
    onFixed: function(el) {
      //console.log("menu is fixed");
    },
    onUnfixed: function(el) {
      //console.log("menu is un fixed");
    }
  });

  // show dropdown on hover
  $(".main.menu  .ui.dropdown").dropdown({
    on: "click"
  });

  // show dropdown on click on mobile
  $("#transcript-menu-mobile .ui.buttons  .ui.dropdown").dropdown({
    on: "click"
  });

  // enable tabs on source pages
  $(".source-features > .menu .item").tab();
}

export function initAnimation(selector = "[data-book]") {
  let delay = 0.2;
  $("#page-contents").on("mouseover", selector, function(e) {
    TweenMax.to($(this), delay, {className: "+=gsap-hover"});
    TweenMax.to($(this), delay, {scale: "1.1"});
  });
  $("#page-contents").on("mouseout", selector, function(e) {
    TweenMax.to($(this), delay, {className: "-=gsap-hover"});
    TweenMax.to($(this), delay, {scale: "1.0"});
  });
}

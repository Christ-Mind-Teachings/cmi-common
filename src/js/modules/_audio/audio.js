
//import {getAudioInfo} from "../_config/config";
import player from "./mediaelement";

const uiPlayerToggle = ".audio-player-toggle";
const uiAudioPlayerToggle = ".audio-player-wrapper";

//show menu option that toggle's display of the audio player
function showAudioPlayerMenuOption(hasTiming) {
  $(".audio-player-toggle.hide").removeClass("hide");
  if (!hasTiming) {
    $(".audio-player-toggle > span > i").addClass("orange");
  }
}

//set url of mp3 file
function setAudioPlayerSource(url) {
  $(uiPlayerToggle).attr("href", url);
}

//toggle display of the audio player
function createAudioPlayerToggleListener() {
  $(uiPlayerToggle).on("click", (e) => {
    e.preventDefault();

    let $toggle = $(uiAudioPlayerToggle);

    if ($toggle.hasClass("hide")) {
      $toggle.removeClass("hide");
    }
    else {
      $toggle.addClass("hide");
    }

  });
}

export default {

  //setup page to play audio if audio available
  initialize: async function(si) {
    try {
      let info = await si.getPageInfo(location.pathname);

      //add audio url to audio player toggle
      if (info.audio) {
        setAudioPlayerSource(`${info.audioBase}${info.audio}`);
        showAudioPlayerMenuOption(info.timing);

        //setup listener for audio-player-toggle
        createAudioPlayerToggleListener();

        //initialize audio player
        player.initialize(`${info.audioBase}${info.audio}`, info.timing, info.reservation, si);
      }
    }
    catch(err) {
      console.error("getPageInfo() failed: %o", err);
    }
  }
};

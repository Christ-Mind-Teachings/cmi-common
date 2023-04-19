import notify from "toastr";

import {getUserInfo} from "common/modules/_user/netlify";

import focus, {switchToParagraph, togglePlayFromHere} from "./focus";
import timeCapture from "./capture";

/*
  This is called after successful audio player initialization
*/
function setEventListeners(player, userStatus, haveTimingData, si) {
  //console.log("userStatus: %s, haveTimingData: %s", userStatus, haveTimingData !== undefined);
  let capture = false;

  //initialize focus
  if (haveTimingData) {
    focus.initialize(haveTimingData, player, userStatus, si);

    //play from here toggle
    $(".mejs__ptoggle").addClass("mejs-ptoggle-hidden");
  }

  //initialize time capture and, if we have timing data, time capture editing
  if (userStatus === "TIMER") {
    capture = true;
    timeCapture.initialize(player, haveTimingData);
  }

  /*
    seems to be called only once with readyState = 3 or 4

    Have this here to research a way to indicate when audio is ready to be played
    - eg: could indicate load and clear the indicator when this event is called
  player.media.addEventListener("canplay", function() {
    console.log("Media ready for playing: readyState: %s", player.readyState);
  });
  */

  /*
    Communicate current audio playback time to focus and capture
  */
  player.media.addEventListener("timeupdate", function() {
    var time = player.getCurrentTime();

    if (haveTimingData) {
      focus.setCurrentPlaybackTime(time);
    }

    if (capture) {
      timeCapture.setCurrentPlaybackTime(time);
    }
  });

  /*
   * play has started.
  */
  player.media.addEventListener("playing", function() {
    if (haveTimingData) {
      focus.play();
    }

    if (capture) {
      timeCapture.play();
    }
  });

  /*
    * Notify focus or timeCapture audio playback has ended
    */
  player.media.addEventListener("ended", function() {
    if (haveTimingData) {
      focus.ended();
    }

    if (capture) {
      timeCapture.ended();
    }
  });

  player.media.addEventListener("pause", function() {
    if (haveTimingData) {
      focus.pause();
    }

    if (capture) {
      timeCapture.pause();
    }
  });

  if (haveTimingData) {
    player.media.addEventListener("ptoggle", function() {
      if (togglePlayFromHere()) {
        $(".mejs__ptoggle").addClass("mejs-ptoggle-visible").removeClass("mejs-ptoggle-hidden");
      }
      else {
        $(".mejs__ptoggle").addClass("mejs-ptoggle-hidden").removeClass("mejs-ptoggle-visible");
      }
    });

    /* don't think we need this when we have timing data
    //get notified when seek start
    player.media.addEventListener("seeking", function() {
      var time = player.getCurrentTime();
      focus.setSeeking(time);
    });

    //get notified when seek ended
    player.media.addEventListener("seeked", function() {
      var time = player.getCurrentTime();
      focus.setSeeked(time);
    });
    */

    player.media.addEventListener("prevp", function() {
      switchToParagraph("PREV");
    });

    player.media.addEventListener("nextp", function() {
      switchToParagraph("NEXT");
    });
  }

  if (capture) {
    //Audio player control that shows/hides time capture icon
    player.media.addEventListener("capture", function() {
      timeCapture.toggleMarkers();
    });
  }
}

/*
  Assign user status:
    The status determines if the user can capture timing data.

  A LISTENER is a user who does not have an account or a user who has an account but does
  not have a role of "timer" or "editor".

  A TIMER must have a reservation otherwise they are assigned a status of LISTENER.

  An "editor" is always a TIMER if they have a reservation or not.

  Roles can be assigned to users with accounts in the Netlify Identity feature. For timing, roles of
  "timer" or "editor" are valid assignments.

  Reservations are made in the config file for a book. For example, if user with email address of
  user@example.com has a reservation to time chapter 1, section 1 of the Text, there will be an
  entry in /public/config/text.json like this:

				{
					"title": "Tx.1.I. Principles of Miracles",
					"audio": "/text/01/chap0101.mp3",
					"timer": "user@example.com",
					"url": "chap0101/"
				},

*/
function getUserStatus(si) {
  let user = getUserInfo();

  if (!user) {
    return "LISTENER";
  }
  //console.log("userInfo: ", user);

  //not all users have a role defined
  if (!user.roles) {
    return "LISTENER";
  }

  let timer = user.roles.find(r => r === "timer");
  let editor = user.roles.find(r => r === "editor");

  //an editor is always a timer, if they have a reservation or not
  //or if someone else has the reservation
  if (editor) {
    return "TIMER";
  }

  if (!timer) {
    return "LISTENER";
  }

  //User is a timer, check there is a timing reservation on the page
  let reservation = si.getReservation(location.pathname);

  //all timers must have a reservation
  if (!reservation) {
    //return "TIMER";
    return "LISTENER";
  }

  //check if reservation is for the user
  if (reservation === user.email) {
    return "TIMER";
  }

  //user is a timer but does not have a reservation
  return "LISTENER";
}

/*
  Determine audio player controls to use, we enable timing if timing data exists or not.
*/
function assignPlayerFeatures(timingData, si) {
  let info = {
    status: getUserStatus(si),
    features: []
  };

  if (info.status === "LISTENER") {
    if (timingData) {
      info.features = ["playpause", "current", "duration", "prevp", "nextp", "ptoggle", "speed"];
    }
    else {
      info.features = ["playpause", "current", "duration", "skipback", "jumpforward", "speed"];
    }

  }
  //TIMER
  else {
    if (timingData) {
      info.features = ["playpause", "current", "duration", "prevp", "nextp", "ptoggle", "capture", "speed"];
    }
    else {
      info.features = ["playpause", "current", "duration", "skipback", "jumpforward", "capture", "speed"];
    }
  }

  return info;
}

export default {

  /*
   * initialize audio player:
   *
   * args:
   *  src: url of audio file
   *  timingData: uri of timing data, pass it to focus.js
   */
  initialize: function(src, timingData, si) {
    //add source of audio file to player
    $("audio.mejs-player").attr("src", src);

    const {status, features} = assignPlayerFeatures(timingData, si);

    $("#cmi-audio-player").mediaelementplayer({
      pluginPath: "/public/vendor/audio/plugin/",
      iconSprite: '/public/vendor/audio/js/mejs-controls.svg',
      shimScritAccess: "always",
      skipBackInterval: 15,
      jumpForwardInterval: 15,
      timeFormat: "h:mm:ss",
      features: features,
      error: function(error) {
        notify.error("Audio error: ", error);
      },
      success: function(media, node, player) {
        //setup for capture and focus
        setEventListeners(player, status, timingData, si);
      }
    });
  }
};


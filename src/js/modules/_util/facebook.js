/*
  facebook sdk support
*/

let init = false;

export default {

  initialize: () => {
    if (init) return;
    $.ajax({
      url: "//connect.facebook.net/en_US/sdk.js",
      dataType: "script",
      cache: true,
      success: function() {
        FB.init({
          appId      : "448658485318107",
          xfbml      : true,
          version    : "v3.1"
        });
        init = true;
      }
    });
  }
};

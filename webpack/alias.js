const path = require("path");

module.exports = () =>  {
  return {
    "common": path.resolve(__dirname, "../../cmi-common/src/js"),
    "acim": path.resolve(__dirname, "../../cmi-acim/src/js"),
    "oe": path.resolve(__dirname, "../../cmi-oe/src/js"),
    "acol": path.resolve(__dirname, "../../cmi-acol/src/js"),
    "col": path.resolve(__dirname, "../../cmi-col/src/js"),
    "ftcm": path.resolve(__dirname, "../../cmi-ftcm/src/js"),
    "jsb": path.resolve(__dirname, "../../cmi-jsb/src/js"),
    "raj": path.resolve(__dirname, "../../cmi-raj/src/js"),
    "pwom": path.resolve(__dirname, "../../cmi-pwom/src/js"),
    "wom": path.resolve(__dirname, "../../cmi-wom/src/js")
  };
};



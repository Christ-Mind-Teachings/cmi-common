/*
  Transcript keys
  - a numeric value that represents a specific transcript and a logical ordering.
  - first item starts with 1

 key format: ssbbuuuxx.ppp
  where: ss: source Id (sid)
         bb: book Id (bid)
        uuu: unit Id (uid)
         xx: subunit Id (xid) - optional
        ppp: paragraph number (pid) - not positional

  - The integer part of the key represent a transcript and the decimal part
    a paragraph within the transcript.
  - The paragraphId is increased by 1 and divided by 1000

  Example: url's (location.pathname)
      /t/sid/bid/uid/xid/

  NOTE: This module is used by code running in the browser and Node so the
        common.js module system is used
*/

//Module "si" is generated by $npm run setConfiguration
//const si = require("./si");
let si = {};
const sprintf = require("sprintf-js").sprintf;

const keyLength = 9; //length of integer portion of key
const SIDSTART = 0;
const SIDSTOP = 2;
const BOOKSTART = 2;
const BOOKSTOP = 4;
const UNITSTART = 4;
const UNITSTOP = 7;
const SUBUNITSTART = 7
const SUBUNITSTOP = 9

/*
 * Return the number of chapters in the book (bid).
 * Subtract one from length because of 'xxx' (fake chapter)
function getNumberOfUnits(bid) {
  if (si.contents[bid]) {
    return si.contents[bid].length - 1;
  }
  throw new Error(`getNumberOfUnits() unexpected bookId: ${bid}`);
}
*/

function getSourceId() {
  return si.sourceId;
}

function getBooks() {
  return si.books;
}

function getKeyInfo() {
  return {
    sourceId: si.sourceId,
    keyLength: keyLength
  };
}

/**
 * Parse key into page part and paragraph part. Key is
 * composed of two parts, the page key is the integer part of
 * key and the paragraph key is the decimal part.
 *
 * Note: the paraKey is one greater than the paragraph it points to.
 *
 * @param {number | string} key
 * @return {object} - {paraKey:number, pageKey:number}
 */
function parseKey(key) {
  const keyInfo = getKeyInfo();
  let keyString = key;
  let paraKey = 0;

  if (typeof keyString === "number") {
    keyString = key.toString(10);
  }

  let decimalPos = keyString.indexOf(".");

  //if no decimal key doesn't include paragraph id
  if (decimalPos > -1) {
    let decimalPart = keyString.substr(decimalPos + 1);

    //append 0's if decimal part < 3
    switch(decimalPart.length) {
      case 1:
        decimalPart = `${decimalPart}00`;
        break;
      case 2:
        decimalPart = `${decimalPart}0`;
        break;
    }
    paraKey = parseInt(decimalPart, 10);
  }

  let pageKey = parseInt(keyString.substr(0, keyInfo.keyLength), 10);

  //paraKey = 0 if not part of key
  return {paraKey, pageKey};
}

/**
 * getUnitInfo()
 *
 * @param {string} bookId - book identifier
 * @param {string} unitId - chapter/lesson identifier
 * @return {object}
 */
function getUnitInfo(bookId, unitId) {

  let that = {index: -1};
  let unit = si.contents[bookId].find((el, idx) => {
    if (typeof el === "string" && el === unitId) {
      that.index = idx;
      return true;
    }
    else {
      let keys = Object.keys(el);
      if (keys[0] === unitId) {
        that.index = idx;
        that.subunits = el[keys[0]];
        return true;
      }
    }
    return false;
  }, that);

  return that;
}

/**
 * Split pathname into array
 *
 * @param {String} pathname - location.pathname
 * @return {array}
 */
function splitPathname(pn) {
  //remove leading '/'
  pn = pn.substring(1);

  //remove trailing '/'
  if (pn.endsWith("/")) {
    pn = pn.substring(0, pn.length - 1);
  }

  return pn.split("/");
}

/**
 * Generate a page key from a url pathname.
 *
 * @param {string} pn - location.pathname of current page
 * @return {number} - -1 if invalid
 */
function genPageKey(pn = location.pathname) {
  let key = {
    sid: si.sourceId,
    bid: 0,
    uid: 0,
    xid: 0
  };

  let [t, sourceId, bookId, unitId, subunitId] = splitPathname(pn);

  //url's of all sources start with /t
  if (t !== "t") return -1;

  //make sure we have a valid book
  key.bid = si.bookIds.indexOf(bookId);
  if (key.bid === -1) return -1;

  if (si.contents[bookId]) {
    let unitInfo = getUnitInfo(bookId, unitId);

    if (unitInfo.index > -1) {
      key.uid = unitInfo.index;

      if (unitInfo.subunits) {
        key.xid = unitInfo.subunits.findIndex(el => {
          return el === subunitId;
        });

        if (key.xid === -1) return -1;
      }
    }
    else {
      return -1;
    }
  }
  else {
    return -1;
  }

  let compositeKey = sprintf("%02s%02s%03s%02s", key.sid, key.bid, key.uid, key.xid);
  let numericKey = parseInt(compositeKey, 10);

  return numericKey;
}

/**
 * Generate a paragraph key in the form 'pageKey.paragraphKey'
 *
 * @param {string | number} pid - paragraph number
 * @param {string | number} key - page key or location.pathname
 * @return {number} - -1 if invalid
 */
function genParagraphKey(pid, key = location.pathname) {
  let numericKey = key;
  let pKey;

  //if string, remove leading 'p', convert to number
  //Note: paragraph numbers start with 0 but we want the key to start with 1
  //      so the number is incremented by 1
  if (typeof pid === "string") {
    pKey = (parseInt(pid.substring(1), 10) + 1) / 1000;
  }
  else {
    pKey = (pid + 1)/1000;
  }

  //if key is a string it represents a location.pathname
  if (typeof key === "string") {
    numericKey = genPageKey(key);
  }

  return numericKey === -1 ? -1 : numericKey + pKey;
}

/**
 * Decode Key: returns object with error = true on error.
 *             xid = 0 indicates no subunit in key
 *             pid = -1 indicates no paraKey in key
 *
 *  See key format described at top
 *
 *  @param {number | string} key - page key with or without decimal part
 *  @return {object} - look for error in object
*/
function decodeKey(key) {
  let {paraKey:pid, pageKey} = parseKey(key);

  let pageKeyString = pageKey.toString(10);
  let decodedKey = {
    error: false,
    message: "ok",
    key: key,
    bookId: "",
    sid: 0,
    bid: 0,
    uid: 0,
    xid: 0,
    pid: pid > 0 ? pid - 1: -1
  };

  //error, invalid key length
  if (pageKeyString.length !== keyLength) {
    decodedKey.error = true;
    decodedKey.message = `Integer portion of key should have a length of ${keyLength}, key is: ${pageKeyString}`;
    return decodedKey;
  }

  //check for valid sourceId
  decodedKey.sid = parseInt(pageKeyString.substring(SIDSTART, SIDSTOP ), 10);
  if (decodedKey.sid !== si.sourceId) {
    decodedKey.error = true;
    decodedKey.message = `Invalid sourceId: ${decodedKey.sid}, expecting: ${si.sourceId}`;
    return decodedKey;
  }

  decodedKey.bid = parseInt(pageKeyString.substring(BOOKSTART, BOOKSTOP), 10);
  decodedKey.bookId = si.bookIds[decodedKey.bid];

  decodedKey.uid = parseInt(pageKeyString.substring(UNITSTART, UNITSTOP), 10);
  decodedKey.xid = parseInt(pageKeyString.substring(SUBUNITSTART, SUBUNITSTOP), 10);

  return decodedKey;
}

/**
 * Convert pageKey to url
 *
 * @param {string | number} key - pageKey
 * @param {boolean} withPrefix - true: add prefix to url
 * @return {string} - url
 */
function getUrl(key, withPrefix = false) {
  let decodedKey = decodeKey(key);
  let url = "/invalid/key/";

  if (decodedKey.error) {
    return url;
  }

  if (si.contents[decodedKey.bookId]) {
    let unitInfo = si.contents[decodedKey.bookId][decodedKey.uid];

    if (typeof unitInfo === "object") {
      let unit = Object.keys(unitInfo)[0];
      let subunit = unitInfo[unit][decodedKey.xid];
      url = `/${decodedKey.bookId}/${unit}/${subunit}/`;
    }
    else {
      url = `/${decodedKey.bookId}/${unitInfo}/`;
    }

    if (withPrefix) {
      return `${si.prefix}${url}`;
    }
  }

  return url;
}

/**
 * Make key readable
 *
 * @param {number | string} key - page or paragraph key
 * @return {object} - string equivelants of key components
 */
function describeKey(key) {
  let decodedKey = decodeKey(key, false);

  if (decodedKey.error) {
    return {key: key, error: true, source: si.sid};
  }

  let info = {
    key: key,
    source: si.sid,
    book: decodedKey.bookId
  };

  let ui = si.contents[decodedKey.bookId][decodedKey.uid];
  if (typeof ui === "object") {
    info.unit = Object.keys(ui)[0];
    info.unit = `${info.unit}/${ui[info.unit][decodedKey.xid]}`;
  }
  else {
    info.unit = ui;
  }

  if (decodedKey.pid > -1) {
    info.pid = `p${decodedKey.pid}`;
  }

  //console.log("describeKey: %o", info);
  return info;
}

function initializeKey(sourceInfo) {
  si = sourceInfo;
}

/*
//---- Test -----
let key = [
  ["p24", "/t/acimoe/text/03/chap0301/"],
  [24, "/t/acimoe/text/03/chap0301"],
  ["p99", "/t/acimoe/book1/chap01/"],
  ["p24", "/t/acimoe/book/chap01/"]
];

key.forEach(e => {
  let pageKey = genPageKey(e[1]);
  console.log(`${e[1]} key: %s`, pageKey);
  console.log(`${pageKey} url: %s`, getUrl(pageKey, true));
  console.log("DescribeKey: %o", describeKey(pageKey));

  let paraKey = genParagraphKey(e[0], e[1]);
  console.log(`${e[1]}, ${e[0]}: %s`, paraKey);
  console.log(`${paraKey} url: %s`, getUrl(paraKey, true));
  console.log("DescribeKey: %o", describeKey(paraKey));
});

*/
module.exports = {
  initializeKey: initializeKey,
  getKeyInfo: getKeyInfo,
  genPageKey: genPageKey,
  genParagraphKey: genParagraphKey,
  decodeKey: decodeKey,
  describeKey: describeKey,
  getBooks: getBooks,
  getSourceId: getSourceId,
  getUrl: getUrl
};


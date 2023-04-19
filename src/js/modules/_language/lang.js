/*
 * Support for language translation in code shared by CMI sources. Many modules in cmi-common
 * are used by the other sources and this module supplies translations for prompts and labels
 * that are set programatically.
 */
import notify from "toastr";

//the language object, will be null for English
let language = {_state_: "default"};

/*
 * Load language file for prompts set programatically
 *
 * English is the default
 * Non english languages are pass in
 */
export function setLanguage(lang) {
  language = lang;
}

/*
 * Get the translation for key [s:k].
 */
function keyValue(s, k) {

  if (!language[s]) {
    return null;
  }

  if (!k) {
    return language[s];
  }

  if (!language[s][k]) {
    return null;
  }

  return language[s][k];
}

/**
 * gs(key, def)
 *
 * @param {string} key - key containing two parts, s, k. s=section, k=key
 * @param {string} def - default value if key not found in language object
 * @returns {string}
 */
export function gs(key, def) {
  if (typeof key !== "string") {
    return def;
  }

  //default language
  if (language._state_ === "default") {
    return def;
  }

  let [s,k] = key.split(":");
  let value = keyValue(s, k);

  //if we didn't find a value return default preceded by '!'
  if (!value) {
    return `!${def}`;
  }

  return value;
}

/**
 * getString(key) - translate the argument to the initialized language or use
 * the default value if not initialized.
 *
 * Called by the __lang template function. We're looking for key's in the format
 * s:k:d. For all others we want to return null so the template function uses
 * the value originally passed in.
 *
 * @param {string} key - s:k:d, where s=section, k=key, d=default value
 * @returns {string} - null: no translation or not in expected format
 *                     translated value
 */
function getString(key) {
  if (typeof key !== "string") {
    return null;
  }

  //parse the key, it should contain three parts
  let skd = key.split(":");

  //valid strings contain two ':' delimiters
  if (skd.length !== 3) return null;

  let s = skd[0];
  let k = skd[1];
  let d = skd[2];

  //default language
  if (language._state_ === "default") {
    return d;
  }

  let value = keyValue(s, k);

  if (!value) {
    return d;
  }

  return value;
}

/*
 * This is a tagged template function that populates
 * a template string with values from the language
 * object.
 *
 * Note: This won't work when called before the language
 * file is loaded and ready.
 */
export function __lang(strings, ...values) {
  const tokens = values.map(value => {
    let t = getString(value);
    if (!t) {
      return value;
    }
    return t;
  });

  let newString = strings.reduce((result, string, i) => {
    let token = tokens[i];
    if (typeof token === "undefined") {
      token = "";
    }
    return `${result}${string}${token}`;
  }, "");

  return newString;
}



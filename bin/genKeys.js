
/*
 */
const fs = require('fs');
const newKey = require("../src/js/modules/_config/key");

//const args = process.argv.slice(2);
//const outputFile = "src/js/modules/_config/keyComp.js";

const config = {
  configDir: "../../cmi-oe/public/config",
  si: require("../../cmi-oe/src/js/modules/_config/si"),
  oldKey: require("../../cmi-oe/src/js/modules/_config/keyold"),
  outputFile: "./oeKeys.js"
};

//let inPath = "public/config";

//This file specifies which config files to read
let project = `${config.configDir}/project.json`;

/*
 * Read configuration json files
 */
function readFile(fn) {
  try {
    let config = fs.readFileSync(fn, 'utf8');
    return JSON.parse(config);
  }
  catch(e) {
    console.error("Can't read file: %s", fn);
    process.exit(1);
  }
}

/*
 * divide url into array
 */
function splitUrl(url) {
  let u = url;

  //remove leading "/"
  u = url.substr(1);

  //remove trailing '/' if it exists
  if (u[u.length-1] === "/") {
    u = u.substr(0, u.length - 1);
  }

  return u.split("/");
}

/*
 * Extract url's from config file
 */
function buildArray(cfg, array, level2 = false) {
  let part1 = "";
  for (let i=0; i < cfg.contents.length; i++) {
    if (cfg.contents[i].url) {
      if (!level2) {
        array.push(cfg.contents[i].url);
      }
      else {
        if (part1 === "") {
          part1 = array.pop();
        }
        array.push(`${part1}/${cfg.contents[i].url}/`);
      }
    }
    if (cfg.contents[i].contents) {
      buildArray(cfg.contents[i], array, true);
      part1 = "";
    }
  }
}

//start program

let contents = [];
let projectInfo = readFile(project);

//read json files
for (let i=0; i < projectInfo.books.length; i++) {
  contents[i] = readFile(`${config.configDir}/${projectInfo.books[i]}.json`);
}

const output = fs.createWriteStream(`${config.outputFile}`);
/*
output.write("module.exports = {\n");

output.write(`  sourceId: ${projectInfo.sourceId},\n`);
output.write(`  sid: "${projectInfo.sid}",\n`);
output.write(`  prefix: "/t/${projectInfo.sid}",\n`);
output.write(`  books: ${JSON.stringify(projectInfo.books)},\n`);

let bookIds = ["xxx", ...projectInfo.books];

output.write(`  bookIds: ${JSON.stringify(bookIds)},\n`);

output.write("\n  contents: {\n");
*/

newKey.initializeKey(config.si);
let results = {};

for (let i=0; i < contents.length; i++) {
  if (contents[i].bid === "acq") break;
  let array = [];
  buildArray(contents[i], array);
  results[contents[i].bid] = array.map(url => {
    return ({
      url: url,
      nk: newKey.genPageKey(url),
      ok: config.oldKey.genPageKey(url)
    });
  });


  //console.log("%o", array);
  //console.log("%o", results);
}

output.write(`    let keyTable = ${JSON.stringify(results, null, 2)},\n`);

/*
output.write("  }\n");
output.write("};\n");
*/
output.end();

console.log("Done!");



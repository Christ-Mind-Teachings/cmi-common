/*
  Bookmark data implementation

  Bookmarks for signed in users are queried from and stored to the server. See the
  cmi-api/bookmark repository for API.

  For signed in users, when a transcript page is loaded bookmarks are queried from the server
  and stored locally. Bookmarks for users not signed in are stored only to local storage.

  Operations for create, modify, and delete are performed locally and sent to the server
  for signed in users.
*/

import {
  postAnnotation as putAnnotation,
  deleteAnnotation as delAnnotation
} from "../_ajax/annotation";

import {
  getTopicList
} from "../_ajax/topics";

import {storeSet, storeGet} from "../_util/store";
import {localStore} from "./bookmark";

import notify from "toastr";
import cloneDeep from "lodash/cloneDeep";

import {getUserInfo} from "../_user/netlify";
import {gs} from "../_language/lang";

var g_sourceInfo = {};

export function netInit(si) {
  g_sourceInfo = si;
}

/*
 * Persist annotation to DynamoDb
 *
 * Args:
 *  annotation: required
 *  pageKey: passed by topicmanager.js only
 *  addToLocalStorage: passed as false by topicmanager
 *
 * LocalStorage is updated when addToLocalStorage = true, otherwise
 * not. It's not needed when called by topicmanager.
 *
 * New annotations are recognized when annotation.creationDdate is null
 */
function postAnnotation(annotation, pageKey, addToLocalStorage=true) {
  const userInfo = getUserInfo();
  let calledByTopicMgr = true;

  //the annotation creation data; aka creationDate, annotationId, aid
  let now = Date.now();

  //this is critical, things get messed up if we don't do this
  let serverAnnotation = cloneDeep(annotation);

  //modified is added by topicmgr.js
  if (serverAnnotation.modified) {
    delete serverAnnotation.modified;
  }

  let wrapFunction;
  if (serverAnnotation.selectedText) {
    //don't save wrap() to db but we do need it so save it and put
    //it back before we save it to local store
    wrapFunction = serverAnnotation.selectedText.wrap;
    delete serverAnnotation.selectedText.wrap;

    //selectedText is already stringified when called by topicmgr.js
    if (typeof serverAnnotation.selectedText !== "string") {
      if (!serverAnnotation.selectedText.aid) {
        serverAnnotation.selectedText.aid = now.toString(10);
      }

      //convert selectedText to JSON
      serverAnnotation.selectedText = JSON.stringify(serverAnnotation.selectedText);
    }
  }

  let creationDate = serverAnnotation.creationDate ? serverAnnotation.creationDate : now;
  if (!pageKey) {
    pageKey = g_sourceInfo.keyInfo.genParagraphKey(serverAnnotation.rangeStart);
  }

  putAnnotation(userInfo.userId, pageKey, creationDate, serverAnnotation).then((resp) => {
    if (addToLocalStorage) {
      if (serverAnnotation.selectedText) {
        serverAnnotation.selectedText = JSON.parse(serverAnnotation.selectedText);
        if (wrapFunction) {
          serverAnnotation.selectedText.wrap = wrapFunction;
        }
      }
      try {
        localStore.addItem(userInfo.userId, pageKey, creationDate, serverAnnotation);
      }
      catch(err) {
        console.error(`Error saving annotation to localStore: ${err}`);
      }
    }
  }).catch((err) => {
    console.error(`Error saving annotation: ${err}`);
    notify.error(gs("error1:e1"), "Unexpected number of data points in existing timing data, please inform Rick, Can't capture time until this is resolved.");
  });

  return creationDate;
}

/*
  Delete the annotation 'creationDate' for bookmark 'pid'
*/
function deleteAnnotation(pid, creationDate) {
  const userInfo = getUserInfo();
  return new Promise(async (resolve, reject) => {
    const paraKey = g_sourceInfo.keyInfo.genParagraphKey(pid);

    try {
      let response = await delAnnotation(userInfo.userId, paraKey, creationDate);
      let result = localStore.deleteItem(userInfo.userId, paraKey, creationDate);
      resolve(result.remaining);
    }
    catch(err) {
      reject(err);
    }
  });
}

/*
  Fetch Indexing topics
  args: force=true, get topics from server even when we have them cached

  topics are cached for 2 hours (1000 * 60sec * 60min * 2) before being requested
  from server
*/
function fetchTopics() {
  const userInfo = getUserInfo();
  let topics = storeGet("bmTopics");

  //keep topics in cache for 2 hours
  const retentionTime = 60 * 1000 * 60 * 2;

  return new Promise((resolve, reject) => {
    if (topics && ((topics.lastFetchDate + retentionTime) > Date.now())) {
      resolve(topics);
      return;
    }

    let sourceId = g_sourceInfo.sourceId.toString(10);

    //user signed in, we need to get topics from server
    getTopicList(userInfo.userId, sourceId)
      .then((topicList) => {
        let topicInfo = {
          lastFetchDate: Date.now(),
          topics: topicList
        };
        storeSet("bmTopics", topicInfo);
        resolve(topicInfo);
      })
      .catch((error) => {
        console.error("Error fetching topicList: ", error);
        reject(error);
      });
  });
}

export default {
  fetchTopics: fetchTopics,
  deleteAnnotation: deleteAnnotation,
  postAnnotation: postAnnotation
};


'use strict';

var Promise = require('bluebird');
var path = require('path');

var AnimelehtiRss = require('./AnimelehtiRss');
var News = require(path.join(__dirname, '..', 'models')).News;

var CACHED_NEWS_COUNT = 20;
var newsCache = [];

var UPDATE_INTERVAL = 60 * 60 * 1000; //Hour
var lastUpdate = false;
var updating = false;

module.exports = {

   getNews: function getNews(amount, callback) {

      amount = amount || 0;
      callback = (typeof callback === 'function') 
         ? callback 
         : noCallback;

      var updateNews = Promise.promisify(module.exports.updateNews);
      updateNews().then(function afterUpdate(result) {

         callback(null, module.exports.getNewsCache().slice(0, amount));
      });
   },

   getDateLastUpdated: function getLastUpdate() {
      return lastUpdate;
   },

   getNewsCache: function getNewsCache() {
      return newsCache;
   },

   updateNews: function updateNewsArray(callback) {

      var now = new Date();

      callback = (typeof callback === 'function') 
            ? callback 
            : noCallback;

      function updateIsNeeded(now, lastUpdate, updateInterval) {
         var timeFromLastUpdate = now - lastUpdate;
         return timeFromLastUpdate > updateInterval;
      }

      function waitForUpdateToBeDone(timeout, callback) {
         timeout = timeout || 100;

         if(updating) {
            console.log('Waiting for update to be done');
            setTimeout(waitForUpdateToBeDone, timeout, timeout, callback);
         } else {
            callback(null, false);
         }
      }

      if (!lastUpdate || updateIsNeeded(now, lastUpdate, UPDATE_INTERVAL) ) {
         if(!updating) {
            console.log('Updating news at ' + now.toLocaleString() + '.');
            updating = true;
            var pUpdateNews = Promise.promisify(updateNews);

            pUpdateNews().then(function afterUpdate(newNews) {
               return new Promise(function (resolve, reject) {

                  if( newsCache.length == 0 || newNews.length > 0) {
                     var update = Promise.promisify(updateCache);
                     update().then(function afterCacheUpdate(fetchedNews) {
                        resolve(true);
                     });
                  } else {
                     resolve(false);
                  } 
               });

            }).then(function lastly(result){
               if(result == true) {
                  console.log('Succesfully updated cache.');
               } else {
                  console.log('There was no need to update cache.');
               }
               lastUpdate = now;
               updating = false;
               if(callback) {
                  callback(null, true);
               }
            });
         } else {
            waitForUpdateToBeDone(1000, callback);
            
         }
         
      } else {
         console.log('No update was done at ' + now.toLocaleString() + '.');
         if(callback) {
            callback(null, false);
         }
      }
   }
}

function fetchNews(newsCount, callback) {
   var options = { 
      order: "pubDate DESC", 
      limit: newsCount
   };

   News.findAll(options).then(function (newsItems) {
      callback(null, newsItems);
   });
}

function noCallback(error, results) { 
   console.log('No callback function was provided.');
};

function updateCache(callback) {
   var fetch = Promise.promisify(fetchNews);
   fetch(CACHED_NEWS_COUNT).then(function afterFetch(fetchedNews){
      newsCache = fetchedNews;
      callback(null, fetchedNews);
   });
}

function updateNews (callback) {

   function getNewEntries() {
   
      function getLastUpdate() {
         return new Promise(function (resolve, reject) {

            var options = {
               order: "pubDate DESC",
               limit: 1
            };

            News.findAll(options).then(function afterGettingLatest(newsItems) {
               var lastUpdate;
               // In case there are no news in database with pubDate set
               if( newsItems.length == 0) {
                  lastUpdate = new Date(0);
               } else {
                  lastUpdate = newsItems[0].pubDate;
               }
               resolve(lastUpdate);
            });
         });
      }

      var lastUpdate = getLastUpdate();
      var getAnimelehtiNews = Promise.promisify(new AnimelehtiRss().makeRequest);

      return getAnimelehtiNews().filter(function filterOld(entry) {
         return entry.pubDate > lastUpdate.value();
      });
   }

   getNewEntries().each(function (newsItem) {
      newsItem.save().catch(function (e) {
         console.log(
            "Error while inserting news titled " 
               + newsItem.title 
               + ", possible dublicate"
         );
      });
   }).then(function (newNewsItems) {
      console.log("Inserted " + newNewsItems.length + " new news at " 
            + new Date().toLocaleString());
      callback(null, newNewsItems);
   }).catch(function (e) {
      console.log("Error while saving news : " + e);
      callback(e);
   });
}

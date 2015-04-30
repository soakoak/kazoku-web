'use strict';

var Promise = require('bluebird');
var path = require('path');

var Event = require(path.join(__dirname, '..', 'models')).Event;

var CACHE_SIZE = 20;
var cache = [];

var UPDATE_INTERVAL = 60 * 60 * 1000; //Hour
var lastUpdate = false;
var updating = false;

var WAIT_MESSAGE = 'In EventHandler waiting for update to be done.';


// replace this whenever making new class
function fetchEvents(count, callback) {
   var options = {
      order: 'endDate DESC'
   };

   Event.findAll(options).then(function lastly(items) {
      callback(null, items);
   });
}

function noCallback(error, results) {
   console.log('No callback function was provided.');
}

function updateCache(callback) {
   var fetch = Promise.promisify(fetchEvents);
   fetch(CACHE_SIZE).then(function afterFetch(fetchedItems) {
      cache = fetchedItems;
      callback(null, fetchedItems);
   });
}

module.exports = {

   getEvents: function getEvents(options, callback) {

      var amount = options.amount || CACHE_SIZE;
      // var lastDate = options.date || false; //TODO käytä suodatuksessa

      callback = (typeof callback === 'function')
         ? callback
         : noCallback;

      var update = Promise.promisify(module.exports.update);
      update().then(function afterUpdate(result) {

         callback(null, module.exports.getCache().slice(0, amount));
      });
   },

   getDateLastUpdated: function getLastUpdate() {
      return lastUpdate;
   },

   getCache: function getCache() {
      return cache;
   },

   update: function updateGlobalCache(callback) {

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

         if (updating) {
            console.log(WAIT_MESSAGE);
            setTimeout(waitForUpdateToBeDone, timeout, timeout, callback);
         } else {
            // The thread didn't make update, only waited for it to be done.
            callback(null, false);
         }
      }

      if (!lastUpdate || updateIsNeeded(now, lastUpdate, UPDATE_INTERVAL)) {
         if (!updating) {
            console.log('Updating events at ' + now.toLocaleString() + '.');
            updating = true;

            var pUpdateCache = Promise.promisify(updateCache);
            pUpdateCache().then(function lastly(result) {
               if (result === true) {
                  console.log('Succesfully updated event cache.');
               } else {
                  console.log('There was no need to update event cache.');
               }
               lastUpdate = now;
               updating = false;
               callback(null, true);
            });
         } else {
            waitForUpdateToBeDone(1000, callback);
         }

      } else {
         console.log('No event cache update was done at ' + now.toLocaleString() + '.');
         if (callback) {
            callback(null, false);
         }
      }
   }
};

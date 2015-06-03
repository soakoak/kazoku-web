'use strict';

var BPromise = require('bluebird');
var path = require('path');

var BlogRss = require('./BlogRss');
var models = require(path.join(__dirname, '..', 'models'));
var Blog = models.Blog;
var BlogMsg = models.BlogMsg;

var CACHE_SIZE = 20;
var cache = [];

var UPDATE_INTERVAL = 60 * 60 * 1000; //Hour
var lastUpdate = false;
var updating = false;

function fetchBlogPosts(count, callback) {
   var options = {
      attributes: ['title', 'link', 'pubDate', 'blogid'],
      order: 'pubDate DESC',
      limit: count
   };

   BlogMsg.findAll(options).map(function constructMessages(msg) {
      return new BPromise(function (resolve, reject) {

         function Message() {
            return;
         }

         Message.title = msg.title;
         Message.link = msg.link;
         Message.pubDate = msg.pubDate;

         Blog.findById(msg.blogid).then(function afterFindingBlog(blog) {
            Message.blog = {
               uri: blog.etusivu,
               name: blog.nimi
            };
         }).then(function afterEnteringBlogDetails() {
            resolve(Message);
         });

      });
   }).then(function afterConstruction(messages) {
      callback(null, messages);
   });
}

function noCallback(error, results) {
   console.log('No callback function was provided.');
}

function updateCache(callback) {
   var fetch = BPromise.promisify(fetchBlogPosts);
   fetch(CACHE_SIZE).then(function afterFetch(fetchedItems) {
      cache = fetchedItems;
      callback(null, fetchedItems);
   });
}

function updateBlogs(callback) {

   var options = {
      where: {
         id: { $ne: 4 }
      }
   };

   Blog.findAll(options).map(function afterGettingBlogs(blog) {
      return new BPromise(function (resolve, reject) {

         function getNewEntries(blog) {

            function getLastUpdate(blogId) {
               return new BPromise(function (resolve, reject) {

                  var getLastUpdateOptions = {
                     where: { blogid: blogId },
                     order: 'pubDate DESC',
                     limit: 1
                  };

                  BlogMsg.findAll(getLastUpdateOptions).then(function afterGettingLatest(items) {
                     var lastUpdate;
                     // In case there are no items in database with pubDate set
                     if (items.length === 0) {
                        lastUpdate = new Date(0);
                     } else {
                        lastUpdate = items[0].pubDate;
                     }
                     resolve(lastUpdate);
                  });
               });
            }

            var lastUpdate = getLastUpdate(blog.id);
            var getBlogEntries = BPromise.promisify(new BlogRss(blog).makeRequest);

            return lastUpdate.then(function () {
               return getBlogEntries();
            }).filter(function filterOld(entry) {
               return entry.pubDate > lastUpdate.value();
            });
         }

         getNewEntries(blog).each(function afterGettingNewEntries(item) {
            item.save().catch(function (e) {
               console.log(
                  'Error while inserting entry titled ' + item.title + '.'
               );
               reject(e);
            });
         }).then(function afterSavingItems(savedItems) {
            if (savedItems.length > 0) {
               console.log('Inserted ' + savedItems.length +
                  ' new entries for blog ' + blog.nimi + '.');
            } else {
               console.log('No new entries inserted for blog ' + blog.nimi + '.');
            }
            resolve(savedItems);
         }).catch(function (e) {
            console.log('Error while saving blog posts : ' + e);
            reject(e);
         });

      });
   }).then(function whenDone(savedItems) {
      callback(null, savedItems);
   });
}

module.exports = {

   getBlogPosts: function getBlogPosts(amount, callback) {

      amount = amount || 0;
      callback = callback || noCallback;

      var update = BPromise.promisify(module.exports.update);
      update().then(function afterUpdate(result) {

         callback(null, module.exports.getCache().slice(0, amount));
      });
   },

   getDateLastUpdates: function getLastUpdate() {
      return lastUpdate;
   },

   getCache: function getCache() {
      return cache;
   },

   update: function getFreshPostsAndUpdate(callback) {

      var now = new Date();

      callback = callback || noCallback;

      function updateIsNeeded(now, lastUpdate, updateInterval) {
         var timeFromLastUpdate = now - lastUpdate;
         return timeFromLastUpdate > updateInterval;
      }

      function waitForUpdateToBeDone(timeout, callback) {
         timeout = timeout || 100;

         if (updating) {
            console.log('In BlogHandler waiting for update to be done.');
            setTimeout(waitForUpdateToBeDone, timeout, timeout, callback);
         } else {
            // The thread didn't make update, only waited for it to be done.
            callback(null, false);
         }
      }

      if (!lastUpdate || updateIsNeeded(now, lastUpdate, UPDATE_INTERVAL)) {
         if (!updating) {
            console.log('Updating blogs at ' + now.toLocaleString() + '.');
            updating = true;
            // maybe parameterisable?
            var pUpdate = BPromise.promisify(updateBlogs);

            pUpdate().then(function afterUpdate(newItems) {
               return new BPromise(function (resolve, reject) {

                  if (cache.length === 0 || newItems.length > 0) {
                     var pUpdateCache = BPromise.promisify(updateCache);
                     pUpdateCache().then(function afterCacheUpdate(fetchedOnUpdate) {
                        resolve(true);
                     });
                  } else {
                     resolve(false);
                  }
               });

            }).then(function lastly(result) {
               if (result === true) {
                  console.log('Succesfully updated blog post cache.');
               } else {
                  console.log('There was no need to update blos post cache.');
               }
               lastUpdate = now;
               updating = false;
               if (callback) {
                  callback(null, true);
               }
            });
         } else {
            waitForUpdateToBeDone(1000, callback);
         }

      } else {
         console.log('No update was done at ' + now.toLocaleString() + '.');
         if (callback) {
            callback(null, false);
         }
      }
   }
};

'use strict';

var jade = require('jade')
var express = require('express');
var Intl = require('intl');
var path = require('path');
var Promise = require('bluebird');

var libs = '../libs/';
var CastRss = require(libs + 'KazokucastRss');
var BlogRss = require(libs + 'BlogRss');
var NewsHandler = require(libs + 'NewsHandler');
var models = require(path.join(__dirname, '..', 'models'));

var router = express.Router();
var news = [];
var casts = [];
var blogMsgs = [];
var MAX_BLOG_MSG_COUNT = 5;
var MAX_NEWS_COUNT = 3;
var UPDATE_INTERVAL = 60 * 60 * 1000; // Päivitystahti millisekunteina.

module.exports = router;

function updateNews () {
   var getNews = Promise.promisify(NewsHandler.getNews);
   getNews(MAX_NEWS_COUNT).then(function whenDone(newsItems) {
      news = newsItems;
   });
}

function updateBlogs() {

   var options = {
      where: {
         id: { $ne: 4 }
      }
   };

   models.Blog.findAll(options).each(function (blog) {

      function getBlogLastUpdated(blogId) {
         return new Promise(function (resolve, reject) {

            var options = {
               where: { blogid: blogId },
               order: "pubDate DESC",
               limit: 1
            };

            models.BlogMsg.findAll(options).then(function (msgs) {
               var lastUpdate;
               if( msgs.length == 0) {
                  lastUpdate = new Date(0);
               } else {
                  lastUpdate = msgs[0].pubDate;
               }
               resolve(lastUpdate);
            });
         });
      }

      function getNewEntries(blog) {

         var lastUpdate = getBlogLastUpdated(blog.id);
         var promisify = Promise.promisify;
         var getAllBlogEntries = promisify(new BlogRss(blog).makeRequest);

         return getAllBlogEntries().filter(function (entry) {
            return entry.pubDate > lastUpdate.value();
         });
      }

      getNewEntries(blog).each(function (message) {
         message.save();
      }).then(function (messages) {
         console.log("Saved " + messages.length
            + " new entries for blog " + blog.nimi);
      }).catch(function (e) {
         console.log("Error while entering new entries for blog " + blog.nimi);
      });
   }).finally(function () {

      refreshBlogList();
   });

   function refreshBlogList() {

      var options = {
            attributes: ['title', 'link', 'pubDate', 'blogid'],
            order: "pubDate DESC",
            limit: MAX_BLOG_MSG_COUNT
      };
      var tempBlogMsgs = new Array();

      models.BlogMsg.findAll(options).each(function (msg) {
         function Message() {
         }
         Message.title = msg.title;
         Message.link = msg.link;
         Message.pubDate = msg.pubDate;

         models.Blog.find(msg.blogid).then(function (blog) {
            Message.blog = {
               uri: blog.etusivu,
               name: blog.nimi
            }
         }).finally(function () {
            tempBlogMsgs.push(Message);
         });

      }).then(function () {
         blogMsgs = tempBlogMsgs;
         console.log("Blogs updated " + new Date().toLocaleString());
      });
   }
}

function updateCasts() {
   var join = Promise.join;
   var getCasts = Promise.promisify(new CastRss().makeRequest);

   getCasts().then(function(newCasts) {
      casts = newCasts;
      console.log("Casts updated " + new Date().toLocaleString());
   });
}

updateNews();
setInterval(updateNews, UPDATE_INTERVAL);
updateBlogs();
setInterval(updateBlogs, UPDATE_INTERVAL);
updateCasts();
setInterval(updateCasts, UPDATE_INTERVAL);

router.get('/', function(req, res) {
   res.render('index',
      {
         title: 'Kazoku',
         news: news,
         blogMsgs: blogMsgs,
         DateFormat: new Intl.DateTimeFormat('fi-FI'),
         TimeFormat: new Intl.DateTimeFormat('fi-Fi',
            {
               hour: 'numeric', minute: 'numeric'
            })
      });
});

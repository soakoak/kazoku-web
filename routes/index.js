'use strict';

var jade = require('jade')
var express = require('express');
var Intl = require('intl');
var path = require('path');
var Promise = require('bluebird');

var AnimelehtiRss = require('./AnimelehtiRss');
var CastRss = require('./KazokucastRss');
var BlogRss = require('./BlogRss');
var models = require(path.join(__dirname, '..', 'models'));

var router = express.Router();
var news = [];
var casts = [];
var blogMsgs = [];
var BLOG_MSG_MAX = 5;

function updateNews () {
   var promisify = Promise.promisify;
   var getAnimelehtiNews = promisify(new AnimelehtiRss().makeRequest);
   var MAX_NEWS_COUNT = 3;

   getAnimelehtiNews().each(function (newsItem) {
      newsItem.save().catch(function (e) {
         console.log(
            "Error while inserting news titled \"" 
            + newsItem.title 
            + "\", possible dublicate"
         );
      });
   }).then(function (newsItems) {
      console.log("Inserted any new news at " + new Date().toLocaleString());
   }).catch(function (e) {
      console.log("Error while entering news: " + e);
   }).finally(function() {
      refreshNewsList(MAX_NEWS_COUNT);
   });

   function refreshNewsList(newsCount) {
      var options = { 
         order: "pubDate DESC", 
         limit: newsCount
      };

      models.News.findAll(options).then(function (newsItems) {
         news = newsItems;
         console.log("News updated at " + new Date().toLocaleString());
      });
   }
}

function newsCompare(newsA, newsB) {
   return dateCompare(newsA.pubDate, newsB.pubDate);
}

function dateCompare(dateA, dateB) {
   if( dateA < dateB) {
      return 1;
   } else if( dateA === dateB) {
      return 0;
   } else {
      return -1;
   }
}

function updateBlogs() {

   models.Blog.findAll().each(function (blog) {

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
            limit: BLOG_MSG_MAX 
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

function updateCasts(logMsg) {
   var join = Promise.join;
   var getCasts = Promise.promisify(new CastRss().makeRequest);

   getCasts().then(function(newCasts) {
      casts = newCasts;
      console.log("Casts updated at " + new Date().toLocaleString());
   });
}

// Päivitystahti millisekunteina.
var delay = 60 * 60 * 1000; 
updateNews();
setInterval(updateNews, delay);
updateBlogs();
setInterval(updateBlogs, delay);
updateCasts();
setInterval(updateCasts, delay);

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

module.exports = router;

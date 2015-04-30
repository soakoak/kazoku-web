'use strict';

var express = require('express');
var Intl = require('intl');
var path = require('path');
var Promise = require('bluebird');

var libs = '../libs/';
var NewsHandler = require(libs + 'NewsHandler');
var BlogHandler = require(libs + 'BlogHandler');
var EventHandler = require(libs + 'EventHandler');

var router = express.Router();
var news = [];
var blogMsgs = [];
var events = [];
var MAX_BLOG_MSG_COUNT = 5;
var MAX_NEWS_COUNT = 3;
var UPDATE_INTERVAL = 60 * 60 * 1000; // Päivitystahti millisekunteina.

module.exports = router;

function updateNews() {
   var getNews = Promise.promisify(NewsHandler.getNews);
   getNews(MAX_NEWS_COUNT).then(function whenDone(newsItems) {
      news = newsItems;
   });
}

function updateBlogs() {
   var getBlogPosts = Promise.promisify(BlogHandler.getBlogPosts);
   getBlogPosts(MAX_BLOG_MSG_COUNT).then(function whenDone(items) {
      blogMsgs = items;
   });
}

function updateEvents() {
   var options = {
      amount: 1
   };

   var getEvents = Promise.promisify(EventHandler.getEvents);
   getEvents(options).then(function whenDone(items) {
      events = items;
   });
}

updateNews();
setInterval(updateNews, UPDATE_INTERVAL);
updateBlogs();
setInterval(updateBlogs, UPDATE_INTERVAL);
updateEvents();
setInterval(updateEvents, UPDATE_INTERVAL);


router.get('/', function (req, res) {
   res.render('index',
      {
         blogMsgs: blogMsgs,
         events: events,
         news: news,
         title: 'Kazoku',
         DateFormat: new Intl.DateTimeFormat('fi-FI'),
         TimeFormat: new Intl.DateTimeFormat('fi-Fi',
            {
               hour: 'numeric',
               minute: 'numeric'
            })
      });
});

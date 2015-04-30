'use strict';

var express = require('express');
var Intl = require('intl');
var path = require('path');
var Promise = require('bluebird');

var libs = '../libs/';
var NewsHandler = require(libs + 'NewsHandler');
var BlogHandler = require(libs + 'BlogHandler');

var router = express.Router();
var news = [];
var blogMsgs = [];
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

updateNews();
setInterval(updateNews, UPDATE_INTERVAL);
updateBlogs();
setInterval(updateBlogs, UPDATE_INTERVAL);

router.get('/', function (req, res) {
   res.render('index',
      {
         title: 'Kazoku',
         news: news,
         blogMsgs: blogMsgs,
         DateFormat: new Intl.DateTimeFormat('fi-FI'),
         TimeFormat: new Intl.DateTimeFormat('fi-Fi',
            {
               hour: 'numeric',
               minute: 'numeric'
            })
      });
});

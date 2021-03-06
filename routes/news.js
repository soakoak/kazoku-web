'use strict';

var express = require('express');
var Intl = require('intl');
var BPromise = require('bluebird');
var router = express.Router();

var libs = '../libs/';
var NewsHandler = require(libs + 'NewsHandler');

var news = [];
var MAX_NEWS_COUNT = 12;
var UPDATE_INTERVAL = 60 * 60 * 1000; // Päivitystahti millisekunteina.

module.exports = router;

function updateNews() {
   var getNews = BPromise.promisify(NewsHandler.getNews);
   getNews(MAX_NEWS_COUNT).then(function whenDone(newsItems) {
      news = newsItems;
   });
}

updateNews();
setInterval(updateNews, UPDATE_INTERVAL);

router.get('/', function (req, res) {
   res.render('news', {
      DateFormat: new Intl.DateTimeFormat('fi-FI'),
      news: news,
      title: 'Kazoku'
   });
});
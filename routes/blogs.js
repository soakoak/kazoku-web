'use strict';

var express = require('express');
var Intl = require('intl');
var BPromise = require('bluebird');
var router = express.Router();

var libs = '../libs/';
var Handler = require(libs + 'BlogHandler');

var blogPosts = [];
var MAX_POST_COUNT = 20;
var UPDATE_INTERVAL = 60 * 60 * 1000; // Päivitystahti millisekunteina.

module.exports = router;

function update() {

   var getBlogPosts = BPromise.promisify(Handler.getBlogPosts);
   getBlogPosts(MAX_POST_COUNT).then(function whenDone(items) {
      blogPosts = items;
   });
}

update();
setInterval(update, UPDATE_INTERVAL);

router.get('/', function (req, res) {
   res.render('blogs', {
      DateFormat: new Intl.DateTimeFormat('fi-FI'),
      blogMsgs: blogPosts,
      TimeFormat: new Intl.DateTimeFormat('fi-Fi',
         {
            hour: 'numeric',
            minute: 'numeric'
         }),
      title: 'Kazoku'
   });
});

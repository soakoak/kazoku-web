var FeedParser = require('feedparser');
var fs = require('fs');
var path = require('path');
var request = require('request');

var BlogMsg = require(path.join(__dirname, '..', 'models')).BlogMsg;

var lastResults = new Array();

module.exports = function (blog) {

   var rssOsoite = blog.rss;
   var feedparser = new FeedParser();
   var results = new Array();

   this.makeRequest = function (callback) {

      feedparser.on('end', function() {
         if(callback) {
            callback(null, results);
         }
         lastResults = results;
      });
      
      requestRss(rssOsoite, feedparser);
   }

   feedparser.on('error', function(err) {
      console.log(err);
   });
   feedparser.on('readable', function() {
      
      var stream = this;
      var item;
      while (item = stream.read()) {
         var msg = BlogMsg.build();
         msg.blogid = blog.id;
         msg.title = item.title;
         msg.link = item.link;
         msg.pubDate = new Date(item.pubDate);
         results.push(msg);
      }
   });
   
}

function requestRss (rssUri, feedparser) {

   var stream = request.get(rssUri);
   stream.on('error', handleError);

   stream.on('response', function (res) {
      res.pipe(feedparser);
   })

   function handleError(err) {
      console.log(err, err.stack);
      return process.exit(1);
   }
}

module.exports.lastResults = lastResults;
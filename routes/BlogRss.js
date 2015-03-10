var FeedParser = require('feedparser');
var request = require('request');
var fs = require('fs');
var path = require('path');

var BlogMsg = require(path.join(__dirname, '..', 'models')).BlogMsg;

var results = new Array();

module.exports = function (blog) {

   var rssOsoite = blog.rss;
   var feedparser = new FeedParser();

   this.makeRequest = function (callback) {
      results.length = 0;

      if(callback) {
         feedparser.on('end', function() {
            callback(null, results);
         });
      }
      
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
   stream.on('error', function (err) {
      console.log(err, err.stack);
      return process.exit(1);
   });
   stream.pipe(feedparser);
}

module.exports.result = results;
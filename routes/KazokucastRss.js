var FeedParser = require('feedparser');
var request = require('request');

var results = new Array();
var rssOsoite = "http://feeds.feedburner.com/Kazokucast?format=xml";

function requestRss (rssUri, feedparser) {
   var stream = request.get(rssUri);
   stream.on('error', function (err) {
      console.log(err, err.stack);
      return process.exit(1);
   });
   stream.pipe(feedparser);
}

module.exports.result = results;
module.exports = function () {

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
         //otetaan relevantit osat talteen ja liputetaan lähde
         function Cast() {
         }
         Cast.title = item.title;
         Cast.pubDate = new Date(item.pubDate);
         Cast.content = item["content:encoded"]['#'];

         results.push(Cast);
      }
   });
}
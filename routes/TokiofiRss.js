var FeedParser = require('feedparser');
var request = require('request');
var htmlstrip = require('htmlstrip-native');

var RssSources = require('./RssSources');

var results = new Array();
var rssOsoite = RssSources.tokiofi.uri;

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
         function Uutinen() {
         }
         Uutinen.source = RssSources.tokiofi.id;
         Uutinen.link = item.link;
         Uutinen.imageName = parseImageName(item.guid);

         function parseImageName(guid) {
            return guid.substr(-5, 5)
         }
      
         Uutinen.title = item.title;
         Uutinen.pubDate = new Date(item.pubDate);
         Uutinen.summary = htmlstrip.html_strip(item.summary).trim();
         results.push(Uutinen);
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
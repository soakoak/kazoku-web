'use strict';

var FeedParser = require('feedparser');

function DefaultFeedParser(rssItemHandler, callback) {

   var self = this;

   self.results = [];

   self.rssItemHandler = (typeof rssItemHandler === 'function') 
      ? rssItemHandler 
      : defaultItemHandler;

   function defaultItemHandler (item, callback) {
      console.log("item handled");
      callback(null, item);
   }

   self.callback = (typeof callback === 'function') 
      ? callback 
      : function noCallback() {};

}
DefaultFeedParser.prototype = new FeedParser();
DefaultFeedParser.prototype.constructor = DefaultFeedParser;
DefaultFeedParser.prototype._events = {
   end: function onEnd() {
      self.callback(null, results);
   },
   error: function onError(err) {
      console.log(err);
   },
   readable: function onReadable() {
      var stream = this;
      var item;
      while (item = stream.read()) {

         //TODO FIX THIS
         // self.rssItemHandler(item, function afterHandling(item) {
         //    console.log("item pushed");
         //    self.results.push(item);
         // });

//paste kokeilun helpottamiseksi:
/*
var PipedRequest = require('./PipedRequest');
var dfp = require('./DefaultFeedParser');
var uri = 'http://blog.toriman.net/rss.php';

var d = new dfp();
var piper = new PipedRequest(uri, d);
piper.pipe();
*/
      }
   }
}

module.exports = DefaultFeedParser;
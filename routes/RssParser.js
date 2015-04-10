'use strict';

var PipedRequest = require('./PipedRequest');
var DefaultFeedParser = require('./DefaultFeedParser');

var lastResult = [];

module.exports = function RssParser () {

   var self = this;
   this.makeRequest = function (rssAddress, callback) {

      callback = (typeof callback === 'function') 
         ? callback 
         : function() {};

      var feedparser = new DefaultFeedParser(self.handleRssItem, handleResults)

      function handleResults(results) {
         
      }
      var request = new PipedRequest(rssAddress, feedparser);
      request.pipe();
      
      requestRss(rssAddress, feedparser);
   }

   this.handleRssItem = function (item, callback) {
      callback = (typeof callback === 'function') 
         ? callback 
         : function() {};

      callback(null, item); 
   }
}


module.exports.lastResult = lastResult;
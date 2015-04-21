'use strict';

var FeedParserFactory = require('./FeedParserFactory');
var PipedRequest = require('./PipedRequest');

module.exports = KazokucastRss;

function KazokucastRss () {

   var self = this;
   
   this.targetUri = "http://feeds.feedburner.com/Kazokucast?format=xml";
   this.lastResult = [];

   this.makeRequest = function (callback) {

      callback = (typeof callback === 'function') 
            ? callback 
            : noCallback;

      function noCallback(error, results) { 
         console.log('No callback function was provided.');
      };

      function onEnd(error, results) {
         self.lastResults = results;
         callback(error, results);
      }

      var feedparser = FeedParserFactory.getKazokucastFeedParser(onEnd);
      var pipedRequest = new PipedRequest(self.targetUri, feedparser);

      pipedRequest.pipe();
   }
}
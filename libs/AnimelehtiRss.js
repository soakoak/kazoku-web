'use strict';

var FeedParserFactory = require('./FeedParserFactory');
var PipedRequest = require('./PipedRequest');

module.exports = AnimelehtiRss;

function AnimelehtiRss () {

   var self = this;
   var uri = "http://animelehti.fi/feed/";

   this.lastResults = [];

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

      var feedparser = FeedParserFactory.getAnimelehtiFeedParser(0, onEnd);
      var pipedRequest = new PipedRequest(uri, feedparser);
      pipedRequest.pipe();
   }
}

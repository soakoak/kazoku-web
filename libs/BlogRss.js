'use strict';

var FeedParserFactory = require('./FeedParserFactory');
var PipedRequest = require('./PipedRequest');

module.exports = function BlogRss(blog) {

   var self = this;

   this.targetUri = blog.rss;
   this.lastResults = [];

   this.makeRequest = function (callback) {

      function noCallback(error, results) {
         console.log('No callback function was provided.');
      }

      callback = callback || noCallback;

      function onEnd(error, results) {
         self.lastResults = results;
         callback(error, results);
      }

      var feedparser = FeedParserFactory.getBlogFeedParser(blog.id, onEnd);
      var pipedRequest = new PipedRequest(self.targetUri, feedparser);

      pipedRequest.pipe();
   };
};

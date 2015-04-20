'use strict';

var FeedParserFactory = require('./FeedParserFactory');
var PipedRequest = require('./PipedRequest');

module.exports = BlogRss;

function BlogRss (blog) {

   var self = this;

   this.targetUri = blog.rss;
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

      var feedparser = FeedParserFactory.getBlogFeedParser(blog.id, onEnd);
      var pipedRequest = new PipedRequest(self.targetUri, feedparser);

      pipedRequest.pipe();
   }
}

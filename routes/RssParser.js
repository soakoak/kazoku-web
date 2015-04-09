'use strict';

var FeedParser = require('feedparser');
var request = require('request');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');

var lastResult = [];

module.exports = function RssParser () {

   this.makeRequest = function (rssAddress, callback) {

      callback = (typeof callback === 'function') 
         ? callback 
         : function() {};
      
      requestRss(rssAddress, feedparser);
   }

   this.handleRssItem = function (item, callback) {
      callback = (typeof callback === 'function') 
         ? callback 
         : function() {};

      callback(null, item); 
   }

   function DefaultFeedParser(rssItemHandler, callback) {

      var self = this;
      var results = [];
      var feedparser = new FeedParser();

      var rssItemHandler = (typeof rssItemHandler === 'function') 
         ? rssItemHandler 
         : defaultItemHandler

      function defaultItemHandler (item, callback) {
         console.log("item handled");
         callback(null, item);
      }

      var callback = (typeof callback === 'function') 
         ? callback 
         : function noCallback() {};
      
      feedparser.on('error', function onError(err) {
         console.log(err);
      });

      feedparser.on('readable', function onReadable() {
         
         var stream = this;
         var item;
         while (item = stream.read()) {

            rssItemHandler(item, afterHandling);

            function afterHandling(item) {
               console.log("item pushed");
               self.results.push(item);
            }
         }
      });

      feedparser.on('end', function onEnd() {
         self.callback(null, results);
      });
   }
  
   function PipedRequest(uri, pipeTarget) {

      this.targetUri = uri;
      this.pipeTarget = pipeTarget;

      this.pipe = function() {
         var stream = request.get(uri);
         stream.on('error', handleError);
         stream.on('response', function onResponse(res) {
            res.pipe(pipeTarget);
         });
      }

      function handleError(err) {
         console.log(err, err.stack);
         return process.exit(1);
      }
   }
}


module.exports.lastResult = lastResult;
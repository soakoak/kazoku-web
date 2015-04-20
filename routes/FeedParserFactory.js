'use strict';

var fs = require('fs');
var FeedParser = require('feedparser');
var path = require('path');
var Promise = require('bluebird');
var request = require('request');

var News = require(path.join(__dirname, '..', 'models')).News;

module.exports = {

   getAnimelehtiFeedParser: function getAnimelehtiFeedParser(callback) {

      function downloadAnimelehtiImage(animelehtiImageName) {

         function formImagePath(imageName) {
            return path.join(__dirname, '..', 'public', 'images', 
               'uutiskuvat', imageName + ".jpg");
         }
         
         function formAnimelehtiNewsimageUri(imageName) {
            return 'http://animelehti.fi/wordpress/wp-content/resized/posticons/' + 
                  animelehtiImageName +'_668x170.jpg';
         }

         function downloadImage(requestUri, imagePath) {
            return new Promise(function (resolve, reject) {

               var imageStream = request(requestUri);
               var writeStream = fs.createWriteStream(imagePath);
               writeStream.on('error', function onError(err) {
                  console.log(err);
               });
               imageStream.pipe(writeStream);

               resolve(imagePath);
            });
         }

         var imagePath = formImagePath(animelehtiImageName);

         fs.exists(imagePath, function downloadIfNotExists(fileExists) {

            if(!fileExists) {
               var uri = formAnimelehtiNewsimageUri( animelehtiImageName);

               downloadImage(uri, imagePath).then(function afterDownload( path) {
                  console.log("Downloaded image " + path);
               });
            }
         });

      }

      function itemHandler(item, callback) {
         var news = News.build();
         news.source = 0;
         news.link = item.link;
         news.imageName = parseImageName(item.guid);

         function parseImageName(guid) {
            return guid.substr(-5, 5)
         }

         news.title = item.title;
         news.pubDate = new Date(item.pubDate);
         news.summary = item.summary;

         downloadAnimelehtiImage(news.imageName);

         callback(null, news);
      }

      var animelehtiFeedParser = module.exports.getDefaultFeedParser(
         itemHandler, callback);
      console.log('made animelehtifeedparser');

      return animelehtiFeedParser;
   },
   
   getBlogFeedParser: function getBlogFeedParser() {

   },

   getDefaultFeedParser: function getDefaultFeedParser(rssItemHandler, callback) {
      var self = this;
      var feedparser = new FeedParser();

      this.itemHandlerFunction = (typeof rssItemHandler === 'function') 
            ? rssItemHandler 
            : defaultItemHandler;

      function defaultItemHandler (item, callback) {
         console.log("Default item handler called - no procedures done.");
         callback(null, item);
      };

      this.callback = (typeof callback === 'function') 
            ? callback 
            : noCallback;

      function noCallback(error, items) { 
         console.log('No callback function was provided. Number of items handled: ' + 
            feedparser.results.length + ".");
      };

      feedparser.results = [];

      feedparser.on('end', function onEnd() {
         console.log('end');
         self.callback(null, feedparser.results);
      });

      feedparser.on('error', function onError(err) {
         console.log(err.stack);
      });

      feedparser.on('readable', function onReadable() {
         var stream = this;
         var item;
         while (item = stream.read()) {

            self.itemHandlerFunction(item, function afterHandling(error, item) {
               feedparser.results.push(item);
            });
         }
      });

      return feedparser;
   },

   getKazokucastFeedParser: function getKazokucastFeedParser() {

   }
}

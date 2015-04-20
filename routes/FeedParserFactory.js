'use strict';

var fs = require('fs');
var FeedParser = require('feedparser');
var path = require('path');
var Promise = require('bluebird');
var request = require('request');

var News = require(path.join(__dirname, '..', 'models')).News;
var BlogMsg = require(path.join(__dirname, '..', 'models')).BlogMsg;

module.exports = {

   getAnimelehtiFeedParser: function getAnimelehtiFeedParser(sourceId, callback) {

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
         news.source = sourceId;
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

      return animelehtiFeedParser;
   },
   
   getBlogFeedParser: function getBlogFeedParser(blogId, callback) {

      function itemHandler(item, callback) {
         var msg = BlogMsg.build();
         msg.blogid = blogId;
         msg.title = item.title;
         msg.link = item.link;
         msg.pubDate = new Date(item.pubDate);

         callback(null, msg);
      }

      var blogFeedParser = module.exports.getDefaultFeedParser(
         itemHandler, callback);

      return blogFeedParser;
   },

   getDefaultFeedParser: function getDefaultFeedParser(rssItemHandler, callback) {
      var feedparser = new FeedParser();

      rssItemHandler = (typeof rssItemHandler === 'function') 
            ? rssItemHandler 
            : defaultItemHandler;

      function defaultItemHandler (item, callback) {
         console.log("Default item handler called - no procedures done.");
         callback(null, item);
      };

      callback = (typeof callback === 'function') 
            ? callback 
            : noCallback;

      function noCallback(error, items) { 
         console.log('No callback function was provided. Number of items handled: ' + 
            feedparser.results.length + ".");
      };

      feedparser.results = [];

      feedparser.on('end', function onEnd() {
         callback(null, feedparser.results);
      });

      feedparser.on('error', function onError(err) {
         console.log(err.stack);
      });

      feedparser.on('readable', function onReadable() {
         var stream = this;
         var item;
         while (item = stream.read()) {

            rssItemHandler(item, function afterHandling(error, item) {
               feedparser.results.push(item);
            });
         }
      });

      return feedparser;
   },

   getKazokucastFeedParser: function getKazokucastFeedParser() {

   }
}

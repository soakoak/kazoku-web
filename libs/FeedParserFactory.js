'use strict';

var fs = require('fs');
var FeedParser = require('feedparser');
var path = require('path');
var BPromise = require('bluebird');
var request = require('request');

var News = require(path.join(__dirname, '..', 'models')).News;
var BlogMsg = require(path.join(__dirname, '..', 'models')).BlogMsg;

module.exports = {

   getAnimelehtiFeedParser: function getAnimelehtiFeedParser(sourceId, callback) {

      function downloadAnimelehtiImage(animelehtiImageName, callback) {

         function formAnimelehtiNewsimageUri(imageName) {
            return 'http://animelehti.fi/wordpress/wp-content/resized/posticons/' +
                  imageName + '_668x170.jpg';
         }

         function downloadImage(requestUri, imagePath) {
            return new BPromise(function (resolve, reject) {

               var imageStream = request(requestUri);
               var writeStream = fs.createWriteStream(imagePath);
               writeStream.on('error', function onError(err) {
                  console.log(err);
                  reject(err);
               });
               writeStream.on('finish', function onFinish() {
                  resolve(imagePath);
               })

               imageStream.pipe(writeStream);

            });
         }

         var imageFolder = path.join(__dirname, '..', 'public',
            'images', 'uutiskuvat');
         var imagePath = path.join(imageFolder, animelehtiImageName + '.jpg');

         fs.mkdir(imageFolder, function afterMakingFolder(err) {

            if(err && err.code != 'EEXIST') {
               console.log('Something unexpected happened making folder ' + imageFolder);
               callback(err);
            }

            var fopen = BPromise.promisify(fs.open);

            fopen(imagePath, 'r').catch(function onError(err) {
               var uri = formAnimelehtiNewsimageUri(animelehtiImageName);

               downloadImage(uri, imagePath).then(function afterDownload(path) {
                  console.log('Downloaded image ' + path);
                  callback(null, path);
               }).catch(function onError(err) {
                  console.log(err);
                  callback(err);
               });
            });
         });
      }

      function itemHandler(item, callback) {
         function parseImageName(guid) {
            return guid.substr(-5, 5);
         }

         var news = News.build();
         news.source = sourceId;
         news.link = item.link;
         news.imageName = parseImageName(item.guid);


         news.title = item.title;
         news.pubDate = new Date(item.pubDate);
         news.summary = item.summary;

         downloadAnimelehtiImage(news.imageName, function afterDownload(err, result) {
            callback(null, news);
         });
      }

      var animelehtiFeedParser = module.exports.getDefaultFeedParser(
         itemHandler,
         callback
      );

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
         itemHandler,
         callback
      );

      return blogFeedParser;
   },

   getDefaultFeedParser: function getDefaultFeedParser(rssItemHandler, callback) {
      var feedparser = new FeedParser();

      function defaultItemHandler(item, callback) {
         console.log('Default item handler called - no procedures done.');
         callback(null, item);
      }

      function noCallback(error, items) {
         console.log('No callback function was provided. Number of items handled: ' +
            feedparser.results.length + '.');
      }


      rssItemHandler = rssItemHandler || defaultItemHandler;

      callback = callback || noCallback;

      feedparser.results = [];

      feedparser.on('end', function onEnd() {
         callback(null, feedparser.results);
      });

      feedparser.on('error', function onError(err) {
         console.log(err.stack);
      });

      feedparser.on('readable', function onReadable() {
         function afterHandling(error, item) {
            feedparser.results.push(item);
         }

         var stream = this;
         var item;
         /* jshint -W084 */
         while (item = stream.read()) {
         /* jshint +W084 */
            rssItemHandler(item, afterHandling);
         }
      });

      return feedparser;
   },

   getKazokucastFeedParser: function getKazokucastFeedParser(callback) {

      function itemHandler(item, callback) {
         function Cast() {
            return;
         }
         Cast.title = item.title;
         Cast.pubDate = new Date(item.pubDate);
         Cast.content = item['content:encoded']['#'];

         callback(null, Cast);
      }

      var kazokucastFeedParser = module.exports.getDefaultFeedParser(
         itemHandler, callback);

      return kazokucastFeedParser;
   }
};

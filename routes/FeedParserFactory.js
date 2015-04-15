'use strict';

var FeedParser = require('feedparser');
var News = require(path.join(__dirname, '..', 'models')).News;
var RssSources = require('./RssSources');

module.exports = {

   getAnimelehtiFeedParser: function getAnimelehtiFeedParser(callback) {

      function downloadAnimelehtiImage(animelehtiImageName) {
         function imagePath(imageName) {
            return path.join(__dirname, '..', 'public', 'images', 
               'uutiskuvat', imageName + ".jpg");
         }

         function downloadImage(requestUri, imagePath) {
            return new Promise(function (resolve, reject) {

               var imageStream = request(requestUri);
               var writeStream = fs.createWriteStream(imagePath);
               writeStream.on('error', function(err) {
                  console.log(err);
               });
               imageStream.pipe(writeStream);

               resolve(imagePath);
            });
         }

      }

      function itemHandler(item, callback) {
         var news = News.build();
         news.source = RssSources.animelehti.id;
         news.link = item.link;
         news.imageName = parseImageName(item.guid);

         function parseImageName(guid) {
            return guid.substr(-5, 5)
         }

         news.title = item.title;
         news.pubDate = new Date(item.pubDate);
         news.summary = item.summary;

         downloadAnimelehtiImage(news.imageName);

         console.log('animelehti-item handled');
         callback(null, item);
      }

      function animelehtiCallback(error, items) {
         console.log('animelehti callback');
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
         console.log("item handled");
         callback(null, item);
      };

      this.callback = (typeof callback === 'function') 
      ? callback 
      : noCallback;

      function noCallback(error, items) { 
         console.log('no callback function was provided. Items handled: ' + 
            self.results.length);
      };

      this.results = [];

      feedparser.on('end', function onEnd() {
         console.log('end');
         self.callback(null, self.results);
      });

      feedparser.on('error', function onError(err) {
         console.log(err.stack);
      });

      feedparser.on('readable', function onReadable() {
         var stream = this;
         var item;
         while (item = stream.read()) {

            //TODO FIX THIS
            self.itemHandlerFunction(item, function afterHandling(error, item) {
               console.log("item pushed");
               self.results.push(item);
            });
         }
      });

      return feedparser;
   },

   getKazokucastFeedParser: function getKazokucastFeedParser() {

   }
}

/*
var PipedRequest = require('./PipedRequest');
var fpf = require('./FeedParserFactory');
var fp = fpf.getAnimelehtiFeedParser();

var uri = 'http://blog.toriman.net/rss.php';
var piper = new PipedRequest(uri, fp);
piper.pipe();
*/
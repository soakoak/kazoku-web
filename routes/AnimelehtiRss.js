var FeedParser = require('feedparser');
var request = require('request');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');

var RssSources = require('./RssSources');

var News = require(path.join(__dirname, '..', 'models')).News;

var lastResults = new Array();

module.exports = function () {

   var rssOsoite = RssSources.animelehti.uri;
   var feedparser = new FeedParser();
   var results = new Array();

   this.makeRequest = function (callback) {
      results.length = 0;

      feedparser.on('end', function() {
         if(callback) {
            callback(null, results);
         }
         lastResults = results;
      });
      
      requestRss(rssOsoite, feedparser);
   }

   feedparser.on('error', function(err) {
      console.log(err);
   });
   feedparser.on('readable', function() {
      
      var stream = this;
      var item;
      while (item = stream.read()) {
         //otetaan relevantit osat talteen ja liputetaan lähde
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
         results.push(news);

         var imagePath = imagePath(News.imageName);

         function imagePath(imageName) {
            return path.join(__dirname, '..', 'public', 'images', 'uutiskuvat', imageName + ".jpg");
         }
    
         fs.exists(imagePath, function (exists) {
            if (!exists) {
               var requestUri = 'http://animelehti.fi/wordpress/wp-content/resized/posticons/' + 
                     News.imageName +'_668x170.jpg';
               downloadImage( requestUri, imagePath).then(function (path) {
                  console.log("Downloaded image " + path);
               });
            }
         });

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
   });
   
}

function requestRss (rssUri, feedparser) {
   
   var stream = request.get(rssUri);
   stream.on('error', handleError);

   stream.on('response', function (res) {
      res.pipe(feedparser);
   })

   function handleError(err) {
      console.log(err, err.stack);
      return process.exit(1);
   }
}

module.exports.lastResults = lastResults;
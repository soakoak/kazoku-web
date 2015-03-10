var FeedParser = require('feedparser');
var request = require('request');
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');

var RssSources = require('./RssSources');

var results = new Array();
var rssOsoite = RssSources.animelehti.uri;

module.exports = function () {

   var feedparser = new FeedParser();

   this.makeRequest = function (callback) {
      results.length = 0;

      if(callback) {
         feedparser.on('end', function() {
            callback(null, results);
         });
      }
      
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
         function Uutinen() {
         }
         Uutinen.source = RssSources.animelehti.id;
         Uutinen.link = item.link;
         Uutinen.imageName = parseImageName(item.guid);

         function parseImageName(guid) {
            return guid.substr(-5, 5)
         }
      
         Uutinen.title = item.title;
         Uutinen.pubDate = new Date(item.pubDate);
         Uutinen.summary = item.summary;
         results.push(Uutinen);

         var imagePath = imagePath(Uutinen.imageName);

         function imagePath(imageName) {
            return path.join(__dirname, '..', 'public', 'images', 'uutiskuvat', imageName + ".jpg");
         }
    
         fs.exists(imagePath, function (exists) {
            if (!exists) {
               var requestUri = 'http://animelehti.fi/wordpress/wp-content/resized/posticons/' + 
                     Uutinen.imageName +'_668x170.jpg';
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
   stream.on('error', function (err) {
      console.log(err, err.stack);
      return process.exit(1);
   });
   stream.pipe(feedparser);
}

module.exports.results = results;
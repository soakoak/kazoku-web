'use strict';

var express = require('express');
var Intl = require('intl');
var Promise = require('bluebird');
var router = express.Router();

var libs = '../libs/';
var CastRss = require(libs + 'KazokucastRss');

var casts = [];
var UPDATE_INTERVAL = 60 * 60 * 1000; // Päivitystahti millisekunteina.

module.exports = router;


function updateCasts() {
   var getCasts = Promise.promisify(new CastRss().makeRequest);

   getCasts().then(function (newCasts) {
      casts = newCasts;
      console.log("Casts updated " + new Date().toLocaleString());
   });
}

updateCasts();
setInterval(updateCasts, UPDATE_INTERVAL);

router.get('/', function (req, res) {
   res.render('cast', {
      DateFormat: new Intl.DateTimeFormat('fi-FI'),
      casts: casts,
      title: 'Kazoku'
   });
});

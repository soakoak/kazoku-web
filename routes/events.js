'use strict';

var express = require('express');
var Intl = require('intl');
var BPromise = require('bluebird');

var libs = '../libs/';
var EventHandler = require(libs + 'EventHandler');

var router = express.Router();
var events = [];
var UPDATE_INTERVAL = 60 * 60 * 1000; // Päivitystahti millisekunteina.

module.exports = router;

function updateEvents() {
   var options = {
      // amount: 1
   };

   var getEvents = BPromise.promisify(EventHandler.getEvents);
   getEvents(options).then(function whenDone(items) {
      events = items;
   });
}

updateEvents();
setInterval(updateEvents, UPDATE_INTERVAL);

router.get('/', function (req, res) {
   res.render('events',
      {
         events: events,
         title: 'Kazoku',
         DateFormat: new Intl.DateTimeFormat('fi-FI'),
         TimeFormat: new Intl.DateTimeFormat('fi-Fi',
            {
               hour: 'numeric',
               minute: 'numeric'
            })
      });
});

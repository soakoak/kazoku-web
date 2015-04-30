'use strict';

var request = require('request');

module.exports = function PipedRequest(uri, pipeTarget) {

   var self = this;
   this.targetUri = uri;
   this.pipeTarget = pipeTarget;

   this.pipe = function() {
      var stream = request.get(self.targetUri);
      stream.on('error', handleError);
      stream.on('response', function onResponse(res) {
         res.pipe(self.pipeTarget);
      });
   };

   function handleError(err) {
      console.log(err, err.stack);
      return process.exit(1);
   }
};
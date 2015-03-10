var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.render('ircHelp', { title: 'Kazoku' });
});

module.exports = router;

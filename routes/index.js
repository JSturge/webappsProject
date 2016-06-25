var express = require('express');
var router = express.Router();
var moment = require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/formHandler', function(req,res){
  res.render('form');
});

router.post('/formHandler', function(req,res){
  console.log(req.body);
  res.render('form',req.body);
});

router.get('/madlibsHandler', function(req,res){
  res.render('madlibs');
});

router.post('/madlibsHandler', function(req,res){
  console.log(req.body);
  res.render('madlibs',req.body);
});

router.get('/', function(req,res) {
  res.render('index', { title: 'Express' });
});

router.get('/hello', function(req,res){
  res.render('hello', {title: 'Hello World'});
});

router.get('/session', function(req,res){
  var sess = req.session;
  if (sess.views){
    lastDate = lastd;
    sess.views++;
  } else {
    sess.views = 1;
    lastDate = moment().format('MMMM Do YYYY, h:mm:ss a');
  }
  var d = moment().format('MMMM Do YYYY, h:mm:ss a');
  var lastd = d;
  res.render('session', {
    title: 'Counting session',
    views: sess.views,
    dates: d,
    lastd: lastDate
  });

});

module.exports = router;

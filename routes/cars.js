var express = require('express');
var router = express.Router();
var pg = require('pg');

router.get('/', function(req, res, next) {
  res.render('cars');
});

/* GET cars home page. */
router.post('/carsOutput', function(req, res, next) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query(req.body.command, function(err, result) {
      done();
      if (err) {
        //response.json(err); // query failed
        // next function is used when something is wrong
        next(err); // throw error to error.hbs. only for test purpose
      } else {
        // response is HTTP response
        // json displays results object to string
        // result object have query result
        // rows is a list (from result object). rows[0] is the first row and so on
        // response.json(result.rows);
	console.log(result);
        res.render('carsOutput', result);
      }
    }); // client.query
    if (err){ // connection failed
      // response.json(err);
      next(err);
    }
  }); // pg.connect
});

module.exports = router;

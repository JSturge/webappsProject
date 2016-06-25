var express = require('express');
var router = express.Router();
var passport = require('passport');
var pg = require('pg').native; // var pg = require)'pg') for Local database users:
var bcrypt = require('bcryptjs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('examLogin', {error: req.flash('error')});
});

router.post('/',
  // depends on the fiels "isAdmin", redirect to the different path: admin or notAdmin
  passport.authenticate('local', { failureRedirect: '/exam', failureFlash:true }),
  function(req, res,next) {
    // res.json(req.user);
    // res.redirect('/users/profile')
    console.log(req.user);
    if (req.user.isadmin == 'admin'){
      res.redirect('/exam/admin');
    }
    else {
      res.redirect('/exam/notAdmin');
    }
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/exam'); // Successful. redirect to localhost:3000/exam
});


router.get('/finalChangePassword', function(req, res){
    res.render('finalChangePassword',{user: req.user});
});

function connectDB_changePWD(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    var pwd = encryptPWD(req.body.new1);
    client.query('SELECT * FROM users WHERE username = $1', [req.user.username], function(err, result) {
      console.log(req.user.username);
      // next();
      console.log(result);
      console.log(pwd);
      if(result.rows.length > 0){
    if(bcrypt.compareSync(req.body.current,result.rows[0].password) && (req.body.new1 == req.body.new2)){

    client.query('UPDATE users set password = $1 where username=$2', [pwd, req.user.username], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query INSERT");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      console.log("Password change is successful");
      res.render('finalChangePassword', {user: req.user , success: "true" });

    });

  } if(!bcrypt.compareSync(req.body.current,result.rows[0].password)) {
    res.render('finalChangePassword', {user: req.user , wrong: "true" });
  } if(req.body.new1 != req.body.new2) {
    res.render('finalChangePassword', {user: req.user , invalid: "true" });
  }
}
  });
};
}

router.post('/finalChangePassword', function(req, res,next){
  pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_changePWD(req,res,next));

});

function loggedIn(req, res, next) {
  if (req.user) {
    next(); // req.user exist so go to the next function (right after loggedIn)
  } else {
    res.redirect('/exam'); // user doesn't exisit
  }
}

///////////////////////////////////////////////////////////

function runQuery_notAdmin(req, res, client, done, next) {
  return function(err, result){
    if (err) {
      console.log("unable to query SELECT ");
      next(err); // throw error to error.hbs. only for test purpose
    }
    else {
      console.log(result);
      res.render('notAdmin', {rows: result.rows, user: req.user} );
    }
  };
} // client.query

function connectDB_notAdmin(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT * FROM assignment WHERE username=$1',[req.user.username], runQuery_notAdmin(req, res, client, done, next));
  };
}

router.get('/notAdmin',loggedIn,function(req, res, next){
      // connect DB and read table assignments
      pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_notAdmin(req,res,next));


});

///////////////////////////////////////////////////////////

router.get('/admin',loggedIn,function(req, res){
      // connect DB and read table assignments
      res.render('admin', { user: req.user }); //
});


function connectDB_addAssignment(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT * FROM users WHERE username = $1', [req.body.username], function(err, result) {
      if((result.rows.length > 0)){
    client.query('INSERT INTO assignment (username, description, due) VALUES($1, $2, $3)', [req.body.username, req.body.description,req.body.due], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query INSERT");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      console.log("Assignment creation is successful");
      res.render('addAssignment', {user: req.user , success: "true" });
    });
  } else {
    res.render('addAssignment', {user: req.user , fail: "true" });
  }
});
};
}
router.get('/addAssignment',function(req, res, next) {
  res.render('addAssignment', {user: req.user});
});

router.post('/addAssignment',function(req, res, next) {
  pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_addAssignment(req,res,next));
});

///////////////////////////////////////////////////////////

router.get('/signup',function(req, res) {
    res.render('examSignup', { user: req.user }); // signup.hbs
});
// check if username has spaces, DB will whine about that
function validUsername(username) {
  var login = username.trim(); // remove spaces
  return login !== '' && login.search(/ /) < 0;
}

function encryptPWD(password){
    var salt = bcrypt.genSaltSync(10);
    //console.log("hash passwords");
    return bcrypt.hashSync(password, salt);
}

///////////////////////////////////////////////////////////
function createUser(req, res, client, done, next){
  console.log("create account");
  var pwd = encryptPWD(req.body.password);
  client.query('INSERT INTO users (username, password,isadmin) VALUES($1, $2, $3)', [req.body.username, pwd, req.body.authority], function(err, result) {
    done(); // done all queries
    if (err) {
      console.log("unable to query INSERT");
      return next(err); // throw error to error.hbs. only for test purpose
    }
    else{
      console.log("User creation is successful");
      res.render('examSignup', { success: "true" });
    }
  });
}

function runQuery(req, res, client, done, next) {
  return function(err, result){
    if (err) {
      console.log("unable to query SELECT ");
      next(err); // throw error to error.hbs. only for test purpose
    }
    else if (result.rows.length > 0) {
      console.log("user exists");
      res.render('examSignup', { exist: "true" });
    }
    else {
      console.log("no user with that name");
      createUser(req, res, client, done, next);
    }
  };
} // client.query

function connectDB(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT * FROM users WHERE username=$1',[req.body.username], runQuery(req, res, client, done, next));
  };
}

router.post('/signup', function(req, res, next) {
    if (!validUsername(req.body.username)) {
      return res.render('examSignup', { invalid: "true" });
    }
    // Local database users:
    // pg.connect(process.env.DATABASE_URL, connectDB(req,res,next));
    pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB(req,res,next));
  });

module.exports = router;

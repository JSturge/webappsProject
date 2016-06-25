var express = require('express');
var router = express.Router();
var passport = require('passport');
var pg = require('pg').native; // var pg = require)'pg') for Local database users:
var bcrypt = require('bcryptjs');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('finalExamLogin', {error: req.flash('error')});
});

router.post('/',
  // depends on the fiels "isAdmin", redirect to the different path: admin or notAdmin
  passport.authenticate('local', { failureRedirect: '/finalExam', failureFlash:true }),
  function(req, res,next) {
    // res.json(req.user);
    // res.redirect('/users/profile')
    console.log(req.user);
    if (req.user.isadmin == 'admin'){
      res.redirect('/finalExam/finalAdmin');
    }
    else {
      res.redirect('/finalExam/finalNotAdmin');
    }
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/finalExam'); // Successful. redirect to localhost:3000/exam
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
    res.redirect('/finalExam'); // user doesn't exisit
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
      res.render('finalNotAdmin', {rows: result.rows, user: req.user} );
    }
  };
} // client.query

function connectDB_notAdmin(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT * FROM answertest3 WHERE username = $1',[req.user.username], runQuery_notAdmin(req, res, client, done, next));
  };
}

router.get('/finalNotAdmin',loggedIn,function(req, res, next){
      // connect DB and read table assignments
      pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_notAdmin(req,res,next));


});

function connectDB_addQuestion(req, res, next) {

  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }

    client.query('SELECT * FROM users WHERE username = $1', [req.body.user], function(err, result) {
      if((result.rows.length > 0)){
    client.query('INSERT INTO questiontest3 (sender, username, due, answer) VALUES($1, $2, $3, $4)', [req.user.username,req.body.user,req.body.due,req.body.question], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query INSERT");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      console.log("Your question was sent successfully");
      res.render('finaladdQuestion', {user: req.user , success: "true" });
    });
  } else {
    res.render('finaladdQuestion', {user: req.user , fail: "true" });
  }
});
};
}
router.get('/finaladdQuestion',function(req, res, next) {
  res.render('finaladdQuestion', {user: req.user});
  /*return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT * FROM questiontest3 WHERE sender=$1', ['student'], runQuery_Student(req, res, client, done, next));
  };*/
});

function runQuery_Student(req, res, client, done, next) {
  return function(err, result) {
    if(err) {
      console.log("unable to query SELECT ");
      next(err);
    }else {
      console.log(result);
      res.render('finaladdQuestion', {rows: result.rows, user: req.user});
    }
  };
}

router.post('/finaladdQuestion',function(req, res, next) {
  pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_addQuestion(req,res,next));
});


///////////////////////////////////////////////////////////

function runQuery_showAllTeachers(req, res, client, done, next) {
  return function(err, result){
    if (err) {
      console.log("unable to query SELECT ");
      next(err); // throw error to error.hbs. only for test purpose
    }
    else {
      console.log(result);
      res.render('showAllTeachers', {rows: result.rows, user: req.user} );
    }
  };
} // client.query

function connectDB_showAllTeachers(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT username FROM users WHERE isAdmin = $1',['admin'], runQuery_showAllTeachers(req, res, client, done, next));
  };
}

router.get('/showAllTeachers',loggedIn,function(req, res, next){
      // connect DB and read table assignments
      pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_showAllTeachers(req,res,next));


});

///////////////////////////////////////////////////////////

function runQuery_Admin(req, res, client, done, next) {
  return function(err, result){
    if (err) {
      console.log("unable to query SELECT ");
      next(err); // throw error to error.hbs. only for test purpose
    }
    else {
      console.log(result);
      res.render('finalAdmin', {rows: result.rows, user: req.user} );
    }
  };
} // client.query

function connectDB_Admin(req, res, next) {
  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }
    client.query('SELECT * FROM questiontest3 WHERE username = $1',[req.user.username],runQuery_Admin(req, res, client, done, next));
  };
}

router.get('/finalAdmin',loggedIn,function(req, res, next){
      // connect DB and read table assignments
      pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_Admin(req,res,next));
});


function connectDB_AddAnswer(req, res, next) {

  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }

    client.query('SELECT * FROM users WHERE username = $1', [req.body.username], function(err, result) {
      if((result.rows.length > 0)){
    client.query('INSERT INTO answertest3 (received, username, due, answer) VALUES($1, $2, $3, $4)', [req.user.username,req.body.username,req.body.due,req.body.answer], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query INSERT");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      console.log("Your answer was sent successfully");
      res.render('finalAddAnswer', {user: req.user , success: "true" });
    });
  } else {
    res.render('finalAddAnswer', {user: req.user , fail: "true" });
  }
});
};
}
router.get('/finalAddAnswer',function(req, res, next) {
  res.render('finalAddAnswer', {user: req.user});
});

router.post('/finalAddAnswer',function(req, res, next) {
  pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_AddAnswer(req,res,next));
});

///////////////////////////////////////////////////////////

function connectDB_deleteTeacherMessage(req, res, next) {

  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }

    client.query('SELECT * FROM users WHERE username = $1', [req.user.username], function(err, result) {
      if((result.rows.length > 0)){
    client.query('DELETE FROM questiontest3 WHERE id = $1', [req.body.remove], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query INSERT");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      console.log("Message was successfully deleted");
      res.render('finalDeleteAdmin', {user: req.user , success: "true" });
    });
  } else {
    res.render('finalDeleteAdmin', {user: req.user , fail: "true" });
  }
});
};
}
router.get('/finalDeleteAdmin',function(req, res, next) {
  res.render('finalDeleteAdmin', {user: req.user});
});

router.post('/finalDeleteAdmin',function(req, res, next) {
  pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_deleteTeacherMessage(req,res,next));
});


//////////////////////////////////////////////////////////

function connectDB_deleteStudentMessage(req, res, next) {

  return function(err, client, done) {
    if (err){ // connection failed
      console.log("Unable to connect to database");
      return next(err);
    }

    client.query('SELECT * FROM users WHERE username = $1', [req.user.username], function(err, result) {
      if((result.rows.length > 0)){
    client.query('DELETE FROM answertest3 WHERE id = $1', [req.body.remove], function(err, result) {
      done(); // done all queries
      if (err) {
        console.log("unable to query INSERT");
        return next(err); // throw error to error.hbs. only for test purpose
      }
      console.log("Message was successfully deleted");
      res.render('finalDeleteStudent', {user: req.user , success: "true" });
    });
  } else {
    res.render('finalDeleteStudent', {user: req.user , fail: "true" });
  }
});
};
}
router.get('/finalDeleteStudent',function(req, res, next) {
  res.render('finalDeleteStudent', {user: req.user});
});

router.post('/finalDeleteStudent',function(req, res, next) {
  pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB_deleteStudentMessage(req,res,next));
});





//////////////////////////////////////////////////////////

router.get('/finalExamSignup',function(req, res) {
    res.render('finalExamSignup', { user: req.user }); // signup.hbs
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
  client.query('INSERT INTO users (username, password,isadmin) VALUES($1, $2, $3)', [req.body.username, pwd, req.body.accounttype], function(err, result) {
    done(); // done all queries
    if (err) {
      console.log("unable to query INSERT");
      return next(err); // throw error to error.hbs. only for test purpose
    }
    else{
      console.log("User creation is successful");
      res.render('finalExamSignup', { success: "true" });
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
      res.render('finalExamSignup', { exist: "true" });
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

router.post('/finalExamSignup', function(req, res, next) {
    if (!validUsername(req.body.username)) {
      return res.render('finalExamSignup', { invalid: "true" });
    }
    // Local database users:
    // pg.connect(process.env.DATABASE_URL, connectDB(req,res,next));
    pg.connect(process.env.DATABASE_URL + "?ssl=true", connectDB(req,res,next));
  });

module.exports = router;

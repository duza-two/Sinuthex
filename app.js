var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var exphbs = require("express-handlebars");
var expressValidator = require("express-validator");
var flash = require("connect-flash");
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var mongo = require("mongodb");
var mongoose = require("mongoose");
var multer = require('multer');

// Connecting to the database
mongoose.connect('mongodb://duza-two:' + process.env.MONGO_ATLAS_PW + '@node-rest-shop-shard-00-00-vlgre.mongodb.net:27017,node-rest-shop-shard-00-01-vlgre.mongodb.net:27017,node-rest-shop-shard-00-02-vlgre.mongodb.net:27017/sinuthex?ssl=true&replicaSet=node-rest-shop-shard-0&authSource=admin'
);
var db = mongoose.connection;

var routes = require('./routes/index');
var users = require('./routes/users');

// Database
var Blog = require('./models/article');

// Set The Storage Engine
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init Upload
const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

//Init app
var app = express();

//view Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');

// BodyParser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express session
app.use(session({
  secret: 'Xs8eZd8rXn',
  saveUninitialized: true,
  resave: true
}));

// Passport Init
app.use(passport.initialize());
app.use(passport.session());

// Express validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param: formParam,
      msg  : msg,
      value: value
    };
  }
}));

// Connect flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Redirect requests to routes directory
app.use('/', routes);
app.use('/users', users);

// Image post
app.post('/upload', function(req, res) {
  upload(req, res, function(err) {
    if(err){
      res.render('index', {
        msg: err
      });
    } else {
      let blog = Blog();
      console.log(req.file);
      blog.fieldname = req.file.fieldname;
      blog.originalname = req.file.originalname;
      blog.encoding = req.file.encoding;
      blog.mimetype = req.file.mimetype;
      blog.destination = req.file.destination;
      blog.filename = req.file.filename;
      blog.path = req.file.path;
      blog.size = req.file.size;
      blog.title = req.body.title;
      blog.author = req.body.author;
      blog.body = req.body.body;
      blog.save(function(err){
        if(err){
            console.log(err);
            return;
        } else {
            res.redirect('/users/articles');
        }
    });
    }
  });
});

// Handle 404
 app.use(function(req, res) {
   res.status(400);
   res.render('404');
 });

 // Handle 500
 app.use(function(error, req, res, next) {
   res.status(500);
   res.render('500');
 });

// Set Port
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
  console.log('Server started on port ' +app.get('port'));
});
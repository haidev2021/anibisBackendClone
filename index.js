// import {Xxx} from './xbase/xbase'
var express = require('express');
var path = require('path');

var app = express();
var user = require('./routes/user/user')
// var post = require('./routes/post/post')
var xbase = require('./routes/xbase/xbase')
var image = require('./routes/image/image');
var advert = require('./routes/advert/advert');
var blog = require('./routes/blog/blog');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
var utils = require('./routes/utils'); 
var expressMongoDb = require('express-mongo-db');

const { OAuth2Client } = require('google-auth-library');
const oa2client = new OAuth2Client("995394072364-ofmveaus4p5q69n8p9ei5o350o3sa7un.apps.googleusercontent.com");


const PORT = 3003;
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '/static')));
app.use(session({ secret: 'my-secret-blah-blah-blah' }));
app.use(cookieParser());
app.use('/image', image);
app.use(expressMongoDb('mongodb://localhost:27017/Ranibis'));

app.listen(PORT, '192.168.0.105',
  function () {
    console.log('started listen port', PORT);
  });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const entities = [user, xbase, advert, blog];
utils.bunbleResponse(entities, app);


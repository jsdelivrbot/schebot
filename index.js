var express = require('express');
var http = require('http');
var app = express();
var api = require('instagram-node').instagram();
var request = require("request");
var bodyParser = require('body-parser')
var moment = require('moment')
var momentTz = require('moment-timezone');


var InstagramAPI = require('instagram-api');
var accessToken = '55502361.179b7e3.aadfa417c1584a3cb64dc6c8b45816f6';//'23612221.3fcb46b.348431486f3a4fb85081d5242db9ca1c';
var instagramAPI = new InstagramAPI(accessToken);


const InstagramNodeApi = require('instagram-node-api');
const instagramNodeApi = new InstagramNodeApi(accessToken);


Instagram = require('instagram-node-lib');
Instagram.set('client_id', '179b7e3894764c9dad6bdce62d422949');
Instagram.set('client_secret', 'ba85a46e88db41919aa22fcc175324a8');



app.set('port', (process.env.PORT || 5000));
// app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

app.get('/', function (request, response) {
  response.render('pages/index');
});


// app.configure(function() {
//   // The usual... 
// });

var Clients = {
  client_id: '179b7e3894764c9dad6bdce62d422949',
  client_secret: 'ba85a46e88db41919aa22fcc175324a8'
};
api.use(Clients);
var redirect_uri = 'https://afternoon-coast-78677.herokuapp.com/handleauth';


exports.authorize_user = function (req, res) {
  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['basic+public_content'] }));
};

exports.handleauth = function (req, res) {
  api.authorize_user(req.query.code, redirect_uri, function (err, result) {
    if (err) {
      console.log(err.body);
      res.send("denied");
    } else {
      console.log('Yay! Access token is ' + result.access_token);

      // api.use({ access_token: result.access_token });
      api.add_user_subscription('https://afternoon-coast-78677.herokuapp.com/user', { verify_token: result.access_token }, function (err, result, remaining, limit) {
        if (err) res.send(err);
        if (!err) res.send(result);
      });
      // res.send('You made it!! access_token is ' + result.access_token);
    }
  });
};

// This is where you would initially send users to authorize 
app.get('/authorize_user', exports.authorize_user);
// This is your redirect URI 
app.get('/handleauth', exports.handleauth);

http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});

app.post('/url', function (req, res) {
  var hub_chanllenge = req.query['hub.challenge'];
  // var verify_token = req.params.hub.verify_token;
  console.log(hub_chanllenge);
  console.log("call back")
  res.send(hub_chanllenge);
});

app.get('/url', function (req, res) {
  var hub_chanllenge = req.query['hub.challenge'];
  // var verify_token = req.params.hub.verify_token;
  console.log(hub_chanllenge);
  console.log("call back")
  res.send(hub_chanllenge);
});

app.post('/test', function (req, res) {
  var test = req.body[0].value;
  console.log(test);
});

app.get('/media', function (req, res) {
  instagramNodeApi.user('333cyj333');
  instagramNodeApi.on('data', (profile, meta, remaining, limit, result) => {
    console.log(profile);
  });
  // instagramNodeApi.usersSelf();
  // instagramNodeApi.on('data', (profile, meta, remaining, limit, result) => {
  //     console.log(profile);
  // });
});

app.get('/subscribe', function (request, response) {
  Instagram.subscriptions.handshake(request, response);
});

app.get('/getJson', function (req, res) {
  var url = 'https://www.instagram.com/333cyj333/media/';
  request({
    url: url,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
      //RECENT PICTURE
      var itemLen = body.items.length;
      console.log(itemLen);

      var type = body.items[0].type;
      var link = body.items[0].link;
      //IMAGE TYPE
      if (type == "image") {
        //IMAGE URL
        var url = body.items[0].images.standard_resolution.url;
        console.log("url :  " + url);


        //CAPTION
        var txtcaption
        var Chkcaption = body.items[0].caption;
        if (Chkcaption !== null) {
          txtcaption = body.items[0].caption.text;
        }
        if (Chkcaption == null) {
          txtcaption = "";
        }
        console.log(txtcaption);
      }


      //CHECK TIME
      var created_time = body.items[0].created_time;
      var timestamp_ct = moment.unix(created_time);
      var currenttime = moment().format();
      var currentimeKR = momentTz.tz(currenttime, "Asia/Seoul");
      console.log("current time : " + currenttime);
      console.log("currenttimeKR : " + currentimeKR.format('YYYY-MM-DD HH:mm'))
      var lastMin = currentimeKR.subtract(1, 'minute').format('YYYY-MM-DD HH:mm');
      console.log("last min : " + lastMin);
      res.send(timestamp_ct) // Print the json response
      console.log("post created : " + timestamp_ct.format('YYYY-MM-DD HH:mm'));

    }
  })
});


// app.listen(app.get('port'), function() {
//   console.log('Node app is running on port', app.get('port'));
// });



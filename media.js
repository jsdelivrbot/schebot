var express = require('express');
var http = require('http');
var app = express();
var request = require("request");
var bodyParser = require('body-parser')
var moment = require('moment')
var momentTz = require('moment-timezone');


app.set('port', (process.env.PORT || 5000));
// app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));


app.use(bodyParser.json());

app.get('/', function (request, response) {
  response.render('pages/index');
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
      var currenttime = moment().format('YYYY-MM-DD HH:mm:00');
      var currentimeKR = momentTz.tz(currenttime, "Asia/Seoul");
      console.log("current time : " + currenttime);
      console.log("currenttimeKR : " + currentimeKR.format('YYYY-MM-DD HH:mm:00'))
      var lastMin = currentimeKR.subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
      console.log("last min : " + lastMin);
      res.send(timestamp_ct) // Print the json response
      console.log("post created : " + timestamp_ct.format('YYYY-MM-DD HH:mm:00'));

    }
  })
});


http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});
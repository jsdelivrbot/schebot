var express = require('express');
var http = require('http');
var https = require('https');
var app = express();
var request = require("request");
var fs = require('fs');
var bodyParser = require('body-parser')
var moment = require('moment')
var momentTz = require('moment-timezone');
var TwitterPackage = require('twitter');
var Agenda = require('agenda');
const socketIO = require('socket.io');




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
var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});




//TEST WEBHOOK

// twitter authentication'
var twitter_oauth = {
  consumer_key: 'XPRMyf0XEgjKlAG1msgShdiFb',
  consumer_secret: 'cZhBVhc17vNPxYav4m7BhuYGA9aNgId8WdmokzwBl66uEfY1XD',
  token: '703675814127149057-kOwkJZv2I13y8XMOAK25PsveujO0nVk',
  token_secret: '1qCnQTtfuXEq9q3SVzqbYGgxmbvykytY98MQBeiE5w81M'
}
// console.log(twitter_oauth);
var WEBHOOK_URL = 'https://gotyjstagram.herokuapp.com/webhooks/twitter'

// var auth = require('./auth');
// request options
var request_options = {
  url: 'https://api.twitter.com/1.1/account_activity/webhooks.json',
  oauth: twitter_oauth,
  headers: {
    'Content-type': 'application/x-www-form-urlencoded'
  },
  form: {
    url: WEBHOOK_URL
  }
}

// POST request to create webhook config
request.post(request_options, function (error, response, body) {
  console.log(body)
})


/**
 * Receives challenge response check (CRC)
 **/
app.get('/webhooks/twitter', function (request, response) {

  var crc_token = request.query.crc_token

  var hash = security.get_challenge_response(crc_token, twitter_config.consumer_secret)

  response.send({
    response_token: 'sha256=' + hash
  })
})
app.post('/webhooks/twitter', function (request, response) {
  // Your custom bot logic will start here

  console.log(request.body)

  response.send('200 OK')
});







// var io = require('socket.io').listen(27017);
// io.sockets.on('connection', function (socket) {
//   connectedSockets.push(socket);
//   console.log(connectedSockets)
//   console.log("-- Socket Connected -- ")

// });




// app.post('/fetchJson/:username', function (req, res) {
var username = "333cyj333";
var url = `https://www.instagram.com/${username}/media/`;
var cacheFile = './public/media/cachefile.json';
var connectedSockets = [];

function fetchJson() {
  //CheckMedia if file change
  console.log("start check media");
  var num = 0;
  var username = "333cyj333";
  var url = `https://www.instagram.com/${username}/media/`;
  CheckMedia(num, username, url);

  https.get(url, function (res) {
    body = '';

    res.on('data', function (data) {
      body += data;
    });

    res.on('end', function () {
      fs.writeFileSync(cacheFile, body);
      setTimeout(fetchJson, 60000); // Fetch it again in a 60 second
    });
  })
}
// fetchJson(); // Start fetching to our JSON cache

// Start watching our cache file
fs.watch(cacheFile, function (event, filename) {
  if (event == 'change') {
    console.log("-- File Change -- ")
    fs.readFile('./public/media/cachefile.json', function (err, data) {
      if (!err) {
        connectedSockets.forEach(function (socket) {
          socket.emit('data', JSON.parse(data));//JSON.parse(data)
          console.log("-- emited data --")
        });
      }
    });


  }
});
const io = socketIO(server);
io.on('connection', (socket) => {
  console.log('\n\nClient connected');
  connectedSockets.push(socket);
  socket.on('disconnect', () => console.log('\n\nClient disconnected'));
  socket.on("error", (err) => {
    console.log(err);
    socket.destroy();
  });
  socket.on('close', function (exception) {
    console.log('SOCKET CLOSED');
  })
});

// setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
// res.sendStatus(400);

// });

app.get('/', function (request, response) {
  response.render('pages/index');
});







var download = function (uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(`./public/media/${filename}`)).on('close', callback);
  });
};



// app.get('/watchfile', function (req, res) {
//   fs.watchFile('carousel.json', (curr, prev) => {
//     console.log(`the current mtime is: ${curr.mtime}`);
//     console.log(`the previous mtime was: ${prev.mtime}`);
//   });
//   res.sendStatus(200);
// });




app.post('/getJson/:username/:num', function (req, res) {

  // var jobname = req.params.jobname;
  var num = req.params.num;
  var username = req.params.username;
  var url = `https://www.instagram.com/${username}/media/`;

  CheckMedia(num, username, url);
  res.sendStatus(200);
});



function CheckMedia(num, username, url) {

  //START
  request({
    url: url,
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      //RECENT PICTURE
      var itemLen = body.items.length;
      console.log("itemLength :  " + itemLen);

      var type = body.items[num].type;
      var link = body.items[num].link;
      var code = body.items[num].code;


      //CAPTION
      var txtcaption
      var Chkcaption = body.items[num].caption;
      if (Chkcaption !== null) {
        txtcaption = body.items[num].caption.text;
      }
      if (Chkcaption == null) {
        txtcaption = "";
      }
      console.log("CAPTION : " + txtcaption);




      //CHECK TIME
      var created_time = body.items[num].created_time;
      var timestamp_ct = moment.unix(created_time);
      var timestamp_ct_format = timestamp_ct.format('YYYY-MM-DD HH:mm:00');

      var create_time_KR = momentTz.tz(timestamp_ct, "Asia/Seoul").format('MMM DD YYYY, HH:mm');
      var currenttime = moment().format('YYYY-MM-DD HH:mm:00');
      var currentimeKR = momentTz.tz(currenttime, "Asia/Seoul");
      // console.log("create_time_KR : " + create_time_KR.format('YYYY-MM-DD HH:mm:00'));
      // console.log("current time : " + currenttime);
      // console.log("currenttimeKR : " + currentimeKR.format('YYYY-MM-DD HH:mm:00'))

      var lastMin = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
      var lastMin_KR = momentTz.tz(lastMin, "Asia/Seoul").format('YYYY-MM-DD HH:mm:00');
      console.log("last min : " + lastMin);
      // console.log("last min KR : " + lastMin_KR);
      console.log("timestamp_ct_format : " + timestamp_ct_format);

      // console.log("create_time_KR : " + create_time_KR);
      var chkDate = moment(timestamp_ct_format).isSame(lastMin); // true

      // res.send(timestamp_ct_format + lastMin);
      console.log(chkDate);
      if (chkDate == true) {
        console.log("---- New Post ---")

        //TEXT TWEET
        var fistfixedTxt = "[YOUNGJAESTAGRAM] ";
        var hashtagLink = "\n#영재 #GOT7\n" + link + "\n";
        var timestmp = create_time_KR;
        console.log("timestmp : " + timestmp);

        var txtLeft = 140 - fistfixedTxt.length - hashtagLink.length - timestmp.length - 3;
        console.log("txtLeft : " + txtLeft);

        var igcaption;
        if (txtcaption.length > txtLeft) {
          console.log("-- ig caption too long -- ")
          igcaption = txtcaption.substring(0, txtLeft) + "...";
        }
        if (txtcaption.length <= txtLeft) {
          console.log("-- ig caption NOT too long -- ")
          igcaption = txtcaption;
        }
        console.log("IG CAPTION : " + igcaption);

        var total_msg_tweet = fistfixedTxt + igcaption + hashtagLink + timestmp;
        console.log("total_msg_tweet :\n" + total_msg_tweet)





        //IMAGE TYPE
        if (type == "image") {
          //IMAGE URL
          var url = body.items[num].images.standard_resolution.url;
          console.log("url :  " + url);

          var stream = request(url).pipe(fs.createWriteStream(`./public/media/${code}.jpg`));
          stream.on('finish', function () {
            console.log('---stream done---')
            //POST TWITTER
            console.log("start tweet image");
            var secret = require("./auth");
            var Twitter = new TwitterPackage(secret);
            var data = require('fs').readFileSync(`./public/media/${code}.jpg`);
            Twitter.post('media/upload', { media: data }, function (error, media, response) {
              if (!error) {
                console.log(media);
                var status = {
                  status: total_msg_tweet,
                  media_ids: media.media_id_string // Pass the media id string
                }
                // console.log(media.media_id_string);
                Twitter.post('statuses/update', status, function (error, tweet, response) {
                  if (!error) {
                    console.log("done");
                  }
                });

              } if (error) {
                console.log(error);
              }
            });
          });
        }



        //VIDEO TYPE
        if (type == "video") {
          var url = body.items[num].videos.standard_resolution.url;
          console.log("url : " + url);

          var stream = request(url).pipe(fs.createWriteStream(`./public/media/${code}.mp4`));
          stream.on('finish', function () {
            console.log('---stream done---')

            var videoTweet = new VideoTweet({
              file_path: `./public/media/${code}.mp4`,
              tweet_text: total_msg_tweet
            });

          });
        }




        //TYPE CAROUSEL
        if (type == "carousel") {
          console.log("TYPE CAROUSEL");
          var carouselLen = body.items[num].carousel_media.length - 4;
          // console.log("carouselLen : " + carouselLen);
          // console.log(body.items[num].carousel_media[1].images.standard_resolution.url)
          var allData = [];
          var mediaIDSet = [];
          var c, i;
          for (c = 0; c < carouselLen; c++) {
            if (body.items[num].carousel_media[c].type == "image") {
              var carouselURL = body.items[num].carousel_media[c].images.standard_resolution.url;
              var stream = request(carouselURL).pipe(fs.createWriteStream(`./public/media/${code}_${c + 1}.jpg`));
              // stream.on('finish', function () {

              // });
              var readfile = require('fs').readFileSync(`./public/media/${code}_${c + 1}.jpg`)
              allData.push(readfile);
              if (c == carouselLen - 1) {
                //Tweet Photo
                console.log("---start tweet---")
                stream.on('finish', function () {
                  var secret = require("./auth");
                  var Twitter = new TwitterPackage(secret);
                  for (i = 0; i < allData.length; i++) {
                    /* loop code */
                    console.log(allData.length);
                    Twitter.post('media/upload', { media: allData }, function (error, media, response) {
                      if (!error) {

                        mediaIDSet.push(media.media_id_string);
                        console.log("mediaID Set : " + mediaIDSet);
                        if (mediaIDSet.length == allData.length) { // Last Item => finish 
                          console.log("i finish");
                          var status = {
                            status: total_msg_tweet,
                            media_ids: `${mediaIDSet}` // Pass the media id string
                          }
                          // console.log(media.media_id_string);
                          Twitter.post('statuses/update', status, function (error, tweet, response) {
                            if (!error) {
                              console.log("done");
                            }
                          });
                        }

                      } if (error) {
                        console.log(error);
                      }
                    });
                  }
                });
              }




            } if (body.items[num].carousel_media[c].type = "video") {
              /* Do Video Function */
            }
          }



          // var carousel2 = body.items[num].carousel_media[1].images.standard_resolution.url;
          // var carousel3 = body.items[num].carousel_media[2].images.standard_resolution.url;
          // var carousel4 = body.items[num].carousel_media[3].images.standard_resolution.url;
          // // console.log(carousel2, carousel3, carousel4);
          // request(carousel2).pipe(fs.createWriteStream(`./public/media/${carousel2}.jpg`));
          // request(carousel3).pipe(fs.createWriteStream(`./public/media/${carousel3}.jpg`));
          // var stream = request(carousel4).pipe(fs.createWriteStream(`./public/media/${carousel3}.jpg`));
          // stream.on('finish', function () {


          // 
          // var data2 = require('fs').readFileSync(`./public/media/2.jpg`);
          // var data3 = require('fs').readFileSync(`./public/media/3.jpg`);
          // var data4 = require('fs').readFileSync(`./public/media/4.jpg`);

          // var allData = [data2, data3, data4];

        }
      }

    }
  })

  //END
}








//FUNCTION TWEET VIDEO

var MEDIA_ENDPOINT_URL = 'https://upload.twitter.com/1.1/media/upload.json'
var POST_TWEET_URL = 'https://api.twitter.com/1.1/statuses/update.json'
var secret = require('./oauth');
var OAUTH = secret;


/**
 * Video Tweet constructor
 **/
var VideoTweet = function (data) {

  var self = this;
  self.file_path = data.file_path;
  self.tweet_text = data.tweet_text;
  self.total_bytes = undefined;
  self.media_id = undefined;
  self.processing_info = undefined;

  // retreives file info and inits upload on complete
  fs.stat(self.file_path, function (error, stats) {
    self.total_bytes = stats.size
    self.upload_init();
  });
};


/**
 * Inits media upload
 */
VideoTweet.prototype.upload_init = function () {

  console.log('INIT');

  var self = this;

  form_data = {
    'command': 'INIT',
    'media_type': 'video/mp4',
    'total_bytes': self.total_bytes,
    'media_category': 'tweetvideo'
  }

  // inits media upload
  request.post({ url: MEDIA_ENDPOINT_URL, oauth: OAUTH, formData: form_data }, function (error, response, body) {

    data = JSON.parse(body)

    // store media ID for later reference
    self.media_id = data.media_id_string;

    // start appening media segments
    self.upload_append();
  });
}


/**
 * Uploads/appends video file segments
 */
VideoTweet.prototype.upload_append = function () {

  var buffer_length = 5000000;
  var buffer = new Buffer(buffer_length);
  var bytes_sent = 0;

  var self = this;

  // open and read video file
  fs.open(self.file_path, 'r', function (error, file_data) {

    var bytes_read, data,
      segment_index = 0,
      segments_completed = 0;

    // upload video file in chunks
    while (bytes_sent < self.total_bytes) {

      console.log('APPEND');

      bytes_read = fs.readSync(file_data, buffer, 0, buffer_length, null);
      data = bytes_read < buffer_length ? buffer.slice(0, bytes_read) : buffer;

      var form_data = {
        command: 'APPEND',
        media_id: self.media_id,
        segment_index: segment_index,
        media_data: data.toString('base64')
      };

      request.post({ url: MEDIA_ENDPOINT_URL, oauth: OAUTH, formData: form_data }, function () {
        segments_completed = segments_completed + 1;

        console.log('segment_completed');
        if (segments_completed == segment_index) {
          console.log('Upload chunks complete');
          self.upload_finalize();
        }
      });

      bytes_sent = bytes_sent + buffer_length;
      segment_index = segment_index + 1;
    }
  });

}


/**
 * Finalizes media segments uploaded 
 */
VideoTweet.prototype.upload_finalize = function () {

  console.log('FINALIZE');

  var self = this;

  form_data = {
    'command': 'FINALIZE',
    'media_id': self.media_id
  }

  // finalize uploaded chunck and check processing status on compelete
  request.post({ url: MEDIA_ENDPOINT_URL, oauth: OAUTH, formData: form_data }, function (error, response, body) {

    data = JSON.parse(body)
    self.check_status(data.processing_info);
  });
}


/**
 * Checks status of uploaded media
 */
VideoTweet.prototype.check_status = function (processing_info) {

  var self = this;

  // if response does not contain any processing_info, then video is ready
  if (!processing_info) {
    self.tweet();
    return;
  }

  console.log('STATUS');

  request_params = {
    'command': 'STATUS',
    'media_id': self.media_id
  }

  // check processing status 
  request.get({ url: MEDIA_ENDPOINT_URL, oauth: OAUTH, qs: request_params }, function (error, response, body) {

    data = JSON.parse(body)

    console.log('Media processing status is ' + processing_info.state);

    if (processing_info.state == 'succeeded') {
      self.tweet();
      return
    }

    else if (processing_info.state == 'failed') {
      return;
    }

    // check status again after specified duration
    var timeout_length = data.processing_info.check_after_secs ? data.processing_info.check_after_secs * 1000 : 0;

    console.log('Checking after ' + timeout_length + ' milliseconds');

    setTimeout(function () {
      self.check_status(data.processing_info)
    }, timeout_length);
  });
}


/**
 * Tweets text with attached media
 */
VideoTweet.prototype.tweet = function () {

  var self = this;

  request_data = {
    'status': self.tweet_text,
    'media_ids': self.media_id
  }

  // publish Tweet
  request.post({ url: POST_TWEET_URL, oauth: OAUTH, form: request_data }, function (error, response, body) {

    data = JSON.parse(body)

    console.log(data);
  });
}

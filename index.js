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
var async = require('async');
var forEach = require('async-foreach').forEach;
const socketIO = require('socket.io');
var screenshot = require('screenshot-stream');
var store = require('json-fs-store')('./public/media/');


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






// var io = require('socket.io').listen(27017);
// io.sockets.on('connection', function (socket) {
//   connectedSockets.push(socket);
//   console.log(connectedSockets)
//   console.log("-- Socket Connected -- ")

// });



//First SETTING
var lastMinFirstSett = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
var unixLastMinFirstSett = moment(lastMinFirstSett).unix();
request({
  url: "https://www.instagram.com/333cyj333/media/",
  json: true
}, function (error, response, body) {
  if (!error && response.statusCode === 200) {
    var FitemLen = body.items.length;

    var backUpLastMinData = {
      id: unixLastMinFirstSett, //also filename
      "name": "item",
      "itemLen": FitemLen
    };

    store.add(backUpLastMinData, function (err) {
      console.log("first setting success");
      if (err) throw err; // err if the save failed
    });

  }
});







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
fetchJson(); // Start fetching to our JSON cache

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


      //FUNCTION CHECK DELETED
      var currenttime = moment().format('YYYY-MM-DD HH:mm:00');
      var unixCurrenttime = moment(currenttime).unix();
      var chklastMin = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
      var unixLastMin = moment(chklastMin).unix();
      console.log("Currenttime : " + currenttime, unixCurrenttime, "\nLast Minute Time : " + chklastMin, unixLastMin);


      var backUpData = {
        id: unixCurrenttime, //also filename
        "name": "item",
        "itemLen": itemLen
      };

      store.add(backUpData, function (err) {
        // called when the file has been written
        // to the /path/to/storage/location/12345.json
        if (err) throw err; // err if the save failed
      });


      store.load(unixLastMin, function (err, object) {
        if (err) throw err; // err if JSON parsing failed
        // do something with object here
        console.log("loadded : " + unixLastMin);
        var getItemLen = object.itemLen;
        console.log("itemLength Last Minute : " + getItemLen);
        //CHECK
        if (itemLen < getItemLen) {
          //He Deleted
          console.log("He Deleted!");
          var status = `[ ‼️ ] Youngjae deleted ${getItemLen - itemLen} post(s).\nThe post left ${itemLen}. (；ﾟДﾟ)`;
          console.log(status);
          TweetDel(status);
        }

        //finish check
        store.remove(unixLastMin, function (err) {
          // called after the file has been removed
          console.log("remove : " + chklastMin);
          if (err) throw err; // err if the file removal failed
        });
      });

      //FINISH FUNCTION CHECK DELETED

      if (itemLen != 0) { //Check When ItemLen is 0
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
        // console.log("CAPTION : " + txtcaption);




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
        // console.log("last min : " + lastMin);
        // console.log("last min KR : " + lastMin_KR);
        // console.log("timestamp_ct_format : " + timestamp_ct_format);

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

            //EDIT URL
            var splitUrl = url.split("/");
            var newUrl = url.replace(splitUrl[7] + "/", "").replace(splitUrl[4] + "/", "");
            console.log(newUrl);


            var stream = request(newUrl).pipe(fs.createWriteStream(`./public/media/${code}.jpg`));
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
            var txtLeft = 140 - fistfixedTxt.length - hashtagLink.length - timestmp.length - 3 - 5;
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

            console.log("TYPE CAROUSEL");
            var carouselLen = body.items[num].carousel_media.length;
            // console.log("carouselLen : " + carouselLen);
            // console.log(body.items[num].carousel_media[1].images.standard_resolution.url)
            var allData = [];
            var carouselURL_image = [];
            var carouselURL_video = [];
            var mediaIDSet = [];
            var c, i;
            for (c = 0; c < carouselLen; c++) {
              if (body.items[num].carousel_media[c].type == "image") {
                var carouselURL = body.items[num].carousel_media[c].images.standard_resolution.url;

                var splitUrl = carouselURL.split("/");
                var newUrl = carouselURL.replace(splitUrl[7] + "/", "").replace(splitUrl[4] + "/", "");
                console.log(newUrl);

                carouselURL_image.push(newUrl);

              } else if (body.items[num].carousel_media[c].type = "video") {
                /* Do Video Function */
                var carouselVideoURL = body.items[num].carousel_media[c].videos.standard_resolution.url;
                carouselURL_video.push(carouselVideoURL);
              }
            }

            //Carousel Video
            if (carouselURL_video.length > 0) {
              /* Do Video Function */
              forEach(carouselURL_video, function (item, index, arr) {
                var numVid = index + 1;
                console.log("num Vid : " + numVid);
                var stream = request(item).pipe(fs.createWriteStream(`./public/media/${code}_${numVid}.mp4`));
                stream.on('finish', function () {
                  console.log('---stream done---')
                  var idvid = carouselURL_video.indexOf(item) + 1;
                  if (carouselURL_image.length == 0) {
                    var itemLen = carouselURL_video.length;
                    var total_msg_tweet = fistfixedTxt + igcaption + `(${idvid}/${itemLen})` + hashtagLink + timestmp;
                    var videoTweet = new VideoTweet({
                      file_path: `./public/media/${code}_${numVid}.mp4`,
                      tweet_text: total_msg_tweet
                    });
                  }
                  if (carouselURL_image.length > 0 && carouselURL_image.length < 5) {
                    //tweet of image has 1
                    var itemLen = carouselURL_video.length + 1;
                    var total_msg_tweet = fistfixedTxt + igcaption + `(${idvid}/${itemLen})` + hashtagLink + timestmp;
                    var videoTweet = new VideoTweet({
                      file_path: `./public/media/${code}_${numVid}.mp4`,
                      tweet_text: total_msg_tweet
                    });
                  }
                  if (carouselURL_image.length >= 5 && carouselURL_image.length < 9) {
                    //tweet of video has 2
                    var itemLen = carouselURL_video.length + 2;
                    var total_msg_tweet = fistfixedTxt + igcaption + `(${idvid}/${itemLen})` + hashtagLink + timestmp;
                    var videoTweet = new VideoTweet({
                      file_path: `./public/media/${code}_${numVid}.mp4`,
                      tweet_text: total_msg_tweet
                    });
                  }
                  if (carouselURL_image.length >= 9) {
                    //tweet of video has 3
                    var itemLen = carouselURL_video.length + 3;
                    var total_msg_tweet = fistfixedTxt + igcaption + `(${idvid}/${itemLen})` + hashtagLink + timestmp;
                    var videoTweet = new VideoTweet({
                      file_path: `./public/media/${code}_${numVid}.mp4`,
                      tweet_text: total_msg_tweet
                    });
                  }

                });
              });
            }

            //Carousel Images
            console.log(" Carousel Length  :  " + carouselURL_image.length);
            if (carouselURL_image.length > 0 && carouselURL_image.length < 5) {
              console.log("carouselURL_image lower than 4");
              if (carouselURL_video.length > 0) {
                var itemLen = carouselURL_video.length + carouselURL_image.length;
                var idImg = carouselURL_video.length + 1;
                var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;
              }


              var chkTweet = CarouselImageTweet(carouselURL_image, carouselURL_image.length, code, total_msg_tweet, function (callback) {
                console.log(callback);
              });
            }
            if (carouselURL_image.length == 5) {
              console.log("carouselURL_IMAGE = 5")
              var dataLength = carouselURL_image.length;
              var newAllData = [];
              var newAllData2 = [];

              forEach(carouselURL_image, function (item, index, arr) {
                // console.log("each", item, index, arr);
                if (carouselURL_image.indexOf(item) < 3) {
                  newAllData.push(item);
                } if (carouselURL_image.indexOf(item) >= 3) {
                  newAllData2.push(item);
                }
                // });
              }, function () {
                console.log("newAllData.length is : " + newAllData.length);
                console.log("newAllData.length is : " + newAllData2.length);
                var newAlldataLength = newAllData.length;
                var newAlldataLength2 = newAllData2.length;

                var itemLen = carouselURL_video.length + 2;
                var idImg = carouselURL_video.length + 1;
                var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;

                var chkTweet = CarouselImageTweet(newAllData, newAlldataLength, code, total_msg_tweet, function (callback) {
                  console.log(callback);
                  if (callback == "done") {
                    var itemLen = carouselURL_video.length + 2;
                    var idImg = carouselURL_video.length + 2;
                    var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;
                    CarouselImageTweet(newAllData2, newAlldataLength2, code, total_msg_tweet, function (callback) {
                      console.log(callback);
                    });
                  }
                });
              });
            }
            if (carouselURL_image.length > 5 && carouselURL_image.length < 9) {
              console.log("carouselURL_image more then 5 but less than 9");
              var dataLength = carouselURL_image.length;
              var newAllData = [];
              var newAllData2 = [];

              forEach(carouselURL_image, function (item, index, arr) {
                // console.log("each", item, index, arr);
                if (carouselURL_image.indexOf(item) < 4) {
                  newAllData.push(item);
                } if (carouselURL_image.indexOf(item) >= 4) {
                  newAllData2.push(item);
                }
                // });
              }, function () {
                console.log("newAllData.length is : " + newAllData.length);
                console.log("newAllData.length is : " + newAllData2.length);
                var newAlldataLength = newAllData.length;
                var newAlldataLength2 = newAllData2.length;

                var itemLen = carouselURL_video.length + 2;
                var idImg = carouselURL_video.length + 1;
                var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;

                var chkTweet = CarouselImageTweet(newAllData, newAlldataLength, code, total_msg_tweet, function (callback) {
                  console.log(callback);
                  if (callback == "done") {
                    var itemLen = carouselURL_video.length + 2;
                    var idImg = carouselURL_video.length + 2;
                    var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;
                    var chkTweet2 = CarouselImageTweet(newAllData2, newAlldataLength2, code, total_msg_tweet, function (callback) {
                      console.log(callback);
                    });
                  }
                });
              });
            }
            if (carouselURL_image.length > 9) {
              console.log("carouselURL_image more then 9");
              var dataLength = carouselURL_image.length;
              var newAllData = [];
              var newAllData2 = [];
              var newAllData3 = [];
              forEach(carouselURL_image, function (item, index, arr) {
                // console.log("each", item, index, arr);
                if (carouselURL_image.indexOf(item) < 4) {
                  newAllData.push(item);
                } if (carouselURL_image.indexOf(item) >= 4 && carouselURL_image.indexOf(item) < 7) {
                  newAllData2.push(item);
                }
                if (carouselURL_image.indexOf(item) >= 7) {
                  newAllData3.push(item);
                }
                // });
              }, function () {
                console.log("newAllData.length is : " + newAllData.length);
                console.log("newAllData.length is : " + newAllData2.length);
                var newAlldataLength = newAllData.length;
                var newAlldataLength2 = newAllData2.length;
                var newAlldataLength3 = newAllData3.length;

                var itemLen = carouselURL_video.length + 3;
                var idImg = carouselURL_video.length + 1;
                var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;

                var chkTweet = CarouselImageTweet(newAllData, newAlldataLength, code, total_msg_tweet, function (callback) {
                  console.log(callback);
                  if (callback == "done") {
                    var itemLen = carouselURL_video.length + 3;
                    var idImg = carouselURL_video.length + 2;
                    var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;

                    CarouselImageTweet(newAllData2, newAlldataLength2, code, total_msg_tweet, function (callback) {
                      console.log(callback);
                      if (callback == "done") {
                        var itemLen = carouselURL_video.length + 3;
                        var idImg = carouselURL_video.length + 3;
                        var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;
                        CarouselImageTweet(newAllData3, newAlldataLength3, code, total_msg_tweet, function (callback) {
                          console.log(callback);
                        });
                      }
                    });
                  }
                });
              });
            }

          }
        } if (chkDate == false) {
          console.log("------------ NO NEW POST -------------");
        }
      }


    } else {
      console.log("Cannot Load API!");
    }
  })

  //END
}








//FUNCTION TWEET VIDEO

var MEDIA_ENDPOINT_URL = 'https://upload.twitter.com/1.1/media/upload.json';
var POST_TWEET_URL = 'https://api.twitter.com/1.1/statuses/update.json';
var secret = require('./oauth'); //

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




function CarouselImageTweet(allData, allDataLength, code, total_msg_tweet, callback) {
  var secret = require("./auth");//
  var Twitter = new TwitterPackage(secret);
  console.log("------Start Carousel Image Function--------");
  console.log(allData);
  var mediaIDSet = [];
  var data, stream;
  forEach(allData, function (item, index, arr) {
    var d = allData.indexOf(item) + 1;
    if (allData.indexOf(item) < allDataLength) {
      stream = request(item).pipe(fs.createWriteStream(`./public/media/${code}_${d}.jpg`));
      stream.on('finish', function () {
        data = require('fs').readFileSync(`./public/media/${code}_${d}.jpg`);
        console.log(data);
        Twitter.post('media/upload', { media: require('fs').readFileSync(`./public/media/${code}_${d}.jpg`) }, function (error, media, response) {
          if (!error) {
            mediaIDSet.push(media.media_id_string);
            console.log("mediaID Set : " + mediaIDSet);
            if (mediaIDSet.length == allDataLength) {
              //TWEET MESSAGE
              var status = {
                status: total_msg_tweet,
                media_ids: `${mediaIDSet}` // Pass the media id string
              }
              // console.log(media.media_id_string);
              Twitter.post('statuses/update', status, function (error, tweet, response) {
                if (!error) {
                  // console.log("done");
                  callback("done");
                }
              });
            }
          } if (error) {
            console.log(error);
          }
        });

      });
    }

  });
}



//Function Check Delete

function StoreLen(itemLen) {
  var itemLen = itemLen;
  //callback(itemLen);
  var itemLenFile = './public/media/itemLen.json';
  fs.writeFileSync(itemLenFile, `{"itemLen" : ${itemLen}}`);
}



function TweetDel(status) {
  //Screenshot
  const stream = screenshot('https://www.instagram.com/333cyj333/', '1080x720');
  stream.pipe(fs.createWriteStream(`./public/media/choidel.png`));
  stream.on('finish', function () {

    var getStatus = status;
    var secret = require("./auth_del");
    var Twitter = new TwitterPackage(secret);
    var data = require('fs').readFileSync(`./public/media/choidel.png`);
    Twitter.post('media/upload', { media: data }, function (error, media, response) {
      if (!error) {
        var newstatus = {
          status: getStatus,
          media_ids: media.media_id_string
        }
        Twitter.post('statuses/update', newstatus, function (error, tweet, response) {
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
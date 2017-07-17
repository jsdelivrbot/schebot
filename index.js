var express = require('express');
var http = require('http');
var app = express();
var request = require("request");
var fs = require('fs');
var bodyParser = require('body-parser')
var moment = require('moment')
var momentTz = require('moment-timezone');
var CronJob = require('cron').CronJob;

var TwitterPackage = require('twitter');

var Agenda = require('agenda');
const uri = "mongodb://admin:admin@wacoalvoice-shard-00-00-w0akm.mongodb.net:27017,wacoalvoice-shard-00-01-w0akm.mongodb.net:27017,wacoalvoice-shard-00-02-w0akm.mongodb.net:27017/wacoalvoice?ssl=true&replicaSet=wacoalvoice-shard-0&authSource=admin";
const agenda = new Agenda({
  db: {
    address: uri
  }
});


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


var download = function (uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(`./public/media/${filename}`)).on('close', callback);
  });
};



app.post('/getJson/:username/:num', function (req, res) {
  // var job = new CronJob({
  //   cronTime: '00 * * * * *',
  //   onTick: function () {
  /*
   * Runs every weekday (Monday through Friday)
   * at 11:30:00 AM. It does not run on Saturday
   * or Sunday.
   */

  var num = req.params.num;
  var username = req.params.username;
  var url = `https://www.instagram.com/${username}/media/`;

  agenda.define('igapi', function (job, done) {
    var newdate = moment.tz(new Date(), "Asia/Bangkok");
    console.log(newdate.format());

    //START

    request({
      url: url,
      json: true
    }, function (error, response, body) {

      if (!error && response.statusCode === 200) {
        //RECENT PICTURE
        var itemLen = body.items.length;
        console.log("itemLen " + itemLen);

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
        console.log(txtcaption);




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


              //POST TWITTER
              console.log("start tweet video");
              var secret = require("./auth");
              var client = new TwitterPackage(secret);

              var pathToMovie = `./public/media/${code}.mp4`;
              var mediaType = 'video/mp4'; // `'image/gifvideo/mp4'` is also supported
              var mediaData = require('fs').readFileSync(pathToMovie);
              var mediaSize = require('fs').statSync(pathToMovie).size;
              console.log(mediaType, mediaData, mediaSize)


              initUpload() // Declare that you wish to upload some media
                .then(appendUpload) // Send the data for the media
                .then(finalizeUpload) // Declare that you are done uploading chunks
                .then(mediaId => {
                  // You now have an uploaded movie/animated gif
                  // that you can reference in Tweets, e.g. `update/statuses`
                  // will take a `mediaIds` param.
                  var status = {
                    status: total_msg_tweet,
                    media_ids: mediaId // Pass the media id string
                  }
                  console.log("Media ID is : " + mediaId);
                  var secret = require("./auth");
                  var Twitter = new TwitterPackage(secret);
                  Twitter.post('statuses/update', status, function (error, tweet, response) {
                    if (!error) {
                      console.log("done");
                    }
                  });

                });

              /**
               * Step 1 of 3: Initialize a media upload
               * @return Promise resolving to String mediaId
               */
              function initUpload() {
                return makePost('media/upload', {
                  command: 'INIT',
                  total_bytes: mediaSize,
                  media_type: mediaType,
                }).then(data => data.media_id_string);
              }

              /**
               * Step 2 of 3: Append file chunk
               * @param String mediaId    Reference to media object being uploaded
               * @return Promise resolving to String mediaId (for chaining)
               */
              function appendUpload(mediaId) {
                return makePost('media/upload', {
                  command: 'APPEND',
                  media_id: mediaId,
                  media: mediaData,
                  segment_index: 0
                }).then(data => mediaId);
              }

              /**
               * Step 3 of 3: Finalize upload
               * @param String mediaId   Reference to media
               * @return Promise resolving to mediaId (for chaining)
               */
              function finalizeUpload(mediaId) {
                return makePost('media/upload', {
                  command: 'FINALIZE',
                  media_id: mediaId
                }).then(data => mediaId);
              }

              /**
               * (Utility function) Send a POST request to the Twitter API
               * @param String endpoint  e.g. 'statuses/upload'
               * @param Object params    Params object to send
               * @return Promise         Rejects if response is error
               */
              function makePost(endpoint, params) {
                return new Promise((resolve, reject) => {
                  client.post(endpoint, params, (error, data, response) => {
                    if (error) {
                      reject(error);
                    } else {
                      resolve(data);
                    }
                  });
                });
              }

            });
          }




          //TYPE CAROUSEL
          if (type == "carousel") {
            var carouselLen = body.items[num].carousel_media.length;
            // console.log("carouselLen : " + carouselLen);
            // console.log(body.items[num].carousel_media[1].images.standard_resolution.url)
            var allData = [];
            var mediaIDSet = [];
            var c, i;
            for (c = 0; c < carouselLen; c++) {
              if (body.items[num].carousel_media[c].type == "image") {
                var carouselURL = body.items[num].carousel_media[c].images.standard_resolution.url;
                var stream = request(carouselURL).pipe(fs.createWriteStream(`./public/media/${code}_${c}.jpg`));
                var readfile = require('fs').readFileSync(`./public/media/${code}_${c}.jpg`)
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

    done();
  });

  agenda.on('ready', function () {
    var datenow = new Date();
    console.log(datenow);
    agenda.every(`* * * * * `, 'igapi', { time: new Date(), timezone: 'Asia/Bangkok' });
    agenda.start();
  });


  //   },
  //   start: false,
  //   timeZone: 'Asia/Seoul'
  // });
  // job.start();
  res.sendStatus(200);
});


http.createServer(app).listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});


function DownloadMedia(url, code, callback) {

}
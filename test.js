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
var Twitter = require('twitter');

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



var username = "333cyj333";

//DoCheckMedia(username);



//TEST STREAMING

//cyjsssss
var client = new Twitter({
    consumer_key: 'kO2g7vh2PB4akjjIsrxwFvKmJ',
    consumer_secret: 'ojqaAlNm90um8SA3dSCxvAU9XUR84s2me6PQhWogbYRtq6yoAA',
    bearer_token: '146335824-9IcN2VWCkIAhcZdTOY1meTzdentMEV01SfuoUtls'
  });

var stream = client.stream('statuses/filter', {track: '@cyjsssss'});
stream.on('data', function(event) {
  console.log(event && event.text);
});
 
stream.on('error', function(error) {
  throw error;
});
 
// You can also get the stream in a callback if you prefer. 
client.stream('statuses/filter', {track: '@cyjsssss'}, function(stream) {
  stream.on('data', function(event) {
    console.log(event && event.text);
  });
 
  stream.on('error', function(error) {
    throw error;
  });
});








function DoCheckMedia(username) {
    request({
        url: `https://www.instagram.com/${username}/?__a=1`,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            var count = body.user.media.count;
            if (count != 0) {
                var nodes = body.user.media.nodes[0];
                var __typename = nodes.__typename;
                //__typename : , GraphImage,GraphSidecar,GraphVideo?

                var code = nodes.code;
                var caption = nodes.caption;

                // console.log(count, __typename, code,caption);
                request({
                    url: `https://www.instagram.com/p/${code}/?__a=1`,
                    json: true
                }, function (error, response, body) {
                    var nodes = body.graphql.shortcode_media;
                    var __typename = nodes.__typename;
                    var caption = nodes.edge_media_to_caption.edges[0].node.text;
                    var timestamp = nodes.taken_at_timestamp;
                    var shortcode = nodes.shortcode;
                    var link = `https://www.instagram.com/p/${shortcode}/`;
                    console.log(__typename, caption, timestamp);

                    //CHECK CAPTION
                    var txtcaption;
                    if (caption !== null) {
                        txtcaption = caption;
                    }
                    if (caption == null) {
                        txtcaption = "";
                    }
                    console.log(txtcaption);



                    //TIMESTAMP
                    var timestamp_ct = moment.unix(timestamp);
                    var timestamp_ct_format = timestamp_ct.format('YYYY-MM-DD HH:mm:00');

                    var create_time_KR = momentTz.tz(timestamp_ct, "Asia/Seoul").format('MMM DD YYYY, HH:mm');
                    var currenttime = moment().format('YYYY-MM-DD HH:mm:00');
                    var currentimeKR = momentTz.tz(currenttime, "Asia/Seoul");

                    var lastMin = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
                    var lastMin_KR = momentTz.tz(lastMin, "Asia/Seoul").format('YYYY-MM-DD HH:mm:00');

                    var chkDate = moment(timestamp_ct_format).isSame(lastMin); // true
                    console.log(chkDate);

                    //TEXT TWEET
                    var fistfixedTxt = "[YOUNGJAESTAGRAM] ";
                    var hashtagLink = "\n#영재 #GOT7\n" + link + "\n";
                    var timestmp = create_time_KR;
                    console.log("timestmp : " + timestmp);

                    var txtLeft = 280 - fistfixedTxt.length - hashtagLink.length - timestmp.length - 3;
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
                    //console.log("IG CAPTION : " + igcaption);

                    var total_msg_tweet = fistfixedTxt + igcaption + hashtagLink + timestmp;
                    console.log("total_msg_tweet :\n" + total_msg_tweet)


                    //TYPE IMAGE
                    if (__typename == "GraphImage") {
                        var url = nodes.display_url;
                        console.log(url);
                        //EDIT URL
                        var splitUrl = url.split("/");
                        var newUrl = url.replace(splitUrl[7] + "/", "").replace(splitUrl[4] + "/", "");
                        console.log(newUrl);

                        var stream = request(newUrl).pipe(fs.createWriteStream(`./public/media/${code}.jpg`));
                        stream.on('finish', function () {
                            console.log('---stream done---')
                            //POST TWITTER
                            console.log("start tweet image");
                           // TweetImage(code, total_msg_tweet);


                        });
                    }

                });
            } else {
                console.log("no media");
            }

        }
    });
}

function TweetImage(code, total_msg_tweet) {
    console.log(code,total_msg_tweet);
    var secret = require("./auth"); //save before launch
    var Twitter = new TwitterPackage(secret);
    var data = require('fs').readFileSync(`./public/media/${code}.jpg`);
    Twitter.post('media/upload', { media: data }, function (error, media, response) {
        if (!error) {
            console.log(media);
            var status = {
                status: total_msg_tweet,
                media_ids: media.media_id_string // Pass the media id string
            }
            Twitter.post('statuses/update', status, function (error, tweet, response) {
                if (!error) {
                    console.log("done");
                }
            });

        } if (error) {
            console.log(error);
        }
    });


}
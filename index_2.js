var express = require('express');
var http = require('http');
var app = express();
var api = require('instagram-node').instagram();
var fs = require('fs');
var TwitterPackage = require('twitter');
var request = require("request");
var bodyParser = require('body-parser')
var moment = require('moment')
var momentTz = require('moment-timezone');
var screenshot = require('screenshot-stream');
const req = require("tinyreq");
const cheerio = require("cheerio", { decodeEntities: true });
var JSSoup = require('jssoup').default;
const getScriptTagVars = require('get-script-tag-vars');

// var tough = require('tough-cookie');
// var Cookie = tough.Cookie;
// //var cookie = Cookie.parse(header);

// var cookiejar = new tough.CookieJar();

// cookiejar.getCookies('https://www.instagram.com/',function(err,cookies) {
//   // res.headers['cookie'] = cookies.join('; ');
//   console.log(cookies);
// });


// var InstagramAPI = require('instagram-api');
// var accessToken = '55502361.179b7e3.aadfa417c1584a3cb64dc6c8b45816f6';//'23612221.3fcb46b.348431486f3a4fb85081d5242db9ca1c';
// var instagramAPI = new InstagramAPI(accessToken);


// const InstagramNodeApi = require('instagram-node-api');
// const instagramNodeApi = new InstagramNodeApi(accessToken);


// Instagram = require('instagram-node-lib');
// Instagram.set('client_id', '179b7e3894764c9dad6bdce62d422949');
// Instagram.set('client_secret', 'ba85a46e88db41919aa22fcc175324a8');

var scraper = require('insta-scraper');

var Client = require('instagram-private-api').V1;
var device = new Client.Device('cyjonly');
var storage = new Client.CookieFileStorage(__dirname + '/public/media/cyjonly.json');



//GET STORY
const {
  getStories,
  getStoriesFeed,
  getMediaByCode,
  getUserByUsername
} = require('instagram-stories')


 //SESSION ID
 var session_id = "IGSC477a4db653a8aa190755c21f3a9b79354829e639893a0e8616e8896dc82cc35e%3AZLTkdjiyZs46NGt4ecDskm2obFrZFFCt%3A%7B%22_auth_user_id%22%3A55502361%2C%22_auth_user_backend%22%3A%22accounts.backends.CaseInsensitiveModelBackend%22%2C%22_auth_user_hash%22%3A%22%22%2C%22_platform%22%3A4%2C%22_token_ver%22%3A2%2C%22_token%22%3A%2255502361%3A1VkcHjcNMfYpOJzuxH538jjpztZzRpKJ%3A35bb8bca913d21bbf6e1977e18e2aa06b5ddcf3e40429aac7e490618028464db%22%2C%22last_refreshed%22%3A1524452065.9287192822%7D";
 //expired : 2018-07-22T02:57:03.619Z
 var cyjid = 1946899430;
 var somzid = 55502361;

 //IG STORY CHECK 
 console.log("---------STOP IG STORY CHECK------------");
 getStories({ id: cyjid, userid: somzid, sessionid: session_id }).then(stories => {
     var body = stories;
     var storyid = body.id;
     //console.log(storyid);
     //var story_url = "https://www.instagram.com/p/" + code;
     //console.log("STORY URL : " + story_url);
     var story_count = body.items.length;
     //console.log("story have : " + story_count);
     if (story_count > 0) {
         var item = body.items[1];
         //var code = item.code;
         //DateTime Taken
         var taken_at = item.taken_at;
         var taken_at_mm = moment.unix(taken_at);
         var time_taken = momentTz.tz(taken_at_mm, "Asia/Seoul").format('MMM DD YYYY, HH:mm');
         console.log("Taken At : " + time_taken);
         var time_taken_forchk = moment(taken_at_mm).format('YYYY-MM-DD HH:mm:00');


        // if (time_taken_forchk == chklastMin) {

             //CAPTION
             var chkcaption = item.caption;
             var textcaption = "";
             if (chkcaption != null) {
                 textcaption = item.caption.text;
             }
             var caption0 = "[YOUNGJAE_STORY] " + textcaption;
             var caption1 = "\n#영재 #GOT7\n";
             var caption = caption0 + caption1 + time_taken;
             console.log(caption);
             //Media Type
             var media_type = item.media_type;
             if (media_type == 1) { //Picture
                 var original_width = item.original_width;
                 var original_height = item.original_height;
                 var img_ver2 = item.image_versions2;
                 var candidates_length = item.image_versions2.candidates.length;
                 console.log(candidates_length);
                 for (var i = 0; i < candidates_length; i++) {
                     if (img_ver2.candidates[i].width == original_width && img_ver2.candidates[i].height == original_height) { // Maxinum,Original Image
                         console.log("found " + original_width, original_height);
                         var img_url = img_ver2.candidates[i].url;
                         console.log("Image URL : " + img_url);
                         var stream = request(img_url).pipe(fs.createWriteStream(`./public/media/${storyid}.jpg`));
                         stream.on('finish', function () {
                             console.log('---stream done---')
                             //POST TWITTER
                             console.log("start tweet image");
                             TweetImage(storyid, caption);
                         });
                     }
                 }


             }

             if (media_type == 2) { //Video
                 var video_url = item.video_versions[0].url;
                 console.log("VIDEO URL : " + video_url);

                 var stream = request(video_url).pipe(fs.createWriteStream(`./public/media/${storyid}.mp4`));
                 stream.on('finish', function () {
                     console.log('---stream video done---')

                     var videoTweet = new VideoTweet({
                         file_path: `./public/media/${storyid}.mp4`,
                         tweet_text: caption
                     });
                 });


             }

        // }





     }
 })



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

const username = "333cyj333";





// request({
//   url: `https://www.instagram.com/333cyj333/`,
// }, function (error, response, body) {

//   var shareData =body.substring(body.lastIndexOf("window._sharedData = ")+21,body.lastIndexOf('show_app_install')+23);
//   //console.log(shareData);
//   var jsonData = JSON.parse(shareData)
//   // console.log(jsonData);
//   // console.log(jsonData.entry_data.ProfilePage["0"].graphql.user.edge_owner_to_timeline_media.count)
//   var body = jsonData.entry_data.ProfilePage["0"];    

//   var count = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;
//   console.log(count);
// });




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
 // console.log(hub_chanllenge);
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


//FUNCTION TWEET IMAGE
function TweetImage(code, total_msg_tweet) {
  console.log(code, total_msg_tweet);
  //LENAYK
  var secret = require("./auth"); //save before launch (auth)
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

// var username = "333cyj333";
// //IG STORY CHECK 
// console.log("---------IG STORY CHECK------------");
// request({
//   url: `https://api.storiesig.com/stories/333cyj333`,
//   json: true
// }, function (error, response, body) {
//   if (!error && response.statusCode === 200) {
//     var storyid = body.id;
//     //console.log(storyid);
//     //var story_url = "https://www.instagram.com/p/" + code;
//     //console.log("STORY URL : " + story_url);
//     var story_count = body.items.length;
//     console.log(story_count);
//     //console.log("story have : " + story_count);
//     if (story_count > 0) {
//       var item = body.items[0];
//       //var code = item.code;
//       //DateTime Taken
//       var taken_at = item.taken_at;
//       var taken_at_mm = moment.unix(taken_at);
//       var time_taken = momentTz.tz(taken_at_mm, "Asia/Seoul").format('MMM DD YYYY, HH:mm');
//       console.log("Taken At : " + time_taken);
//       var time_taken_forchk = moment(taken_at_mm).format('YYYY-MM-DD HH:mm:00');


//       //  if (time_taken_forchk == chklastMin) {

//       //CAPTION
//       var chkcaption = item.caption;
//       var textcaption = "";
//       if (chkcaption != null) {
//         textcaption = item.caption.text;
//       }
//       var caption0 = "[YOUNGJAE_STORY] " + textcaption;
//       var caption1 = "\n#영재 #GOT7\n";
//       var caption = caption0 + caption1 + time_taken;
//       console.log(caption);
//       //Media Type
//       var media_type = item.media_type;
//       if (media_type == 1) { //Picture
//         var original_width = item.original_width;
//         var original_height = item.original_height;
//         var img_ver2 = item.image_versions2;
//         var candidates_length = item.image_versions2.candidates.length;
//         console.log(candidates_length);
//         for (var i = 0; i < candidates_length; i++) {
//           if (img_ver2.candidates[i].width == original_width && img_ver2.candidates[i].height == original_height) { // Maxinum,Original Image
//             console.log("found " + original_width, original_height);
//             var img_url = img_ver2.candidates[i].url;
//             console.log("Image URL : " + img_url);
//             var stream = request(img_url).pipe(fs.createWriteStream(`./public/media/${storyid}.jpg`));
//             stream.on('finish', function () {
//               console.log('---stream done---')
//               //POST TWITTER
//               console.log("start tweet image");
//               TweetImage(storyid, caption);
//             });
//           }
//         }


//       }

//       if (media_type == 2) { //Video
//         var video_url = item.video_versions[0].url;
//         console.log("VIDEO URL : " + video_url);

//         var stream = request(video_url).pipe(fs.createWriteStream(`./public/media/${storyid}.mp4`));
//         stream.on('finish', function () {
//           console.log('---stream video done---')

//           var videoTweet = new VideoTweet({
//             file_path: `./public/media/${storyid}.mp4`,
//             tweet_text: caption
//           });
//         });


//       }

//     }





//     // }
//   }
// });
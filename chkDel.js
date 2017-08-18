
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
      // fs.writeFileSync(cacheFile, body);
      setTimeout(fetchJson, 60000); // Fetch it again in a 60 second
    });
  })
}
fetchJson();


function CheckMedia(num, username, url) {

  //START
  request({
    url: url,
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var itemLen = body.items.length;
      console.log(itemLen);


      var getItemLen = require('./public/media/itemLen.json').itemLen;
      console.log('getItemLen :  ' + getItemLen);
      if (itemLen < getItemLen) {
        //He Deleted
        console.log("He Deleted!");
        var status = `[ ‼️ ] Youngjae deleted ${getItemLen - itemLen} post(s).\nThe post left ${itemLen}. (；ﾟДﾟ)`;
        console.log(status);
        TweetDel(status);
      }
      StoreLen(itemLen);




    }
  })
}

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
        var status = {
          status: getStatus,
          media_ids: media.media_id_string
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
  });

}
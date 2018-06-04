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




var username = "start";
var username2 = "prdsdef";
//PushName(username2);
PushName(username);


function PushName(name){
    console.log(name);
    PushName2();
}

function PushName2(){
    var username = "333cyj333";
    var username2 = "prdsdef";
    console.log("333cyj333");
    console.log("prdsdef");
    DoCheckMedia(username);
    DoCheckMedia(username2);
    setTimeout(PushName2, 5000); 
}

function DoCheckMedia(username){
    console.log("DO CHECK MEDIA : " + username);
}

var Twitter = require('twitter');
var util   = require('util');
var Readable = require('stream').Readable;
var Writable = require('stream').Writable;
var cfg = require('./auth');
var pubnub = require("pubnub");
var pncfg = {
   ssl           : true,  //  enable TLS Tunneling over TCP
   publish_key   : "pub-c-cfb04b8a-8857-4afe-938a-4d8779da9527",
   subscribe_key : "sub-c-85dfcaa0-6de7-11e7-85aa-0619f8945a4f"
};

var query = "#Youngjae";
var client = new Twitter(cfg);
client.stream('statuses/filter', {track:query}, function(stream) {
   stream.on('data', function(tweet) {
       console.log("got a tweet",tweet);
   });
   stream.on('error', function(error) {
       console.log("got an error",error);
   });
});

function PubNubOutStream(cfg, channel) {
   Writable.call(this,{objectMode:true});
   var pn = pubnub(cfg);

   this._write = function(obj,encoding,callback) {
       pn.publish({
           channel: channel,
           message: obj,
           callback: () => callback()
       });
   };
}



function TwitterStream(cfg, query) {
   Readable.call(this,{objectMode:true});

   var client = new Twitter(cfg);

   this._read = function() { /* do nothing */ };
   var self = this;
   function connect() {
       client.stream('statuses/filter', {track: query},
           function(stream) {
              stream.on('data', (tweet) => self.push(tweet));
              stream.on('error', (error) => connect());
           });
   }
   connect();
}


util.inherits(PubNubOutStream, Writable);
util.inherits(TwitterStream, Readable);
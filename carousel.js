
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
var Twit = require('twit')
var async = require('async');
var forEach = require('async-foreach').forEach;

var num = 3;
var username = "bambam1a";
var url = `https://www.instagram.com/${username}/media/`;
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
        var total_msg_tweet
        var Chkcaption = body.items[num].caption;
        if (Chkcaption !== null) {
            total_msg_tweet = body.items[num].caption.text;
        }
        if (Chkcaption == null) {
            total_msg_tweet = "";
        }
        console.log("CAPTION : " + total_msg_tweet);

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
        //TYPE CAROUSEL
        if (type == "carousel") {
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
                    carouselURL_image.push(carouselURL);

                } if (body.items[num].carousel_media[c].type = "video") {
                    /* Do Video Function */
                }
            }
            console.log(" Carousel Length  :  " + carouselURL_image.length);
            if (carouselURL_image.length < 5) {
                console.log("carouselURL_image lower than 4");
                var chkTweet = CarouselImageTweet(carouselURL_image, carouselURL_image.length, code, total_msg_tweet, function (callback) {
                    console.log(callback);
                });
            }
            if (5 = carouselURL_image.length) {
                console.log("carouselURL_IMAGE = 5")
                console.log("carouselURL_image more then 5 but less than 9");
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
                    var chkTweet = CarouselImageTweet(newAllData, newAlldataLength, code, total_msg_tweet, function (callback) {
                        console.log(callback);
                        if (callback == "done") {
                            CarouselImageTweet(newAllData2, newAlldataLength2, code, total_msg_tweet, undefined);
                        }
                    });
                });
            }
            if (5 < carouselURL_image.length && carouselURL_image.length < 9) {
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
                    var chkTweet = CarouselImageTweet(newAllData, newAlldataLength, code, total_msg_tweet, function (callback) {
                        console.log(callback);
                        if (callback == "done") {
                            CarouselImageTweet(newAllData2, newAlldataLength2, code, total_msg_tweet, undefined);
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
                    var chkTweet = CarouselImageTweet(newAllData, newAlldataLength, code, total_msg_tweet, function (callback) {
                        console.log(callback);
                        if (callback == "done") {
                            CarouselImageTweet(newAllData2, newAlldataLength2, code, total_msg_tweet, function(callback){
                                console.log(callback);
                                if(callback=="done"){
                                    CarouselImageTweet(newAllData3, newAlldataLength3, code, total_msg_tweet, undefined);
                                }
                            });
                        }
                    });
                });
            }


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
    }
});



function CarouselImageTweet(allData, allDataLength, code, total_msg_tweet, callback) {
    var secret = require("./auth");
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
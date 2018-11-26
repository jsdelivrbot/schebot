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
var Twittxt = require('twitter-text');
var Agenda = require('agenda');
var forEach = require('async-foreach').forEach;
const socketIO = require('socket.io');
var screenshot = require('screenshot-stream');
var store = require('json-fs-store')('./public/media/');
var Twitter = require('twitter');
const config = require('./config/default');
const assert = require('assert');
const async = require('async');
var CronJob = require('cron').CronJob;
var multi = require('multi-write-stream');
var MongoClient = require('mongodb').MongoClient;

//GET STORY
const {
    getStories,
    getStoriesFeed,
    getMediaByCode,
    getUserByUsername,
    getVideoLive
} = require('instagram-stories')

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



// Connection URL
const dbURL = "mongodb+srv://admin:admin@schebot-8rhzu.mongodb.net/test?retryWrites=true";
// Database Name
const dbName = 'igbot';

//PREVENT BEFORE POST
app.post('/getJson/:username/:num', function (req, res) {

    // var jobname = req.params.jobname;
    var num = req.params.num;
    var username = req.params.username;
    //var url = `https://www.instagram.com/${username}/media/`;
    request({
        url: `https://www.instagram.com/${username}/`//?__a=1
        //json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            var shareData = body.match(/window._sharedData = (.*);/)[1];//body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
            var jsonData = JSON.parse(shareData)
            var body = jsonData.entry_data.ProfilePage["0"];
            var shortcode = body.graphql.user.edge_owner_to_timeline_media.edges[num].node.shortcode;
            CheckMediaDataType(shortcode, username);
        }
    });
    res.sendStatus(200);
});
app.post('/getJsonByPost/:username/:code', (req, res) => {
    var username = req.params.username;
    var code = req.params.code;
    CheckMediaDataType(code, username);
    res.sendStatus(200);
});
app.post('/p/getstory/:username/:num', (req, res) => {
    var username = req.params.username;
    var num = req.params.num;
    GetStoryFromPost(num, username);
    res.sendStatus(200);
})




var getname = config.cyjname;
var getname2 = config.defname;
var getname3 = config.coconame;

var getname_cyj = config[`${getname}`][0].account;
var getname2_def = config[`${getname2}`][0].account;
var getname2_coco = config[`${getname3}`][0].account;
FirstSetting(getname_cyj, getname2_def, getname2_coco);



function FirstSetting(username1, username2, username3) {
    //First SETTING
    var lastMinFirstSett = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
    var unixLastMinFirstSett = moment(lastMinFirstSett).unix();


    async.waterfall([
        function (callback) {
            request({
                url: `https://www.instagram.com/${username1}/`//?__a=1
                //json: true
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    var shareData = body.match(/window._sharedData = (.*);/)[1];// body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);

                    try {
                        var jsonData = JSON.parse(shareData)
                        var body = jsonData.entry_data.ProfilePage["0"];

                        var FitemLen = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;

                        //Get Latest Caption
                        var caption = "";
                        var captionLen = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges.length;
                        if (captionLen > 0) {
                            caption = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text;
                        }
                        var shortcode = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.shortcode;
                        var code_detail = {
                            shortcode: shortcode,
                            caption: caption
                        }
                        console.log("First Setting \n Caption is : " + caption);

                        callback(null, FitemLen, code_detail);
                    } catch (e) {
                        console.log(e);
                    }
                }
            });

        },
        function (arg1, code_detail, callback) {
            // arg1 now equals 'one' and arg2 now equals 'two'
            console.log("WATERFALL 2");
            console.log(arg1);
            var ars_itemlen = arg1;
            request({
                url: `https://www.instagram.com/${username2}/`//?__a=1
                //json: true
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    var shareData = body.match(/window._sharedData = (.*);/)[1];//body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
                    try {
                        var jsonData = JSON.parse(shareData)
                        var body = jsonData.entry_data.ProfilePage["0"];

                        var FitemLen = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;
                        var def_itemlen = FitemLen;
                        console.log(ars_itemlen, def_itemlen);

                        //Get Latest Caption
                        var caption2 = "";
                        var captionLen = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges.length;
                        if (captionLen > 0) {
                            caption2 = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text;
                        }
                        var shortcode = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.shortcode;
                        var code_detail2 = {
                            shortcode: shortcode,
                            caption: caption2
                        }
                        console.log("First Setting \n Caption is : " + caption2);

                        callback(null, ars_itemlen, def_itemlen, code_detail, code_detail2);


                    } catch (e) {
                        console.log(e);
                    }
                }
            })


        },
        function (arg1, arg2, code_detail, code_detail2, callback) {
            console.log("WATERFALL 3");
            console.log(arg1, arg2);
            var ars_itemlen = arg1;
            var def_itemlen = arg2;
            request({
                url: `https://www.instagram.com/${username3}/`//?__a=1
                //json: true
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    var shareData = body.match(/window._sharedData = (.*);/)[1];//body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
                    try {
                        var jsonData = JSON.parse(shareData)
                        var body = jsonData.entry_data.ProfilePage["0"];

                        var FitemLen = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;
                        var coco_itemlen = FitemLen;
                        console.log("coco item length " + coco_itemlen);
                        // console.log(ars_itemlen, def_itemlen);

                        //Get Latest Caption
                        var caption3 = "";
                        var captionLen = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges.length;
                        if (captionLen > 0) {
                            caption3 = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text;
                        }
                        var shortcode = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.shortcode;
                        var code_detail3 = {
                            shortcode: shortcode,
                            caption: caption3
                        }
                        console.log("First Setting \n Caption is : " + caption3);

                        var backUpLastMinData = {
                            id: unixLastMinFirstSett, //also filename
                            // "name": "item",
                            "itemLen_ars": ars_itemlen,
                            "code_ars": code_detail,
                            "itemLen_def": def_itemlen,
                            "code_def": code_detail2,
                            "itemLen_coco": coco_itemlen,
                            "code_coco": code_detail3
                        };
                        console.log("first setting file :" + unixLastMinFirstSett);
                        store.add(backUpLastMinData, function (err) {
                            console.log("--------------[First Setting Success]-------------");
                            fetchJson(); // Start fetching to our JSON cache
                            if (err) throw err; // err if the save failed
                        });

                    } catch (e) {
                        console.log(e);
                    }
                }
            })



        }
    ], function (err, result) {
        // result now equals 'done'
    });


}

function fetchJson() {
    //CheckMedia if file change
    console.log("-------------[CYJ & DEF START CHECK MEDIA]-----------");

    //DoCheckMedia(getname_cyj, getname2_def);
    //setTimeout(fetchJson, 60000); // Fetch it again in a 60 second
    var agsec = "00";
    var agmin = "*";
    var aghour = "*";
    var agday = "*";
    var agmonth = "*";
    var agweek = "*";
    var job = new CronJob({
        cronTime: `${agsec} ${agmin} ${aghour} ${agday} ${agmonth} ${agweek}`,
        onTick: function () {
            DoCheckMedia(getname_cyj, getname2_def, getname2_coco);
        },
        start: false,
        timeZone: 'Asia/Bangkok'
    });
    job.start();
    console.log('job status is : ', job.running);


}

//CHECK MEDIA
function DoCheckMedia(username, username2, username3) {
    console.log(username, username2, username3);

    //FUNCTION CHECK DELETED
    var currenttime = moment().format('YYYY-MM-DD HH:mm:00');
    var unixCurrenttime = moment(currenttime).unix();
    var chklastMin = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
    var unixLastMin = moment(chklastMin).unix();


    var ars_itemlen;
    var def_itemlen;


    async.waterfall([
        function (callback) {

            request({
                url: `https://www.instagram.com/${username}`,
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {


                    //NEW SCARP
                    var shareData = body.match(/window._sharedData = (.*);/)[1];//body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
                    try {
                        var jsonData = JSON.parse(shareData)
                        var body = jsonData.entry_data.ProfilePage["0"];
                        var count = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;
                        //var follower = body.graphql.user.edge_followed_by.count;

                        //Get Latest Caption
                        var caption = "";
                        var captionLen = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges.length;
                        if (captionLen > 0) {
                            caption = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text;
                        }
                        var shortcode = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.shortcode;
                        var code_detail = {
                            shortcode: shortcode,
                            caption: caption
                        }




                        store.load(unixLastMin, function (err, object) {
                            if (err) console.log(err);
                            else {
                                //console.log("loadded : " + unixLastMin);
                                var getItemLen = object.itemLen_ars;
                                //console.log("itemLength Last Minute : " + getItemLen);
                                //CHECK
                                if (count < getItemLen) {
                                    //He Deleted
                                    // console.log("He Deleted!");
                                    var fullname = config[`${username}`][0].name;
                                    var status = `[ ‼️ ] ${fullname} deleted ${getItemLen - count} post(s).\nThe post left ${count}. (；ﾟДﾟ)`;
                                    console.log(status);
                                    TweetDel(status);
                                }

                                //โพสต์ภาพใหม่
                                if (count > getItemLen) {
                                    console.log("-----NEW POST------");
                                    var nPost = count - getItemLen;
                                    for (var i = 0; i < nPost; i++) {
                                        var nodes = body.graphql.user.edge_owner_to_timeline_media.edges[i].node;//body.user.media.nodes[i];
                                        //__typename : , GraphImage,GraphSidecar,GraphVideo?
                                        var code = nodes.shortcode;//nodes.code;
                                        CheckMediaDataType(code, username);
                                    }
                                }

                                //No New Post
                                if (count == getItemLen) {
                                    //Check Caption
                                    var load_shortcode = object.code_ars.shortcode;
                                    var load_caption = object.code_ars.caption;
                                    if (shortcode == load_shortcode) {
                                        //Same Post
                                        if (caption != load_caption) {
                                            //caption change
                                            CheckCaptionIsEdit(shortcode, function (err, result) {
                                                if (err) console.log(err);
                                                else {
                                                    if (result == true) {
                                                        //Caption Edited Confirm
                                                        console.log("******* CAPTION IS EDIT *******");
                                                        MongoClient.connect(dbURL, function (err, client, total_msg_tweet) {
                                                            assert.equal(null, err);
                                                            var db = client.db(dbName);
                                                            findShortCode(db, shortcode, function (callback) {
                                                                //--------DO AFTER CHECK
                                                                if (callback != false) {
                                                                    //console.log(callback);
                                                                    var data = callback;
                                                                    var tweet = data[0].tweet;
                                                                    ReplyTweet(tweet, caption, username);
                                                                } else {
                                                                    console.log("Cannot Load Data")
                                                                }
                                                                client.close();

                                                            });

                                                        });

                                                    } else {
                                                        console.log("******* CAPTION IS NOT CHANGE *******");
                                                    }
                                                }
                                            });
                                        }
                                    }
                                }

                            }


                        });


                        GetStory(username);

                        ars_itemlen = count;




                        callback(null, ars_itemlen, code_detail);
                    } catch (e) {
                        console.log(e);
                    }

                }
            });


        }, function (arg1, code_detail, callback) {
            var ars_itemlen = arg1;
            request({
                url: `https://www.instagram.com/${username2}`,
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {


                    //NEW SCARP
                    var shareData = body.match(/window._sharedData = (.*);/)[1];// body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
                    try {
                        var jsonData = JSON.parse(shareData)

                        var body = jsonData.entry_data.ProfilePage["0"];
                        var count = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;
                        //var follower = body.graphql.user.edge_followed_by.count;
                        def_itemlen = count;

                        //Get Latest Caption
                        var caption2 = "";
                        var captionLen = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges.length;
                        if (captionLen > 0) {
                            caption2 = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text;
                        }
                        var shortcode = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.shortcode;
                        var code_detail2 = {
                            shortcode: shortcode,
                            caption: caption2
                        }
                        store.load(unixLastMin, function (err, object) {
                            if (err) console.log(err);
                            else {
                                //console.log("loadded : " + unixLastMin);
                                var getItemLen = object.itemLen_def;
                                //console.log("itemLength Last Minute : " + getItemLen);
                                //CHECK


                                //โพสต์ภาพใหม่
                                if (count > getItemLen) {
                                    console.log("-----NEW POST------");
                                    var nPost = count - getItemLen;
                                    for (var i = 0; i < nPost; i++) {
                                        var nodes = body.graphql.user.edge_owner_to_timeline_media.edges[i].node;//body.user.media.nodes[i];
                                        //__typename : , GraphImage,GraphSidecar,GraphVideo?
                                        var code = nodes.shortcode;//nodes.code;
                                        CheckMediaDataType(code, username2);
                                    }
                                }

                                //No New Post
                                if (count == getItemLen) {
                                    //Check Caption
                                    var load_shortcode = object.code_def.shortcode;
                                    var load_caption = object.code_def.caption;
                                    if (shortcode == load_shortcode) {
                                        //Same Post
                                        if (caption2 != load_caption) {
                                            //caption change
                                            CheckCaptionIsEdit(shortcode, function (err, result) {
                                                if (err) console.log(err);
                                                else {
                                                    if (result == true) {
                                                        //Caption Edited Confirm
                                                        console.log("******* CAPTION IS EDIT *******");
                                                        MongoClient.connect(dbURL, function (err, client, total_msg_tweet) {
                                                            assert.equal(null, err);
                                                            var db = client.db(dbName);
                                                            findShortCode(db, shortcode, function (callback) {
                                                                //--------DO AFTER CHECK
                                                                if (callback != false) {
                                                                    //console.log(callback);
                                                                    var data = callback;
                                                                    var tweet = data[0].tweet;
                                                                    ReplyTweet(tweet, caption2, username2);
                                                                } else {
                                                                    console.log("Cannot Load Data")
                                                                }
                                                                client.close();

                                                            });

                                                        });

                                                    } else {
                                                        console.log("******* CAPTION IS NOT CHANGE *******");
                                                    }
                                                }
                                            });
                                        }
                                    }
                                }

                                GetStory(username2);
                            }


                        });

                        callback(null, ars_itemlen, def_itemlen, code_detail, code_detail2);

                    }
                    catch (e) {
                        console.log(e);
                    }
                }
            });
        },
        function (arg1, arg2, code_detail, code_detail2, callback) {
            // arg1 now equals 'one' and arg2 now equals 'two'
            console.log("WATERFALL 3");
            console.log(arg1);
            var ars_itemlen = arg1;
            var def_itemlen = arg2;
            //REQUEST DEF
            request({
                url: `https://www.instagram.com/${username3}`,
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {


                    //NEW SCARP
                    var shareData = body.match(/window._sharedData = (.*);/)[1];//body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
                    try {
                        var jsonData = JSON.parse(shareData)

                        var body = jsonData.entry_data.ProfilePage["0"];
                        var count = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;
                        //var follower = body.graphql.user.edge_followed_by.count;
                        var coco_itemlen = count;

                        //Get Latest Caption
                        var caption3 = "";
                        var captionLen = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges.length;
                        if (captionLen > 0) {
                            caption3 = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.edge_media_to_caption.edges[0].node.text;
                        }
                        var shortcode = body.graphql.user.edge_owner_to_timeline_media.edges[0].node.shortcode;
                        var code_detail3 = {
                            shortcode: shortcode,
                            caption: caption3
                        }

                        store.load(unixLastMin, function (err, object) {
                            if (err) console.log(err);
                            else {
                                //console.log("loadded : " + unixLastMin);
                                var getItemLen = object.itemLen_coco;
                                //console.log("itemLength Last Minute : " + getItemLen);
                                //NO CHECK DEF DELETE


                                //โพสต์ภาพใหม่
                                if (coco_itemlen > getItemLen) {
                                    console.log("-----NEW POST------");
                                    var nPost = count - getItemLen;
                                    for (var i = 0; i < nPost; i++) {
                                        var nodes = body.graphql.user.edge_owner_to_timeline_media.edges[i].node;//body.user.media.nodes[i];
                                        //__typename : , GraphImage,GraphSidecar,GraphVideo?
                                        var code = nodes.shortcode;//nodes.code;
                                        CheckMediaDataType(code, username3);
                                    }
                                }

                                //No New Post
                                if (count == getItemLen) {
                                    //Check Caption
                                    var load_shortcode = object.code_coco.shortcode;
                                    var load_caption = object.code_coco.caption;
                                    if (shortcode == load_shortcode) {
                                        //Same Post
                                        if (caption3 != load_caption) {
                                            //caption change
                                            CheckCaptionIsEdit(shortcode, function (err, result) {
                                                if (err) console.log(err);
                                                else {
                                                    if (result == true) {
                                                        //Caption Edited Confirm
                                                        console.log("******* CAPTION IS EDIT *******");
                                                        MongoClient.connect(dbURL, function (err, client, total_msg_tweet) {
                                                            assert.equal(null, err);
                                                            var db = client.db(dbName);
                                                            findShortCode(db, shortcode, function (callback) {
                                                                //--------DO AFTER CHECK
                                                                if (callback != false) {
                                                                    //console.log(callback);
                                                                    var data = callback;
                                                                    var tweet = data[0].tweet;
                                                                    ReplyTweet(tweet, caption3, username3);
                                                                } else {
                                                                    console.log("Cannot Load Data")
                                                                }
                                                                client.close();

                                                            });

                                                        });

                                                    } else {
                                                        console.log("******* CAPTION IS NOT CHANGE *******");
                                                    }
                                                }
                                            });
                                        }
                                    }
                                }
                                GetStory(username3);
                            }


                        });



                        //STORE DATA
                        console.log("----------STORE NEW DATA-----------");
                        console.log("FILE NAME :  " + unixCurrenttime);
                        console.log("ars item length " + ars_itemlen);
                        console.log("def item length " + def_itemlen);
                        console.log("coco item length" + coco_itemlen);
                        //STORE NEW DATA
                        var backUpData = {
                            id: unixCurrenttime, //also filename
                            "itemLen_ars": ars_itemlen,
                            "code_ars": code_detail,
                            "itemLen_def": def_itemlen,
                            "code_def": code_detail2,
                            "itemLen_coco": coco_itemlen,
                            "code_coco": code_detail3
                        };

                        store.add(backUpData, function (err) {
                            // called when the file has been written
                            // to the /path/to/storage/location/12345.json
                            if (err) console.log(err); // err if the save failed
                        });

                        //finish check
                        //DELETE Last 5 Min File
                        var chklast15Min = moment().subtract(15, 'minute').format('YYYY-MM-DD HH:mm:00');
                        var unixLast15Min = moment(chklast15Min).unix();
                        console.log("-------------------REMOVE DATA ----------- : " + unixLast15Min);
                        store.remove(unixLast15Min, function (err) {
                            //console.log("remove : " + chklastMin);
                            if (err) console.log(err); // err if the file removal failed
                        });
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
            });
        }],
        function (err, result) {
            // result now equals 'done'
        });



}

function CheckCaptionIsEdit(shortcode, callback) {
    request({
        url: `https://www.instagram.com/p/${shortcode}/?__a=1`,
        json: true
    }, function (error, response, body) {
        var nodes = body.graphql.shortcode_media;
        result = nodes.caption_is_edited;
        console.log("*********caption edited is : " + result);

        callback(null, result);
    });
}
function GetStory(username) {

    var chklastMin = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
    var unixLastMin = moment(chklastMin).unix();

    //SESSION ID
    var session_id = config.session_id;
    //expired : 2018-07-22T02:57:03.619Z
    //var cyjid = config.cyjid;
    var owner_id = config[`${username}`][0].id;
    var somzid = config.somzid;

    //IG STORY CHECK 
    getStories({ id: owner_id, userid: somzid, sessionid: session_id }).then(stories => {
        var body = stories;
        var storyid = body.id;
        //console.log(storyid);
        //var story_url = "https://www.instagram.com/p/" + code;
        //console.log("STORY URL : " + story_url);
        var story_count = body.items.length;
        //console.log("story have : " + story_count);
        if (story_count > 0) {
            for (var c = 0; c < story_count; c++) {


                var item = body.items[c];
                var itemCode = body.items[c].code;


                //DateTime Taken
                var taken_at = item.taken_at;
                var taken_at_mm = moment.unix(taken_at);
                var time_taken = momentTz.tz(taken_at_mm, "Asia/Seoul").format('MMM DD YYYY, HH:mm');
                console.log("Taken At : " + time_taken);
                var time_taken_forchk = moment(taken_at_mm).format('YYYY-MM-DD HH:mm:00');

                var media_type = item.media_type;
                if (time_taken_forchk == chklastMin) {
                    if (media_type == 1) {
                        CheckMediaDataType(itemCode, username);
                    }

                    if (media_type == 2) { //Video
                        var video_url = item.video_versions[0].url;
                        console.log("VIDEO URL : " + video_url);

                        var caption = config[`${username}`][0].title_story + "\n" + config[`${username}`][0].hashtag + "\n" + time_taken;
                        var stream = request(video_url).pipe(fs.createWriteStream(`./public/media/${itemCode}.mp4`));
                        stream.on('finish', function () {
                            console.log('---stream video done---')
                            var file_path = `./public/media/${itemCode}.mp4`;
                            TweetVideo(file_path, caption, username, itemCode);
                        });


                    }
                }
            }

        }
    })

}

function GetStoryFromPost(num, username) {
    //SESSION ID
    var session_id = config.session_id;
    //expired : 2018-07-22T02:57:03.619Z
    //var cyjid = config.cyjid;
    var owner_id = config[`${username}`][0].id;
    var somzid = config.somzid;

    //IG STORY CHECK 
    getStories({ id: owner_id, userid: somzid, sessionid: session_id }).then(stories => {
        var body = stories;
        var storyid = body.id;
        var story_count = body.items.length;
        if (story_count > 0) {
            //for (var c = 0; c < story_count; c++) {


            var item = body.items[num];
            var itemCode = body.items[num].code;


            //DateTime Taken
            var taken_at = item.taken_at;
            var taken_at_mm = moment.unix(taken_at);
            var time_taken = momentTz.tz(taken_at_mm, "Asia/Seoul").format('MMM DD YYYY, HH:mm');
            console.log("Taken At : " + time_taken);
            var time_taken_forchk = moment(taken_at_mm).format('YYYY-MM-DD HH:mm:00');

            var media_type = item.media_type;
            // if (time_taken_forchk == chklastMin) {
            if (media_type == 1) {
                CheckMediaDataType(itemCode, username);
            }

            if (media_type == 2) { //Video
                var video_url = item.video_versions[0].url;
                console.log("VIDEO URL : " + video_url);

                var caption = config[`${username}`][0].title_story + "\n" + config[`${username}`][0].hashtag + "\n" + time_taken;
                var stream = request(video_url).pipe(fs.createWriteStream(`./public/media/${itemCode}.mp4`));
                stream.on('finish', function () {
                    console.log('---stream video done---')
                    var file_path = `./public/media/${itemCode}.mp4`;
                    TweetVideo(file_path, caption, username, itemCode);
                });


            }
            //}
            //}

        } else {
            console.log("NO STORY");
        }
    })
}

//FUNCTION GET MEDIA DATA TYPE
function CheckMediaDataType(code, username) {
    request({
        url: `https://www.instagram.com/p/${code}/?__a=1`,
        json: true
    }, function (error, response, body) {
        var nodes = body.graphql.shortcode_media;
        var getDataCode = nodes;
        var __typename = nodes.__typename;
        var chkCaption = nodes.edge_media_to_caption.edges.length;

        //CHECK IF NO CAPTION
        var caption;
        if (chkCaption == 0) {
            caption = "";
        } else {
            caption = nodes.edge_media_to_caption.edges[0].node.text;
        }
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
        var config = require('./config/default');
        var fistfixedTxt = config[`${username}`][0].title;
        var hashtagLink = config[`${username}`][0].hashtag + link + "\n";

        if (__typename == "GraphStoryImage") {
            fistfixedTxt = config[`${username}`][0].title_story;
            hashtagLink = config[`${username}`][0].hashtag;
        }

        var timestmp = create_time_KR;
        console.log("timestmp : " + timestmp);

        console.log("========First Text Length : " + fistfixedTxt.length);
        console.log("============= HashTag + Link Length : " + hashtagLink.length);
        console.log("================ TimeStamp Length : " + timestmp.length);

        //Check Text Title
        var validRange_title = Twittxt.parseTweet(fistfixedTxt + hashtagLink + timestmp);
        // var txtLeft = 280 - validRange_title.validRangeEnd;
        console.log(validRange_title);


        console.log("================= Using Twitter Text Parser================");
        var validRange = Twittxt.parseTweet(txtcaption);
        console.log(validRange);
        // Set Text Caption to Valid Range
        if (validRange.valid == false) {
            //Text is too long
            igcaption = txtcaption.substring(validRange.validRangeStart, validRange.validRangeEnd - validRange_title.validRangeEnd - 3);
            igcaption += "...";
        } else {
            igcaption = txtcaption.substring(validRange.validRangeStart, validRange.validRangeEnd + 1);
            console.log(igcaption);
        }



        // var igcaption;
        // if (txtcaption.length > txtLeft) {
        //     console.log("-- ig caption too long -- ")
        //     igcaption = txtcaption.substring(0, txtLeft) + "...";
        // }
        // if (txtcaption.length <= txtLeft) {
        //     console.log("-- ig caption NOT too long -- ")
        //     igcaption = txtcaption;
        // }


        var total_msg_tweet = fistfixedTxt + igcaption + hashtagLink + timestmp;
        console.log(total_msg_tweet);


        //TYPE IMAGE
        if (__typename == "GraphImage") {
            var url = nodes.display_url;
            console.log(url);
            var newUrl = url;
            console.log(newUrl);

            var stream = request(newUrl).pipe(fs.createWriteStream(`./public/media/${code}.jpg`));
            stream.on('finish', function () {
                console.log('---stream done---')
                //POST TWITTER
                console.log("start tweet image");
                TweetImage(code, total_msg_tweet, username);

            });
        }

        //TYPE VIDEO
        if (__typename == "GraphVideo") {
            var video_url = nodes.video_url;
            console.log(video_url);
            var stream = request(video_url).pipe(fs.createWriteStream(`./public/media/${code}.mp4`));
            stream.on('finish', function () {
                console.log('---stream video done---')

                var file_path = `./public/media/${code}.mp4`;
                TweetVideo(file_path, total_msg_tweet, username, code);
            });
        }


        //TYPE CAROUSEL
        if (__typename == "GraphSidecar") {

            if (validRange.valid == false) {
                //Text is too long
                igcaption = txtcaption.substring(validRange.validRangeStart, validRange.validRangeEnd - validRange_title.validRangeEnd - 3 - 5);
                igcaption += "...";
            } else {
                igcaption = txtcaption.substring(validRange.validRangeStart, validRange.validRangeEnd + 1);
                console.log(igcaption);
            }

            // var txtLeft = 280 - fistfixedTxt.length - hashtagLink.length - timestmp.length - 3 - 5;
            // console.log("txtLeft : " + txtLeft);
            // var igcaption;
            // if (txtcaption.length > txtLeft) {
            //     console.log("-- ig caption too long -- ")
            //     igcaption = txtcaption.substring(0, txtLeft) + "...";
            // }
            // if (txtcaption.length <= txtLeft) {
            //     console.log("-- ig caption NOT too long -- ")
            //     igcaption = txtcaption;
            // }
            // console.log("IG CAPTION : " + igcaption);



            var carouselLen = nodes.edge_sidecar_to_children.edges.length;
            console.log(carouselLen);
            var allData = [];
            var carouselURL_image = [];
            var carouselURL_video = [];
            var mediaIDSet = [];
            var c, i;

            for (c = 0; c < carouselLen; c++) {
                if (nodes.edge_sidecar_to_children.edges[c].node.__typename == "GraphImage") {
                    var carouselURL = nodes.edge_sidecar_to_children.edges[c].node.display_url;

                    //var splitUrl = carouselURL.split("/");
                    // var newUrl = carouselURL.replace(splitUrl[7] + "/", "").replace(splitUrl[4] + "/", "");
                    var newUrl = carouselURL;
                    console.log(newUrl);

                    carouselURL_image.push(newUrl);

                } else if (nodes.edge_sidecar_to_children.edges[c].node.__typename = "GraphVideo") {
                    /* Do Video Function */
                    var carouselVideoURL = nodes.edge_sidecar_to_children.edges[c].node.video_url;
                    carouselURL_video.push(carouselVideoURL);
                }
            }

            //CAROUSEL VIDEO
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
                                tweet_text: total_msg_tweet,
                                username, username
                            });
                        }
                        if (carouselURL_image.length > 0 && carouselURL_image.length < 5) {
                            //tweet of image has 1
                            var itemLen = carouselURL_video.length + 1;
                            var total_msg_tweet = fistfixedTxt + igcaption + `(${idvid}/${itemLen})` + hashtagLink + timestmp;
                            var videoTweet = new VideoTweet({
                                file_path: `./public/media/${code}_${numVid}.mp4`,
                                tweet_text: total_msg_tweet,
                                username, username
                            });
                        }
                        if (carouselURL_image.length >= 5 && carouselURL_image.length < 9) {
                            //tweet of video has 2
                            var itemLen = carouselURL_video.length + 2;
                            var total_msg_tweet = fistfixedTxt + igcaption + `(${idvid}/${itemLen})` + hashtagLink + timestmp;
                            var videoTweet = new VideoTweet({
                                file_path: `./public/media/${code}_${numVid}.mp4`,
                                tweet_text: total_msg_tweet,
                                username, username
                            });
                        }
                        if (carouselURL_image.length >= 9) {
                            //tweet of video has 3
                            var itemLen = carouselURL_video.length + 3;
                            var total_msg_tweet = fistfixedTxt + igcaption + `(${idvid}/${itemLen})` + hashtagLink + timestmp;
                            var videoTweet = new VideoTweet({
                                file_path: `./public/media/${code}_${numVid}.mp4`,
                                tweet_text: total_msg_tweet,
                                username, username
                            });
                        }

                    });
                });
            }

            //CAROUSEL IMAGES
            if (carouselURL_image.length > 0 && carouselURL_image.length < 5) {
                console.log("carouselURL_image lower than 4");
                if (carouselURL_video.length > 0) {
                    var itemLen = carouselURL_video.length + carouselURL_image.length;
                    var idImg = carouselURL_video.length + 1;
                    var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;
                }


                var chkTweet = CarouselImageTweet(carouselURL_image, carouselURL_image.length, code, total_msg_tweet, username, function (callback) {
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

                    var chkTweet = CarouselImageTweet(newAllData, newAlldataLength, code, total_msg_tweet, username, function (callback) {
                        console.log(callback);
                        if (callback == "done") {
                            var itemLen = carouselURL_video.length + 2;
                            var idImg = carouselURL_video.length + 2;
                            var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;
                            CarouselImageTweet(newAllData2, newAlldataLength2, code, total_msg_tweet, username, function (callback) {
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

                    var chkTweet = CarouselImageTweet(newAllData, newAlldataLength, code, total_msg_tweet, username, function (callback) {
                        console.log(callback);
                        if (callback == "done") {
                            var itemLen = carouselURL_video.length + 2;
                            var idImg = carouselURL_video.length + 2;
                            var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;
                            var chkTweet2 = CarouselImageTweet(newAllData2, newAlldataLength2, code, total_msg_tweet, username, function (callback) {
                                console.log(callback);
                            });
                        }
                    });
                });
            }
            if (carouselURL_image.length >= 9) {
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

                    var chkTweet = CarouselImageTweet(newAllData, newAlldataLength, code, total_msg_tweet, username, function (callback) {
                        console.log(callback);
                        if (callback == "done") {
                            var itemLen = carouselURL_video.length + 3;
                            var idImg = carouselURL_video.length + 2;
                            var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;

                            CarouselImageTweet(newAllData2, newAlldataLength2, code, total_msg_tweet, username, function (callback) {
                                console.log(callback);
                                if (callback == "done") {
                                    var itemLen = carouselURL_video.length + 3;
                                    var idImg = carouselURL_video.length + 3;
                                    var total_msg_tweet = fistfixedTxt + igcaption + `(${idImg}/${itemLen})` + hashtagLink + timestmp;
                                    CarouselImageTweet(newAllData3, newAlldataLength3, code, total_msg_tweet, username, function (callback) {
                                        console.log(callback);
                                    });
                                }
                            });
                        }
                    });
                });
            }


        }

        //STORY TYPE IMAGE
        if (__typename == "GraphStoryImage") {
            //Story Image
            var dim_height = nodes.dimensions.height;
            var dim_width = nodes.dimensions.width;
            for (var d = 0; d < nodes.display_resources.length; d++) {
                var getConfigH = nodes.display_resources[d].config_height;
                var getConfigW = nodes.display_resources[d].config_width;
                console.log(getConfigH);
                console.log(getConfigW);
                if (getConfigH == dim_height && getConfigW == dim_width) {
                    var img_url = nodes.display_resources[d].src;
                    console.log("IMG URL : " + img_url);

                    var stream = request(img_url).pipe(fs.createWriteStream(`./public/media/${code}.jpg`));
                    stream.on('finish', function () {
                        console.log('---stream done---')
                        //POST TWITTER
                        console.log("start tweet image");
                        TweetImage(code, total_msg_tweet, username);
                    });
                }






            }
        }

        //Check Database
        // console.log("--START CHECK DATA FROM MONGO--");
        // MongoClient.connect(dbURL, function (err, client, total_msg_tweet) {
        //     assert.equal(null, err);
        //     console.log("Connected successfully to server");

        //     const db = client.db(dbName);
        //     findShortCode(db, shortcode, function (callback) {
        //         // client.close();
        //         console.log(callback);
        //         //--------DO AFTER CHECK
        //         if (callback == true) {
        //             console.log("-----------INSERT DATA----------")
        //             insertDataPost(db, username, shortcode, getDataCode, function (callback) {
        //                 console.log(callback);
        //                 client.close();

        //             });
        //         } else {
        //             console.log("Data is alreay exist")
        //         }

        //     });

        // });





    });
}

//FUNCTION TWEET IMAGE
function TweetImage(code, total_msg_tweet, username) {
    var clean_msg_tweet = total_msg_tweet.replace("@", "@.");
    //LENAYK
    var secret = config[`${username}`][0].auth;//require("./auth"); //save before launch (auth)
    var Twitter = new TwitterPackage(secret);
    var data = require('fs').readFileSync(`./public/media/${code}.jpg`);
    Twitter.post('media/upload', { media: data }, function (error, media, response) {
        if (!error) {
            console.log(media);
            var status = {
                status: clean_msg_tweet,
                media_ids: media.media_id_string // Pass the media id string
            }
            Twitter.post('statuses/update', status, function (error, tweet, response) {
                if (error) console.log(error);
                else {
                    console.log("done");
                    //Save Tweet to MongoDB
                    MongoClient.connect(dbURL, function (err, client) {
                        assert.equal(null, err);
                        var db = client.db(dbName);
                        // Add Document
                        insertDataPost(db, username, code, tweet, function (callback) {
                            console.log(callback);
                            client.close();
                        });
                    });

                }
            });

        } if (error) {
            console.log(error);
        }
    });


}


function ReplyTweet(tweet, caption, username) {
    var clean_caption = caption.replace("@", "@.");
    var res = {
        status: "@" + tweet.user.screen_name + ' [CAPTION] ' + clean_caption,
        in_reply_to_status_id: '' + tweet.id_str
    };

    var secret = config[`${username}`][0].auth;
    var Twitter = new TwitterPackage(secret);

    Twitter.post('statuses/update', res, function (err, data, response) {
        if (err) console.log(err);
        else {
            console.log("+++++ reply at " + username + " successfully");
        }
        //console.log(data);
    }
    );

}


//FUNCTION CAROUSEL TWEET
function CarouselImageTweet(allData, allDataLength, code, total_msg_tweet, username, callback) {
    var clean_msg_tweet = total_msg_tweet.replace("@", "@.");
    var secret = config[`${username}`][0].auth;
    var Twitter = new TwitterPackage(secret);
    console.log("------Start Carousel Image Function--------");
    console.log(allData);
    var mediaIDSet = [];
    var data, stream;

    forEach(allData, function (item, index, arr) {
        var d = allData.indexOf(item) + 1;
        //mediaIDSet.push(null);
        if (allData.indexOf(item) < allDataLength) {
            stream = request(item).pipe(fs.createWriteStream(`./public/media/${code}_${d}.jpg`));
            stream.on('finish', function () {
                data = require('fs').readFileSync(`./public/media/${code}_${index + 1}.jpg`);
                Twitter.post('media/upload', { media: data }, function (error, media, response) {
                    if (!error) {
                        console.log("=====================MEDIA======================");
                        console.log(`./public/media/${code}_${index + 1}.jpg`);
                        console.log(media);
                        mediaIDSet[index] = media.media_id_string;
                        if (mediaIDSet.length == allDataLength) {
                            //TWEET MESSAGE
                            var status = {
                                status: clean_msg_tweet,
                                media_ids: `${mediaIDSet}` // Pass the media id string
                            }
                            // console.log(media.media_id_string);
                            Twitter.post('statuses/update', status, function (error, tweet, response) {
                                if (!error) {
                                    // console.log("done");
                                    //Save Tweet to MongoDB
                                    MongoClient.connect(dbURL, function (err, client) {
                                        assert.equal(null, err);
                                        var db = client.db(dbName);
                                        // Add Document
                                        insertDataPost(db, username, code, tweet, function (callback) {
                                            console.log(callback);
                                            client.close();
                                        });
                                    });
                                    callback("done");
                                }
                            });
                        }

                        console.log("mediaID Set : " + mediaIDSet);
                    } if (error) {
                        console.log(error);
                    }
                });


            });
        }

    });
}


const findShortCode = function (db, shortcode, callback) {
    // Get the documents collection
    const collection = db.collection('db_ars');
    // Find some documents
    collection.find({ 'shortcode': shortcode }).sort({ 'shortcode': -1 }).toArray(function (err, docs) {
        assert.equal(err, null);
        // console.log(docs);
        if (docs.length > 0) {
            return callback(docs);
        } else return callback(false);

    });
}


//create collection
const insertDataPost = function (db, username, shortcode, tweet, callback) {
    db.collection('db_ars').save({
        "username": username,
        "shortcode": shortcode,
        "active": "yes",
        //"node": getDataCode,
        "tweet": tweet
    }, function (err, result) {

        assert.equal(err, null);
        console.log("Insert Success");
        callback(result);
    });
};



//FUNCTION TWEETDEL
function TweetDel(status) {
    //Screenshot
    const stream = screenshot('https://www.instagram.com/333cyj333/', '1080x720', { delay: 7 });
    stream.pipe(fs.createWriteStream(`./public/media/choidel.png`));
    stream.on('finish', function () {

        var getStatus = status;
        var secret = config.auth_del;//require("./auth_del");
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

function TweetMSG(status, username) {
    var getStatus = status;
    var secret = config[`${username}`][0].auth;
    var Twitter = new TwitterPackage(secret);

    Twitter.post('statuses/update', { status: getStatus }, function (error, tweet, response) {
        if (!error) {
            console.log("done");
        }
    });


}

//FUNCTION TWEET VIDEO
function TweetVideo(file_path, total_msg_tweet, username, code) {

    //FUNCTION TWEET VIDEO
    var secret = config[`${username}`][0].auth;//require('./oauth'); //LENAYK() (old : oauth.json)
    // file_path = './public/media/testvideo.mp4';
    var Twitter = new TwitterPackage(secret);
    var mediaType = 'video/mp4';//'image/gif'; // `'video/mp4'` is also supported
    const mediaData = require('fs').readFileSync(file_path);
    const mediaSize = require('fs').statSync(file_path).size;



    var finalize_success = false;
    console.log(mediaSize);
    initUpload() // Declare that you wish to upload some media
        .then(appendUpload) // Send the data for the media
        .then(finalizeUpload) // Declare that you are done uploading chunks
        .then(mediaId => {

            console.log("Media ID : " + mediaId);
            // You now have an uploaded movie/animated gif
            // that you can reference in Tweets, e.g. `update/statuses`
            // will take a `mediaIds` param.'
            var clean_msg_tweet = total_msg_tweet.replace("@", "@.");
            var status = {
                status: clean_msg_tweet,
                media_ids: mediaId// Pass the media id string
            }
            console.log("Start Tweet");
            // if (finalize_success == true) {
            Twitter.post('statuses/update', status, function (error, tweet, response) {
                if (!error) {
                    console.log("Tweet Success");
                    //console.log(tweet);
                    //Save Tweet to MongoDB
                    MongoClient.connect(dbURL, function (err, client) {
                        assert.equal(null, err);
                        var db = client.db(dbName);
                        // Add Document
                        insertDataPost(db, username, code, tweet, function (callback) {
                            console.log(callback);
                            client.close();
                        });
                    });
                }
                if (error) console.log(error);

            });
            // }

        });

    /**
* Step 1 of 3: Initialize a media upload
* @return Promise resolving to String mediaId
*/
    function initUpload() {
        return makePost('media/upload', {
            command: 'INIT',
            media_category: 'tweet_video',
            total_bytes: mediaSize,
            media_type: mediaType,
        }, true).then(data => data.media_id_string);
    }

    /**
     * Step 2 of 3: Append file chunk
     * @param String mediaId    Reference to media object being uploaded
     * @return Promise resolving to String mediaId (for chaining)
     */
    function appendUpload(mediaId) {
        var bytes_sent = 0;
        var segment_id = 0;
        var mediaID_Set = [];


        //Original Function
        return makePost('media/upload', {
            command: 'APPEND',
            media_id: mediaId,
            media: mediaData,
            segment_index: 0
        }, true).then(data => mediaId);
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
        }, true).then(data => mediaId);
    }

    /**
     * (Utility function) Send a POST request to the Twitter API
     * @param String endpoint  e.g. 'statuses/upload'
     * @param Object params    Params object to send
     * @return Promise         Rejects if response is error
     */
    function makePost(endpoint, params) {
        return new Promise((resolve, reject) => {
            Twitter.post(endpoint, params, (error, data, response) => {
                console.log("ENDPOINT IS :  " + endpoint);
                console.log(params);
                if (error) {
                    reject(error);
                } else {

                    console.log(params);
                    if (params.command == 'FINALIZE') {
                        var mediaID = params.media_id;
                        var status = {
                            command: 'STATUS',
                            media_id: mediaID
                        }

                        var chkProcess = "";
                        var myVar;
                        var index = 0;
                        myFunction();
                        function myFunction() {
                            myVar = setTimeout(myFunction, 5000);

                            Twitter.get('media/upload', status, function (error, result, response) {
                                console.log("------------------------RESULT OF STATUS --------------------");
                                if (!error) {
                                    console.log(result);
                                    var chkProcess = result.processing_info.state;
                                    console.log("Check Process ::::::: " + chkProcess);
                                    if (chkProcess == "succeeded") {
                                        clearTimeout(myVar);
                                        resolve(data);
                                    }
                                    index += 1;
                                    if (index == 100) {
                                        clearTimeout(myVar);
                                    }
                                } else {
                                    clearTimeout(myVar);
                                    console.log(error);
                                }
                            })
                        }


                        // clearTimeout(myVar);
                        //     request({ url: 'https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=' + mediaID,
                        //     header : 'authorization: OAuth oauth_consumer_key=“<MY_CONSUMER_KEY>“ , oauth_nonce="GENERATED", oauth_signature="GENERATED", oauth_signature_method="HMAC-SHA1", oauth_timestamp="GENERATED", oauth_token=“<MY_ACCESS_TOKEN>”, oauth_version="1.0"'
                        //  }
                        //         , function (error, response, body) {
                        //             console.log("-----------------Check Status--------------------");
                        //             if (!error) console.log(body);
                        //             if (error) console.log(error);

                        //         });

                    } else {
                        resolve(data);
                    }


                }
            });
        });
    }




}


function CheckProcessTweet(username, status) {

    var secret = config[`${username}`][0].auth;//require('./oauth'); //LENAYK() (old : oauth.json)
    // file_path = './public/media/testvideo.mp4';
    var Twitter = new TwitterPackage(secret);
    Twitter.get('media/upload', status, function (error, result, response) {
        console.log("------------------------RESULT OF STATUS --------------------");
        if (!error) {
            console.log(result);
            var chkProcess = result.processing_info.state;
            console.log("Check Process ::::::: " + chkProcess);
            return chkProcess;
        } else {
            console.log(error);
            return null;
        }
    })

}
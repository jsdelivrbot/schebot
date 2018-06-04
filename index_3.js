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
const config = require('./config/default');
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

            var shareData = body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
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





//Adding for reslove bugging on heroku
//333CYJ333
var getname = config.cyjname;
var getname_cyj = config[`${getname}`][0].account;
FirstSetting(getname_cyj);

//PRDSDEF
var getname2 = config.defname;
console.log(getname2);
var getname2_def = config[`${getname2}`][0].account;
//var title = config[`${getname}`][0].title;
FirstSetting_Def(getname2_def);



function FirstSetting_Def(username) {
    //First SETTING
    var lastMinFirstSett = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
    var unixLastMinFirstSett = moment(lastMinFirstSett).unix();
    request({
        url: `https://www.instagram.com/${username}/`//?__a=1
        //json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            var shareData = body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
            var jsonData = JSON.parse(shareData)
            var body = jsonData.entry_data.ProfilePage["0"];

            var FitemLen = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;

            var backUpLastMinData = {
                id: username + '-' + unixLastMinFirstSett, //also filename
                "name": "item",
                "itemLen": FitemLen
            };

            store.add(backUpLastMinData, function (err) {
                console.log("--------------[DEF_First Setting Success]-------------");

                fetchJson_Def(); // Start fetching to our JSON cache
                if (err) throw err; // err if the save failed
            });

        }
    });
}

function FirstSetting(username) {
    //First SETTING
    var lastMinFirstSett = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
    var unixLastMinFirstSett = moment(lastMinFirstSett).unix();
    request({
        url: `https://www.instagram.com/${username}/`//?__a=1
        //json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {

            var shareData = body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
            var jsonData = JSON.parse(shareData)
            var body = jsonData.entry_data.ProfilePage["0"];

            var FitemLen = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;

            var backUpLastMinData = {
                id: username + '-' + unixLastMinFirstSett, //also filename
                "name": "item",
                "itemLen": FitemLen
            };

            store.add(backUpLastMinData, function (err) {
                console.log("--------------[CYJ_First Setting Success]-------------");

                fetchJson(); // Start fetching to our JSON cache
                if (err) throw err; // err if the save failed
            });

        }
    });
}


function fetchJson() {
    //CheckMedia if file change
    console.log("-------------[CYJ_START CHECK MEDIA]-----------");
    //AlbumSales();
    DoCheckMedia(getname_cyj);
    setTimeout(fetchJson, 60000); // Fetch it again in a 60 second
}

function fetchJson_Def() {
    //CheckMedia if file change
    console.log("-------------[DEF_START CHECK MEDIA]-----------");
    //AlbumSales();
    DoCheckMedia(getname2_def);
    setTimeout(fetchJson_Def, 60000); // Fetch it again in a 60 second
}



function AlbumSales() {

    //Check Minute
    var current_time = moment().format('mm');
    console.log("current time : " + current_time);
    //var current_hour = moment().format('H');
    var chkHour = moment.tz(moment(), "H", "Asia/Seoul");
    var current_hour = moment(chkHour).format("H")

    if ((24 >= current_hour && current_hour > 11) || current_hour == 0) { // (7 - 24 Hours KST)
        if (current_time == "00") {//current_time == "30" ||
            request({
                url: `http://www.hanteochart.com/chart/onoff/body?album_idx=49801290&term=6`,
                json: true
            }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var online_sales = body.data.online_sales;
                    var offline_sales = body.data.offline_sales;
                    var sum_sales_volume = online_sales + offline_sales;//body.data.sum_sales_volume;
                    console.log("Online sales : " + online_sales);
                    console.log("Offline sales : " + offline_sales);
                    console.log("Sum sales volume : " + sum_sales_volume);
                    if (online_sales != 0 && offline_sales != 0) {
                        store.load("album_sales", function (err, object) {
                            if (err) console.log(err);


                            var chkOnline_sales = object.online_sales;
                            var chkOffline_sales = object.offline_sales;
                            //var chkTotal_sales = object.sum_sales_volume;
                            var chkPrv_sales = object.previous_sales;

                            var TOTAL_SALES = sum_sales_volume + chkPrv_sales;
                            console.log("**** TOTAL SALES : " + TOTAL_SALES);
                            if (chkOnline_sales != online_sales || chkOffline_sales != offline_sales) {
                                //TWEET
                                console.log("let's tweet!");

                                var create_time_KR = momentTz.tz(moment(), "Asia/Seoul").format('HH:mm');
                                console.log(create_time_KR);


                                var startDate = moment.tz("12-03-2018", "DD-MM-YYYY", "Asia/Seoul");
                                var endDate = moment.tz(moment(), "DD-MM-YYYY", "Asia/Seoul");

                                var result = endDate.diff(startDate, 'days') + 1;
                                console.log('result : ' + result);

                                var newstatus = `Hanteo Chart Album Sales\nDay-${result} ${create_time_KR} KST \n\n🐥🐥🐥💚\n`;
                                var online_sales_currency = online_sales.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
                                var offline_sales_currency = offline_sales.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
                                var sum_sales_currency = TOTAL_SALES.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
                                //Check Rise Up
                                var online_up = online_sales - chkOnline_sales;
                                var offline_up = offline_sales - chkOffline_sales;
                                var online_up_currency = online_up.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
                                var offline_up_currency = offline_up.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");

                                if (offline_up == 0 && online_up > 0) {
                                    newstatus += `Online Sales : ${online_sales_currency}  (🔺${online_up_currency})`;
                                    newstatus += `\nOffline Sales : ${offline_sales_currency}`;
                                    newstatus += `\n🚩TOTAL : ${sum_sales_currency}`;
                                    newstatus += `\n\n#LOOK #LOOKGOT7\n#GOT7 #갓세븐\n#EYESONYOU`;


                                } if (online_up == 0 && offline_up > 0) {
                                    newstatus += `Online Sales : ${online_sales_currency}  `;
                                    newstatus += `\nOffline Sales : ${offline_sales_currency} (🔺${offline_up_currency})`;
                                    newstatus += `\n🚩TOTAL : ${sum_sales_currency}`;
                                    newstatus += `\n\n#LOOK #LOOKGOT7\n#GOT7 #갓세븐\n#EYESONYOU`;
                                } if (online_up > 0 && offline_up > 0) {
                                    newstatus += `Online Sales : ${online_sales_currency}  (🔺${online_up_currency})`;
                                    newstatus += `\nOffline Sales : ${offline_sales_currency} (🔺${offline_up_currency})`;
                                    newstatus += `\n🚩TOTAL : ${sum_sales_currency}`;
                                    newstatus += `\n\n#LOOK #LOOKGOT7\n#GOT7 #갓세븐\n#EYESONYOU`;
                                }


                                console.log(newstatus);

                                // var secret = require("./cyj5s");
                                // var Twitter = new TwitterPackage(secret);
                                // Twitter.post('statuses/update', { status: newstatus }, function (error, tweet, response) {
                                //     if (error) throw error;
                                //     console.log("Tweeted!!!");
                                // });

                                //TWEET WITH IMAGE
                                var stream = screenshot('http://www.hanteochart.com/ranking/music/album?idx=49801290&rank_artist_type=1&term=0', '1280x1080', { crop: true, delay: 5, selector: '.demo-container' });//#gold_user

                                stream.pipe(fs.createWriteStream(`./public/media/graph.png`));
                                stream.on('finish', function () {

                                    var getStatus = newstatus;

                                    var secret = require("./cyj5s"); //save before launch (auth)
                                    var Twitter = new TwitterPackage(secret);
                                    var data = require('fs').readFileSync(`./public/media/graph.png`);
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

                                //Check History Sales
                                store.load("history_sales", function (err, object) {
                                    if (err) console.log(err);
                                    var prev_sales = object.previous_sales;
                                    console.log("Previous Sale: " + prev_sales);

                                    //BACKUP DATA
                                    var backUpData = {
                                        id: "album_sales", //also filename
                                        "online_sales": online_sales,
                                        "offline_sales": offline_sales,
                                        "previous_sales": prev_sales,// 148653,127192,////53944,73248
                                        "sum_sales_volume": TOTAL_SALES
                                    };
                                    console.log("let's backup data");
                                    store.add(backUpData, function (err) {
                                        if (err) console.log(err); // err if the save failed
                                    });
                                });
                            }

                        }
                        );

                    }
                }
            });




        }
    }
    if (current_hour == 1) { //1AM
        store.load("album_sales", function (err, object) {
            if (err) console.log(err);
            var sum_album_sales = object.sum_sales_volume;
            //Save to history สำหรับขึ้นวันใหม่

            //BACKUP DATA
            var backUpData = {
                id: "history_sales", //also filename
                "previous_sales": sum_album_sales
            };
            console.log("---Save To History Data---");
            store.add(backUpData, function (err) {
                if (err) console.log(err); // err if the save failed
            });


            //Set Default Album Sales
            var AlbumSalesData = {
                "id": "album_sales",
                "online_sales": 0,
                "offline_sales": 0,
                "previous_sales": sum_album_sales,
                "sum_sales_volume": sum_album_sales
            }
            console.log("--Set Default Album Sales Data");
            store.add(AlbumSalesData, function (err) {
                if (err) console.log(err); // err if the save failed
            });

        });

    }

}


function DoCheckMedia(username) {
    console.log(username);

    // req("https://www.instagram.com/333cyj333/", function (err, body) {
    //     var shareData = body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
    //     //console.log(shareData);
    //     var jsonData = JSON.parse(shareData)
    //     console.log(jsonData);
    //     console.log(jsonData.entry_data.ProfilePage["0"].graphql.user.edge_owner_to_timeline_media.count)
    // });

    request({
        url: `https://www.instagram.com/${username}`,//?__a=1
        // json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            //FUNCTION CHECK DELETED
            var currenttime = moment().format('YYYY-MM-DD HH:mm:00');
            var unixCurrenttime = moment(currenttime).unix();
            var chklastMin = moment().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:00');
            var unixLastMin = moment(chklastMin).unix();

            //NEW SCARP
            var shareData = body.substring(body.lastIndexOf("window._sharedData = ") + 21, body.lastIndexOf('show_app_install') + 23);
            var jsonData = JSON.parse(shareData)
            var body = jsonData.entry_data.ProfilePage["0"];


            var count = body.graphql.user.edge_owner_to_timeline_media.count;//body.user.media.count;
            var follower = body.graphql.user.edge_followed_by.count;

            var backUpData = {
                id: username + '-' + unixCurrenttime, //also filename
                "name": "item",
                "itemLen": count
            };

            store.add(backUpData, function (err) {
                // called when the file has been written
                // to the /path/to/storage/location/12345.json
                if (err) console.log(err); // err if the save failed
            });

            store.load(username + '-' + unixLastMin, function (err, object) {
                if (err) console.log(err);

                //console.log("loadded : " + unixLastMin);
                var getItemLen = object.itemLen;
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
                //finish check
                store.remove(username + '-' + unixLastMin, function (err) {
                    //console.log("remove : " + chklastMin);
                    if (err) console.log(err); // err if the file removal failed
                });
            });


            //SESSION ID
            var session_id = config.session_id;
            //expired : 2018-07-22T02:57:03.619Z
            //var cyjid = config.cyjid;
            var owner_id = config[`${username}`][0].id;
            var somzid = config.somzid;

            //IG STORY CHECK 
            console.log("---------STOP IG STORY CHECK------------");
            getStories({
                id: owner_id,
                userid: somzid,
                sessionid: session_id
            }).then(stories => {
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
                        //var code = item.code;
                        //DateTime Taken
                        var taken_at = item.taken_at;
                        var taken_at_mm = moment.unix(taken_at);
                        var time_taken = momentTz.tz(taken_at_mm, "Asia/Seoul").format('MMM DD YYYY, HH:mm');
                        console.log("Taken At : " + time_taken);
                        var time_taken_forchk = moment(taken_at_mm).format('YYYY-MM-DD HH:mm:00');


                        if (time_taken_forchk == chklastMin) {

                            //CAPTION
                            var chkcaption = item.caption;
                            var textcaption = "";
                            if (chkcaption != null) {
                                textcaption = item.caption.text;
                            }

                            //var getconfig = require('./config/default');
                            var caption_story = config[`${username}`][0].title_story;
                            var caption_hashtag = config[`${username}`][0].hashtag;

                            var caption0 = caption_story + textcaption;
                            var caption1 = caption_hashtag;
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
                                            TweetImage(storyid, caption, username);
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
                                        tweet_text: caption,
                                        username, username
                                    });
                                });


                            }

                        }
                    }

                }
            })

        }
    });
}

//FUNCTION GET MEDIA DATA TYPE
function CheckMediaDataType(code, username) {
    request({
        url: `https://www.instagram.com/p/${code}/?__a=1`,
        json: true
    }, function (error, response, body) {
        var nodes = body.graphql.shortcode_media;
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
        // console.log("total_msg_tweet :\n" + total_msg_tweet)


        //TYPE IMAGE
        if (__typename == "GraphImage") {
            var url = nodes.display_url;
            console.log(url);
            //EDIT URL
            //DON'T SPLIT ANYMORE
            // var splitUrl = url.split("/");
            // var newUrl = url.replace(splitUrl[7] + "/", "").replace(splitUrl[4] + "/", "");
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

                var videoTweet = new VideoTweet({
                    file_path: `./public/media/${code}.mp4`,
                    tweet_text: total_msg_tweet,
                    username: username
                });
            });
        }


        //TYPE CAROUSEL
        if (__typename == "GraphSidecar") {
            var txtLeft = 280 - fistfixedTxt.length - hashtagLink.length - timestmp.length - 3 - 5;
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
                                tweet_text: total_msg_tweet
                            });
                        }
                        if (carouselURL_image.length >= 5 && carouselURL_image.length < 9) {
                            //tweet of video has 2
                            var itemLen = carouselURL_video.length + 2;
                            var total_msg_tweet = fistfixedTxt + igcaption + `(${idvid}/${itemLen})` + hashtagLink + timestmp;
                            var videoTweet = new VideoTweet({
                                file_path: `./public/media/${code}_${numVid}.mp4`,
                                tweet_text: total_msg_tweet,
                                username: username
                            });
                        }
                        if (carouselURL_image.length >= 9) {
                            //tweet of video has 3
                            var itemLen = carouselURL_video.length + 3;
                            var total_msg_tweet = fistfixedTxt + igcaption + `(${idvid}/${itemLen})` + hashtagLink + timestmp;
                            var videoTweet = new VideoTweet({
                                file_path: `./public/media/${code}_${numVid}.mp4`,
                                tweet_text: total_msg_tweet,
                                username: username
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
    });
}

//FUNCTION TWEET IMAGE
function TweetImage(code, total_msg_tweet, username) {
    console.log(code, total_msg_tweet);
    //LENAYK
    var secret = config[`${username}`][0].auth;//require("./auth"); //save before launch (auth)
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








//FUNCTION CAROUSEL TWEET
function CarouselImageTweet(allData, allDataLength, code, total_msg_tweet, username, callback) {
    var secret = config[`${username}`][0].auth;
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


//FUNCTION TWEETDEL
function TweetDel(status) {
    //Screenshot
    const stream = screenshot('https://www.instagram.com/333cyj333/', '1080x720', { delay: 7 });
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


// var secret = config[`${username}`][0].auth;

// var OAUTH = secret;

var MEDIA_ENDPOINT_URL = config.VIDEO.endpoint;
var POST_TWEET_URL = config.VIDEO.post_tweet_url;

/**
 * Video Tweet constructor
 **/
var VideoTweet = function (data) {

    var self = this;
    self.file_path = data.file_path;
    self.tweet_text = data.tweet_text;
    self.username = data.username;
    self.total_bytes = undefined;
    self.media_id = undefined;
    self.processing_info = undefined;

    var OAUTH = {
        "consumer_key": config[`${self.username}`][0].auth.consumer_key,
        "consumer_secret": config[`${self.username}`][0].auth.consumer_secret,
        "token": config[`${self.username}`][0].auth.access_token_key,
        "token_secret" : config[`${self.username}`][0].auth.access_token_secret
    };
console.log(OAUTH);
    // retreives file info and inits upload on complete
    fs.stat(self.file_path, function (error, stats) {


        self.total_bytes = stats.size
        self.upload_init(OAUTH);
    });
};


/**
 * Inits media upload
 */
VideoTweet.prototype.upload_init = function (OAUTH) {
    console.log(OAUTH);
    console.log('INIT');

    var self = this;
    console.log("-----------------------TOTAL BYTE : " + self.total_bytes);
    var form_data = {
        'command': 'INIT',
        'media_type': 'video/mp4',
        'total_bytes': self.total_bytes,
        'media_category': 'tweetvideo'
    }


    // inits media upload
    request.post({ url: MEDIA_ENDPOINT_URL, oauth: OAUTH, formData: form_data }, function (error, response, body) {

        data = JSON.parse(body)
        console.log(data);
        // store media ID for later reference
        self.media_id = data.media_id_string;
        console.log(self.media_id)
        // start appening media segments
        self.upload_append(OAUTH);
    });
}


/**
 * Uploads/appends video file segments
 */
VideoTweet.prototype.upload_append = function (OAUTH) {

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

            console.log(self.media_id);


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
VideoTweet.prototype.upload_finalize = function (OAUTH) {

    console.log('FINALIZE');

    var self = this;

    form_data = {
        'command': 'FINALIZE',
        'media_id': self.media_id
    }

    // finalize uploaded chunck and check processing status on compelete
    request.post({ url: MEDIA_ENDPOINT_URL, oauth: OAUTH, formData: form_data }, function (error, response, body) {

        data = JSON.parse(body)
        self.check_status(data.processing_info, OAUTH);
    });
}


/**
 * Checks status of uploaded media
 */
VideoTweet.prototype.check_status = function (processing_info, OAUTH) {

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
            self.check_status(data.processing_info, OAUTH)
        }, timeout_length);
    });
}


/**
 * Tweets text with attached media
 */
VideoTweet.prototype.tweet = function (OAUTH) {

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
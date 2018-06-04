var fs = require('fs');
const config = require('./config/default');
 var ds = {file_path : "filepath",username:"some"};
 videotweet(ds);
 
 function videotweet(data) {

    var self = this;
    self.file_path = data.file_path;
    self.username = data.username;
    // retreives file info and inits upload on complete
    fs.stat(self.file_path, function (error, stats) {
        var secret = config[`333cyj333`][0].auth;
        var OAUTH = self.username;
        console.log(secret);
        console.log(OAUTH);
        
        // self.total_bytes = stats.size
        // self.upload_init(username);
    });
};
var express = require('express');
var http = require('http');
var app = express();
var api = require('instagram-node').instagram();


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});


// app.configure(function() {
//   // The usual... 
// });


api.use({
  client_id: '179b7e3894764c9dad6bdce62d422949',
  client_secret: 'ba85a46e88db41919aa22fcc175324a8'
});
var redirect_uri = 'https://afternoon-coast-78677.herokuapp.com/handleauth';


exports.authorize_user = function(req, res) {
 res.redirect(api.get_authorization_url(redirect_uri, { scope: ['public_content'], state: 'a state' }));
};
 
exports.handleauth = function(req, res) {
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log(err.body);
      res.send("denied");
    } else {
      console.log('Yay! Access token is ' + result.access_token);
    
      api.use({ access_token: result.access_token });
    //  api.user('333cyj333', function(err, result, remaining, limit) {
    //     res.send(limit);
    //   });
      var options = { count : 3 };
      api.user_media_recent('333cyj333' ,function(err, medias, pagination, remaining, limit) {
        res.send(medias[0].id);
      });
 
      // res.send('You made it!! access_token is ' + result.access_token );
      }
  });
};
 
// This is where you would initially send users to authorize 
app.get('/authorize_user', exports.authorize_user);
// This is your redirect URI 
app.get('/handleauth', exports.handleauth);
 
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


// app.listen(app.get('port'), function() {
//   console.log('Node app is running on port', app.get('port'));
// });



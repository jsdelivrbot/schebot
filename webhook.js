var request = require('request')
var nconf = require('nconf')
// load config
nconf.file({ file: 'auth.json' }).env()

// twitter authentication
var twitter_oauth =  {
  consumer_key: 'vJ27ZMSVsI2mTAysw4B0pOt78',
  consumer_secret: 'K4H06u5SmhUD5aijqlTvTpZaNYLOYkiS1yrODGOwFREiS9qEiD',
  token: '703675814127149057-kOwkJZv2I13y8XMOAK25PsveujO0nVk',
  token_secret: '1qCnQTtfuXEq9q3SVzqbYGgxmbvykytY98MQBeiE5w81M'
}

var WEBHOOK_URL = 'https://gotyjstagram.herokuapp.com/'


// request options
var request_options = {
  url: 'https://api.twitter.com/1.1/account_activity/webhooks.json',
  oauth: twitter_oauth,
  headers: {
    'Content-type': 'application/x-www-form-urlencoded'
  },
  form: {
    url: WEBHOOK_URL
  }
}

// POST request to create webhook config
request.post(request_options, function (error, response, body) {
  console.log(body)
})
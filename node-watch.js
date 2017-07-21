var watch = require('node-watch');
 
var dir = "./public/media/cachefile.json";
watch(dir, { recursive: true }, function(evt, name) {
  console.log('%s changed.', name);
});
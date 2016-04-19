var restify = require('restify');
var mongojs = require('mongojs');
var socketio = require('socket.io');

port = 8080;

var server = restify.createServer();
var io = socketio.listen(server.server);

var db = mongojs('intelligentProductSuggestions');
var products = db.collection("products");


server.get('/products/', function (req , res, next){
  products.find({}, function(err, doc) {
    console.log(doc);
    res.send(200, doc);
    res.end();
  });
});

server.get('/products/:id', function (req , res, next){
  products.findOne({
      _id: mongojs.ObjectId(req.params.id)
    }, function(err, doc) {
        if(doc){
          console.log(doc);
          res.send(200, doc);
          res.end();
          }
        });
});

server.get('/.*/', restify.serveStatic({
  directory: __dirname,
  default: 'index.html'
}));

server.listen(port, function (){
  console.log('%s listening at %s', server.name, port)
});

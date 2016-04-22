var restify = require('restify');
var mongojs = require('mongojs');
var socketio = require('socket.io');

port = 8080;

var server = restify.createServer();
var io = socketio.listen(server.server);


var db = mongojs('intelligentProductSuggestions');
var products = db.collection("products");

server.use(restify.bodyParser());

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

server.post('/suggenstions/:id/:productType', function (req , res, next){
  values = req.params.values;
  id = req.params.id;
  productType = req.params.productType;

  //Fix input array
  for (var i = 0; i < values.length; i++) {
    if(values[i].name == 'data.oko' || values[i].name == 'data.price'){
      values[i] = values[i].name.substring(5,values[i].length);
    }
    values[i].sort = parseInt(values[i].sort);
  }

  //values = []

  //values.push("oko");
  //values.push("price");
  //values.push({"name" : "data.kostfibre" , "sort" : -1});
  //values.push({"name" : "data.sukker" , "sort" : 1});


/////////////////////////////////////////////////
//  Check if oko
/////////////////////////////////////////////////
  if(values.indexOf("oko") != -1){
    values.splice(values.indexOf("oko"),1);

    /////////////////////////////////////////////////
    //  Check if oko + price
    /////////////////////////////////////////////////
    if(values.indexOf("price") != -1){
      console.log("oko + pris");
      sortobj = {};
      if(values.indexOf("price")){
        sortobj[values[0].name] = values[0].sort;
        sortobj["pricekg"] = 1;
      } else{
        sortobj["pricekg"] = 1;
        sortobj[values[1].name] = values[1].sort;
      }

      console.log(JSON.stringify(sortobj));
      /////////////////////////////////////////////////
      //  oko + price
      /////////////////////////////////////////////////
      products.aggregate([
    { "$match" : {"values" : "oko", "type" : productType} },
    { "$project" : { "volume" : "$volume","price" : "$price", "ean" : "$ean", "name" : "$name", "values" : "$values", "type" : "$type", "data" : "$data", "pricekg" : { "$multiply" : [1000, { "$divide" : ["$price", "$volume"] } ] } } },
    { "$sort" : sortobj},
    { "$limit" : 1}
    ], function(err, doc){
      if(doc.length > 0){
        console.log(doc);
        screenSend(id, doc[0], 'oko+price');
        res.send(200, doc);
        res.end();
      }else{
        /////////////////////////////////////////////////
        //  oko + price - NO oko i database
        /////////////////////////////////////////////////
        products.aggregate([
      { "$match" : {"type" : productType} },
      { "$project" : { "volume" : "$volume","price" : "$price", "ean" : "$ean", "name" : "$name", "values" : "$values", "type" : "$type", "data" : "$data", "pricekg" : { "$multiply" : [1000, { "$divide" : ["$price", "$volume"] } ] } } },
      { "$sort" :  sortobj },
      { "$limit" : 1}
      ], function(err, doc){
          console.log(doc);
          screenSend(id, doc[0], 'nooko+price');
          res.send(200, doc);
          res.end();
        });
      }

    });

    }else{
      /////////////////////////////////////////////////
      //  oko
      /////////////////////////////////////////////////
      console.log("oko");
      sort0name = values[0].name;
      sort0sort = values[0].sort;
      sort1name = values[1].name;
      sort1sort = values[1].sort;

      sortobj = {};
      sortobj[sort0name] = sort0sort;
      sortobj[sort1name] = sort1sort;

      console.log(JSON.stringify(sortobj));

      products.find({"values" : "oko", "type" : productType}).sort(sortobj).limit(1, function(err, doc) {
        if(doc.length > 0){
          console.log(doc);
          screenSend(id, doc[0], 'oko');
          res.send(200, doc);
          res.end();
        }else{
          /////////////////////////////////////////////////
          //  oko - NO oko in databse
          /////////////////////////////////////////////////
          products.find({"type" : productType}).sort(sortobj).limit(1, function(err, doc) {
            console.log(doc);
            screenSend(id, doc[0], 'nooko');
            res.send(200, doc);
            res.end();
          });
        }
      });
    }
  }else{
    /////////////////////////////////////////////////
    //  Check if price
    /////////////////////////////////////////////////
    if(values.indexOf("price") != -1){
      console.log("pris");

      sortobj = {};
      if(values.indexOf("price") == 0){
        sortobj["pricekg"] = 1;
        sortobj[values[1].name] = values[1].sort;
        sortobj[values[2].name] = values[2].sort;
      } else if (values.indexOf("price") == 1) {
        sortobj[values[0].name] = values[0].sort;
        sortobj["pricekg"] = 1;
        sortobj[values[2].name] = values[2].sort;
      } else{
        sortobj[values[0].name] = values[0].sort;
        sortobj[values[1].name] = values[1].sort;
        sortobj["pricekg"] = 1;
      }


      console.log(JSON.stringify(sortobj));
      /////////////////////////////////////////////////
      //  price
      /////////////////////////////////////////////////
      products.aggregate([
    { "$match" : {"type" : productType} },
    { "$project" : { "volume" : "$volume","price" : "$price", "ean" : "$ean", "name" : "$name", "values" : "$values", "type" : "$type", "data" : "$data", "pricekg" : { "$multiply" : [1000, { "$divide" : ["$price", "$volume"] } ] } } },
    { "$sort" :  sortobj },
    { "$limit" : 1}
    ], function(err, doc){
      screenSend(id, doc[0], 'price');
      console.log(doc);
      res.send(200, doc);
      res.end();
    });

    }else{
      /////////////////////////////////////////////////
      //  Every thing else! NO oko + NO price
      /////////////////////////////////////////////////
      console.log("almindelig");
      sort0name = values[0].name;
      sort0sort = values[0].sort;
      sort1name = values[1].name;
      sort1sort = values[1].sort;
      sort2name = values[2].name;
      sort2sort = values[2].sort;

      sortobj = {};
      sortobj[sort0name] = sort0sort;
      sortobj[sort1name] = sort1sort;
      sortobj[sort2name] = sort2sort;

      console.log(JSON.stringify(sortobj));

      products.find({"type" : productType}).sort(sortobj).limit(1, function(err, doc) {
        console.log(doc);
        screenSend(id, doc[0], 'regular');
        res.send(200, doc);
        res.end();
      });
    }

  }

});

server.get('/.*/', restify.serveStatic({
  directory: __dirname,
  default: 'index.html'
}));

server.listen(port, function (){
  console.log('%s listening at %s', server.name, port)
});


function screenSend(id, alternativProduct, why){
  console.log(why);
    io.emit(alternativProduct._id, why);
}

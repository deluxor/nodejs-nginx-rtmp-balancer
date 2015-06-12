var express = require('express');
var router = express.Router();
var fs = require("fs");
var configuration = JSON.parse(
  fs.readFileSync("config.json")
);
var server = [];

Array.prototype.inArray = function(comparer, element) {
  for (var i = 0; i < this.length; i++) {
    if (comparer(this[i])) {
      this.splice(i, 1, element);
      return true;
    }
  }
  return false;
};

Array.prototype.pushIfNotExist = function(element, comparer) {
  if (!this.inArray(comparer, element)) {
    this.unshift(element);
  }
};

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

router.post('/caller/:key', function(req, res, next) {

  var key = req.params.key;
  var params = req.body;

  if (key != configuration.key) {
    res.status(400).json({
      error: "The auth key is not correct"
    });
  } else {

    params.timestamp = Date.now();

    server.pushIfNotExist(params, function(e) {
      return e.ip === params.ip; //check if the server already exists in the array!
    });

    res.status(200).json({
      status: "OK"
    });
  }
});

router.get('/caller/freeserver', function(req, res, next) {

  var freeServer;
  var minimum = 0;

  minimum = parseInt(server[0].clients, 10);

  for (var i = 0; i < server.length; i++) {
    var clients = parseInt(server[i].clients, 10);

    if (clients <= minimum) {
      minimum = clients;
      freeServer = server[i];
    }
  }

  res.status(200).json({
    ip: freeServer.ip
  });
});

router.get('/caller/servers', function(req, res, next) {

  var obj = server;

  for (var i = 0; i < obj.length; i++) {
    if ((Date.now() - obj[i].timestamp) <= configuration.timeout) { //if a server is more than 5 seconds without updating gets flagged as OFFLINE!
      obj[i].status = 'ONLINE';
    } else {
      obj[i].status = 'OFFLINE';
    }

    obj[i].last_update = new Date(obj[i].timestamp);
  }

  res.status(200).json(obj);
});

module.exports = router;

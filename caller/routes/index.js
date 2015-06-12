var express = require('express');
var router = express.Router();
var xml2js = require('xml2js');
var http = require('http');
var net = require('net');

/*
var options = {
  host: '127.0.0.1', //host
  port: 8080, //port
  path: '/stat' //url
    //auth: 'username:password'
};

var timer = 500;

router.get('/', function(req, res, next) {

  callback = function(response) {
    var str = '';
    response.on('data', function(chunk) {
      str += chunk;
    });

    response.on('end', function() {
      var parser = new xml2js.Parser();
      parser.parseString(str, function(err, result) {
        var nClients = {
          clients: result.rtmp.server[0].application[0].live[0].nclients[0]
        };
        console.log(nClients);
      });
    });
  };


  setInterval(function() {
    var requ = http.request(options, callback);
    requ.end();
    requ.removeListener('data', callback);
    requ.removeListener('end', callback);
  }, timer);
});*/



module.exports = router;

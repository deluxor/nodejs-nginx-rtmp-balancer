/* Copyrights Deluxor 2015  */
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var appRoot = require('app-root-path');
//Costume modules
var xml2js = require('xml2js');
var http = require('http');
var net = require('net');
var fs = require("fs");
var requestify = require('requestify');

var configuration = JSON.parse(
  fs.readFileSync("target.json")
);
var options = {
  host: configuration.edge_stats_address, //host
  port: configuration.edge_stats_port, //port
  path: configuration.path, //url
  //auth: 'username:password'
};
var timer = 0;
if (configuration.timer < 500) {
  timer = 500;
} else {
  timer = configuration.timer;
}
var balancer = configuration.load_balancer_address;
var balancerPort = configuration.load_balancer_port;
var app = express();

callback = function(response) {
  var str = '';
  response.on('data', function(chunk) {
    str += chunk;
  });

  response.on('end', function() {
    var parser = new xml2js.Parser();
    parser.parseString(str, function(err, result) {
      var edge = {
        ip: configuration.edge_address,
        uptime: result.rtmp.uptime[0],
        accepted: result.rtmp.naccepted[0],
        bandwidth_in: result.rtmp.bw_in[0],
        total_traffic_in: result.rtmp.bytes_in[0],
        bandwidth_out: result.rtmp.bw_out[0],
        total_traffic_out: result.rtmp.bytes_out[0],
        clients: result.rtmp.server[0].application[0].live[0].nclients[0]
      };
      requestify.post('http://'+balancer+':'+balancerPort+'/caller/'+configuration.load_balancer_key, edge)
        .then(function(response) {
          if (response) {
            console.log(Date() + " UPDATE REQUEST SENT TO LOADBALANCER SERVER");
          } else {
            console.log(Date() + "CANNOT SEND REQUEST TO LOADBALANCER SERVER");
          }
          response.getBody();
        });
    });
  });
};

//Pulls each timer the stats content
setInterval(function() {
  var requ = http.request(options, callback);
  requ.end();
  //Remove listeners to avoid memory leaks
  requ.removeListener('data', callback);
  requ.removeListener('end', callback);
}, timer);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

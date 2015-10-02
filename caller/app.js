/* Copyrights Deluxor 2015  */
var nconf = require('nconf');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var xml2js = require('xml2js');
var http = require('http');
var net = require('net');
var fs = require("fs");

var router = express.Router();

if (process.argv.length == 3) {
    nconf.argv().env().file(process.argv[2]);
    configuration = nconf;
}
else {
    nconf.defaults({
        "_comment": "Please update the parameters below with your own ones",
        "edge_address": "0.0.0.0",
        "edge_address_rtmp_port": 1938,
        "edge_stats_address": "127.0.0.1",
        "edge_stats_port": 8083,
        "path": "/stat",
        "timer": 1000,
        "load_balancer_address": "127.0.0.1",
        "load_balancer_port": 3131,
        "load_balancer_key": "1e06725f825882d0636caa877c1bcf368c8fabad"
    });
}

var options = {
    host: nconf.get('edge_stats_address'), //host
    port: nconf.get('edge_stats_port'), //port
    path: nconf.get('path') //url
    //auth: 'username:password'
};
var timer = 0;
if (nconf.get('timer') < 500) {
    timer = 500;
} else {
    timer = nconf.get('timer');
}
var app = express();

var ioClient = require("socket.io-client")('http://' + nconf.get('load_balancer_address') + ':' + nconf.get('load_balancer_port'));

var packet;

var Clock = {
    totalSeconds: 0,

    start: function () {
        var self = this;

        this.interval = setInterval(function () {
            self.totalSeconds += 1;

            var requ = http.request(options, callback);
            requ.end();
            //Remove listeners to avoid memory leaks
            requ.removeListener('data', callback);
            requ.removeListener('end', callback);

        }, timer);
    },

    pause: function () {
        clearInterval(this.interval);
        delete this.interval;
    },

    resume: function () {
        if (!this.interval) this.start();
    }
};

Clock.start();

//Callback of the stat request and packet sending!

callback = function (response) {
    var str = '';
    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
            var parser = new xml2js.Parser();
            parser.parseString(str, function (err, result) {
                packet = {
                    edge: {
                        ip: nconf.get('edge_address') + ':' + nconf.get('edge_address_rtmp_port'),
                        uptime: result.rtmp.uptime[0],
                        accepted: result.rtmp.naccepted[0],
                        bandwidth_in: result.rtmp.bw_in[0],
                        total_traffic_in: result.rtmp.bytes_in[0],
                        bandwidth_out: result.rtmp.bw_out[0],
                        total_traffic_out: result.rtmp.bytes_out[0],
                        clients: result.rtmp.server[0].application[0].live[0].nclients[0]
                    },
                    security: {
                        key: nconf.get('load_balancer_key')
                    }
                };

                //send update packet containing the edge object
                ioClient.emit('sendserver', packet);
            });


        }
    )
    ;
}
;

//Inform client that the update was successful

ioClient.on('serverUpdated', function (data) {
    data.timestamp = Date.now();
    console.log(data);
});

//Inform client that has been disconnected
ioClient.on('disconnect', function () {
    console.log("DISCONNECTED FROM LOADBALANCER SERVER");
    Clock.pause();
});

//Inform client that has been connected
ioClient.on('connect', function () {
    console.log('CONNECTED TO LOADBALANCER SERVER!');
    Clock.resume();
});


module.exports = app;

var _ = require('lodash');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require("fs");
var configuration = JSON.parse(
    fs.readFileSync("config.json")
);

var publishers = require('./collections/publishers.js');
var broadcasters = require('./collections/broadcasters.js');
var helpers = require('./utils/helpers.js');

var http = require('http');
var app = express();

var router = express.Router();

//Some logic made by me to handle the arrays

Array.prototype.inArray = function (comparer, element) {
    for (var i = 0; i < this.length; i++) {
        if (comparer(this[i])) {
            this.splice(i, 1, element);
            return true;
        }
    }
    return false;
};

Array.prototype.pushIfNotExist = function (element, comparer) {
    if (!this.inArray(comparer, element)) {
        this.unshift(element);
    }
};

Array.prototype.max = function () {
    return Math.max.apply(null, this);
};

Array.prototype.min = function () {
    return Math.min.apply(null, this);
};

//App sets

var port = normalizePort(process.env.PORT || configuration.port);
app.set('port', port);
//app.engine('html', require('ejs').renderFile);
//app.set('view engine', 'html');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());

//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
};
app.use(allowCrossDomain);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', router);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

//Socket initialization / Network

var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(port);

io.on('connection', function (socket) {
    socket.on('sendserver', function (packet) {
        if (packet.security.key === configuration.key) {
            packet.edge.timestamp = Date.now();

            if (packet.edge.type === 'publisher') {
                if (!(packet.edge.ip in publishers))
                    publishers[packet.edge.ip] = packet.edge;
            }
            else if (!(packet.edge.ip in broadcasters)) {
                broadcasters[packet.edge.ip] = packet.edge;
            }

            socket.emit('serverUpdated', {updated: 'OK'});
        } else {
            socket.emit('serverUpdated', {updated: 'FAIL -> Security Key Invalid'});
        }
    });
});

//Define routes here
//router.get('/servers', function (req, res, next) {
//    var type = req.query.type;
//
//    if (type === 'publishers')
//        var obj = publisher;
//    else if (type === 'broadcasters')
//        var obj = broadcaster;
//    else
//        var obj = publisher.concat(broadcaster);
//
//    for (var i = 0; i < obj.length; i++) {
//        if ((Date.now() - obj[i].timestamp) <= configuration.timeout) { //if a server is more than 5 seconds without updating gets flagged as OFFLINE!
//            obj[i].status = 'ONLINE';
//        } else {
//            obj[i].status = 'OFFLINE';
//        }
//
//        obj[i].last_update = new Date(obj[i].timestamp);
//    }
//
//    res.status(200).json(obj);
//});

function get_freeserver_ip(type) {

    var freeServers = type === 'publisher' ? publishers : broadcasters,
        freeServer,
        minimum;

    for (var ip in freeServers) {
        if (typeof minimum === 'undefined') {
            minimum = parseInt(freeServers[ip].clients, 10);
        }

        var clients = parseInt(freeServers[ip].clients, 10);

        if (clients <= minimum) {
            minimum = clients;
            freeServer = freeServers[ip];
        }
    }

    return freeServer.ip;
}

router.get('/freepublisher', function (req, res, next) {

    res.status(200).json({
        ip: get_freeserver_ip('publisher')
    });
});

router.get('/freebroadcaster', function (req, res, next) {

    res.status(200).json({
        ip: get_freeserver_ip('broadcaster')
    });
});

router.post('/remote_redirect', function (req, res, next) {
    // get publisher who publish this stream
    //get publisher with room req.body['name']
    var ip = helpers.getPublisherFromStream(req.body['name']);

    if (typeof ip !== 'undefined') {
        res.redirect(302, 'rtmp://' + ip + '/publish/' + req.body['name']);
    }
    else {
        res.status(404).json({
            message: 'No publisher found for this stream.'
        });
    }

});

router.post('/on_publish', function (req, res, next) {

    var room = req.body['name'],
        publisher_ip = req.body['tcurl'].match(/rtmp:\/\/([^\/]*)/)[1];

    // add room to publisher if not present in it
    helpers.addStream(room, publisher_ip);

    // get publisher who publish this stream
    res.status(200).json({
        message: 'on_publish',
        ip: publisher_ip
    });

});

router.post('/on_publish_done', function (req, res, next) {
    // get publisher who publish this stream
    var room = req.body['name'],
        publisher_ip = req.body['tcurl'].match(/rtmp:\/\/([^\/]*)/)[1];

    // remove room from publisher_ip
    helpers.removeStream(room, publisher_ip);


    res.status(200).json({
        message: 'on_publish_done',
        ip: publisher_ip
    });

});

module.exports = app;

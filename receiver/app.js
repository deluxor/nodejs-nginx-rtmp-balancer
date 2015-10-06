var _ = require('lodash');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var edge = require('./edge.js');
var fs = require("fs");
var configuration = JSON.parse(
    fs.readFileSync("config.json")
);

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
            //console.log(packet.edge);
            edge.pushIfNotExist(packet.edge, function (e) {
                return e.ip === packet.edge.ip; //check if the server already exists in the array!
            });
            socket.emit('serverUpdated', {updated: 'OK'});
        } else {
            socket.emit('serverUpdated', {updated: 'FAIL -> Security Key Invalid'});
        }
    });
});

//Define routes here

router.get('/servers', function (req, res, next) {

    var obj = edge;

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


function get_freeserver(type) {
    var freeServer,
        freeServers = _.filter(edge, {type: type}),
        minimum = parseInt(freeServers[0].clients, 10);

    for (var i = 0, l = freeServers.length; i < l; i++) {
        var clients = parseInt(freeServers[i].clients, 10);

        if (clients <= minimum) {
            minimum = clients;
            freeServer = freeServers[i];
        }
    }

    return freeServer;
}

router.get('/freepublisher', function (req, res, next) {

    var room = req.query.room,
        freeServer = get_freeserver('publisher');

    var index = _.findIndex(edge, {ip: freeServer.ip});
    edge[index].rooms = edge[index].rooms || [];
    edge[index].rooms.pushIfNotExist(room, function (e) {
        return e === room; //check if the room already exists in the array!
    });

    res.status(200).json({
        ip: freeServer.ip
    });
});

router.get('/freebroadcaster', function (req, res, next) {

    res.status(200).json({
        ip: get_freeserver('broadcaster').ip
    });
});

router.post('/remote_redirect', function (req, res, next) {
    // get publisher who publish this stream
    var publisher = _.findWhere(edge, function (e) { return e.type === 'publisher' && _.findWhere(e.rooms, req.body['name'])});

    if (typeof publisher !== 'undefined') {
        res.redirect(302, 'rtmp://' + publisher.ip + '/publish/' + req.body['name']);
    }
    else {
        res.status(404).json({
            message: 'No publisher for this stream.'
        });
    }

});


module.exports = app;

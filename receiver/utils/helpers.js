var _ = require('lodash');
var publishers = require('../collections/publishers.js');


module.exports = {
    addStream: function(stream, ip) {
        if (ip in publishers) {
            publishers[ip].streams = publishers[ip].streams || [];

            var s = _.findWhere(publishers[ip].streams, stream);

            if (typeof s === 'undefined') {
                publishers[ip].streams.push(stream);
            }
        }
        else {
            // ask redis for over node js node
        }
    },
    removeStream: function(stream, ip) {
        if (ip in publishers) {
            publishers[ip].streams = publishers[ip].streams || [];

            var i = publishers[ip].streams.indexOf(stream);

            if (!!~i) {
                publishers[ip].streams.splice(i, 1);
            }
        }
        else {
            // ask redis for over node js node
        }
    },
    getPublisherFromStream: function(stream) {
        for (var ip in publishers) {
            var s = _.findWhere(publishers[ip].streams, stream);

            if (typeof s !== 'undefined') {
                return ip;
            }
        }

        // send redis get publisher from stream
    }
};

//this.multi = client.multi();
//this.multi.pubsub('NUMSUB', channel, _.bind(function (err, reply) {
//    var num_subscribers = parseInt(reply[1]);
//
//    if (typeof user !== 'undefined' && user && num_subscribers <= user.sockets.length) { // friend sockets are connected on same server
//        user.emit(event, data);
//    }
//    else if (num_subscribers) {  // friend has sockets on other servers
//        client.publish(channel, JSON.stringify({  // publish to channel friend if exist for warning him
//            'type': event,
//            'data': data
//        }));
//    }
//    else {
//        // not reachable
//    }
//
//    if (_.isFunction(callback)) { // execute callback if exist
//        callback(num_subscribers);
//    }
//
//}, this));
//this.multi.exec();

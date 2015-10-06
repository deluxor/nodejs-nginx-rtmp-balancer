var redis = require('redis');

//redis.debug_mode = true;

module.exports = redis.createClient();

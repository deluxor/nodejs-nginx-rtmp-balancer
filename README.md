# nodejs-nginx-rtmp-balancer
A NodeJS loadbalancing system for Nginx-rtmp

Release Notes 1.1:
- Better Performance
- Now using websockets to comunicate
- Better overall stability and realibility

Youtube video: http://youtu.be/cGJlcR3Qf9A

Install:

- Clone the repo to your machine;
- Open the module folder you want, caller or receiver and do ``` npm install ```
- Then just do ``` node app.js ```

Note: If you want to run it in background use screen, ``` screen -dmS node node app.js ```, and then hit ``` ctrl+a+d ``` to get out of window.


Configuration:

- Now in both modules all the configurations are saved in a unique file called ``` config.json ``` 

TODO:
- Support PM2;

# nodejs-nginx-rtmp-balancer
A NodeJS loadbalancing system for Nginx-rtmp

Youtube video: http://youtu.be/cGJlcR3Qf9A

Install:

- Clone the repo to your machine;
- Open the module folder you want, caller or receiver and do ``` npm install ```
- Then just do ``` nodejs bin/www ```

Note: If you want to run it in background use screen, ``` screen -dmS node nodejs bin/www ```, and then hit ``` ctrl+a+d ``` to get out of window.


Configuration:

- In receiver module open the config.json to edit your settings;
- In caller module open target.json and change to your own settings;

TODO:
- Support PM2;
- Use websockets instead of traditional request;
- Better performance

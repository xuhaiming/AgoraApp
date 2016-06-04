//var fs = require('fs');
//var https = require('https');
var http = require('http');
var express = require('express');
var AgoraSignGenerator = require('./lib/AgoraSignGenerator');
var path = require('path');

var PORT = 8080;

// Fill the vendorkey and sign key given by Agora.io
var VENDOR_KEY = "a6c41165e3864e398294c1e306658589";
var SIGN_KEY = "7eb4ea0f17cb4bd887e209a6c7a3228b";

//var private_key = fs.readFileSync(__dirname + '/../../cert/xxx.com.key');
//var certificate = fs.readFileSync(__dirname + '/../../cert/xxx.com.crt');
//var credentials = {key: private_key, cert: certificate, passphrase: "password"};

var app = express();
app.disable('x-powered-by');
app.set('port', PORT);
app.use(express.favicon());
app.use(app.router);

app.use(express.static('client'));

var generateDynamicKey = function(req, resp){
    var channelName = req.query.channelName;
    if (!channelName){
        return resp.status(400).json({'error':'channel name is required'}).send();
    }

    var ts = Math.round(new Date().getTime() / 1000);
    var rnd =Math.round(Math.random()*100000000);
    var key = AgoraSignGenerator.generateDynamicKey(VENDOR_KEY, SIGN_KEY, channelName, ts, rnd);

    resp.header("Access-Control-Allow-Origin", "*");
    //resp.header("Access-Control-Allow-Origin", "http://ip:port")
    return resp.json({'key': key}).send();
};

app.get('/', function(req, res) {
    res.sendfile(path.join(__dirname+'/client/index.html'));
});

app.get('/dynamic_key', generateDynamicKey);


http.createServer(app).listen(app.get('port'), function() {
    console.log('AgoraSignServer starts at ' + app.get('port'));
});

//https.createServer(credentials, app).listen(app.get('port') + 1, function() {
//    console.log('AgoraSignServer starts at ' + (app.get('port') + 1));
//});


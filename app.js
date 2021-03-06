//var fs = require('fs');
//var https = require('https');
var http = require('http');
var express = require('express');
var AgoraSignGenerator = require('./lib/AgoraSignGenerator');
var path = require('path');
var https = require('https');
var fs = require('fs');
var privateKey = fs.readFileSync('./sslcert/privateKey.key', 'utf8');
var certificate = fs.readFileSync('./sslcert/certificate.crt', 'utf8');
var config = require('./config');

var PORT = 8080;

// Fill the vendorkey and sign key given by Agora.io
var VENDOR_KEY = config.VENDOR_KEY;
var SIGN_KEY = config.SIGN_KEY;

//var private_key = fs.readFileSync(__dirname + '/../../cert/xxx.com.key');
//var certificate = fs.readFileSync(__dirname + '/../../cert/xxx.com.crt');
//var credentials = {key: private_key, cert: certificate, passphrase: "password"};

var credentials = {key: privateKey, cert: certificate};

var app = express();
app.disable('x-powered-by');
app.set('port', PORT);
app.use(express.favicon());
app.use(app.router);

app.use(express.static('client'));

var generateDynamicKey = function(req, resp) {
  var channelName = req.query.channelName;
  if (!channelName) {
    return resp.status(400).json({'error': 'channel name is required'}).send();
  }

  var ts = Math.round(new Date().getTime() / 1000);
  var rnd = Math.round(Math.random() * 100000000);
  var key = AgoraSignGenerator.generateDynamicKey(VENDOR_KEY, SIGN_KEY, channelName, ts, rnd);

  resp.header("Access-Control-Allow-Origin", "*");
  //resp.header("Access-Control-Allow-Origin", "http://ip:port")
  return resp.json({'key': key}).send();
};

app.get('/', function(req, res) {
  res.sendfile(path.join(__dirname + '/client/index.html'));
});

app.get('/dynamic_key', generateDynamicKey);

http.createServer(app).listen(app.get('port'), function() {
  console.log('AgoraSignServer starts at ' + app.get('port'));
});

//https.createServer(credentials, app).listen(app.get('port') + 1, function() {
//    console.log('AgoraSignServer starts at ' + (app.get('port') + 1));
//});

var httpsServer = https.createServer(credentials, app);
var io = require('socket.io').listen(httpsServer);
var userList = [];

io.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('join', function(id, name) {
    userList.push({
      id: id,
      name: name,
      currentEmotion: -1
    });
    console.log('user join', userList);
  });

  socket.on('leave', function(id) {
    userList = userList.filter(function(user) {
      return user.id != id
    });
    console.log('user leave', id);
  });

  socket.on('sendMessage', function(user, msg) {
    io.emit('chat message', user, msg);
  });

  socket.on('sendEmotion', function(uid, emotionId) {
    var user = userList.find(function(user) {
      return user.id == uid;
    });
    var userName = user.name;

    var emotionMessage = "";

    switch(emotionId) {
      case 0:
        emotionMessage = "I AM SO ANGRY!!!";
        break;
      case 1:
        emotionMessage = "Oh, I feel so sad.";
        break;
      case 2:
        emotionMessage = "AMAZING!!!";
        break;
      case 3:
        emotionMessage = "Hahaha, so funny!";
        break;
    }

    if (user.currentEmotion != emotionId) {
      user.currentEmotion = emotionId;
      io.emit('chat message', userName, emotionMessage);
    }
  });
});

httpsServer.listen(8443);

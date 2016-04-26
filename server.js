var express = require('express');
var bodyParser=require('body-parser');
var morgan = require('morgan');
var config= require('./config');
var mongoose = require('mongoose');

var app = express();
var http = require('http').Server(app);
var io=require('socket.io')(http);

mongoose.connect(config.database,function(err){
  if(err){
    console.log(err);
  }else {
    console.log("Connected to the database");
  }
});

app.use(bodyParser.urlencoded({extended:true}));//pass any thing as route,videos,images,strings,//if false, will pass only strings
app.use(bodyParser.json());
app.use(morgan('dev'));// log all the request to the console

app.use(express.static(__dirname + '/public'));
//need to put before app.get('*',function(req,res) this route,
//any files in public folder will be render if you need any of the css/javascript files

//set prefix for the api
var api = require('./app/routes/api')(app,express,io);
app.use('/api',api);

//* means go to any route,example localhost:3000/contact will still go to Hellow world etc.
app.get('*',function(req,res){
  res.sendFile(__dirname +'/public/app/views/index.html');
});

http.listen(config.port,function(err){
  if(err){
    console.log(err);
  }else{
    console.log("Listening on port 3000");
  }
});

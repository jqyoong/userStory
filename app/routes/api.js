var User = require ('../models/user');
var Story = require('../models/story');
var config=require('../../config');
var jsonwebtoken = require('jsonwebtoken');
var secretKey = config.secretKey;

function createToken(user){//exclude outside the module expots
  var token = jsonwebtoken.sign({
    id: user._id,
    name: user.name,
    username: user.username
  },secretKey,{
    expirtesinMinute:1440
  });
  return token;
}

module.exports = function(app,express,io){

  var api = express.Router();

  api.get('/all_stories',function(req,res){
    Story.find({},function(err,stories){
      if(err){
        res.send(err);
        return;
      }
      res.json(stories);
    });
  });

  api.post('/signup',function(req,res){

    User.findOne({
      username:req.body.username
    },function(err,userExist){
      if(userExist){
        return res.status(409).send({
          message: 'Email is already taken'
        });
      }
      var user = new User({
        name: req.body.name,
        username: req.body.username,
        password: req.body.password
      });
      var token=createToken(user);
      user.save(function(err){
        if(err){
          res.send(err);
          return;
        }
        res.json({
          success:true,
          message:'User has been created!',
          token:token
        });
      });
    })
  });

  api.get('/users',function(req,res){
    //mongoose to find all the user database
    User.find({},function(err,users){
      if(err){
        res.send(err);
        return;
      }
      res.json(users);
    });
  });

  api.post('/login',function(req,res){
    //find specific user object
    User.findOne({
      username: req.body.username
    }).select('name username password').exec(function(err,user){

      if(err) throw err;
      if(!user){
        res.send({message:"User does not exist"});
      } else if(user){
        var validPassword = user.comparePassword(req.body.password);

        if(!validPassword){
          res.send({message:"Invalid Password!"});
        }else{
          //create a token if successfully login
          var token = createToken(user);

          res.json({
            success: true,
            message: "Successfully login!",
            token: token
          });
        }
      }
    });
  });

//middleware api
  api.use(function(req,res,next){

    console.log("A user logged in!");

    var token = req.body.token || req.param('token') || req.headers['x-access-token'];
    //check if token exist
    if(token){
      jsonwebtoken.verify(token,secretKey,function(err,decoded){

        if(err){
          res.status(403).send({
            success:false,
            message: "Failed to authenticate user"
          });
        }else {
          req.decoded = decoded;
          next();
        }

      });
    }else{
      res.status(403).send({
        success:false,
        message:"No Token Provided"
      });
    }

  });

  //Destination B // provide a legitimate token

  api.route('/') //never use semicolon on multiple changing method
    .post(function(req,res){

      var story = new Story({
        creator:req.decoded.id,
        content:req.body.content
      });
      story.save(function(err,newStory){
        if(err){
          res.send(err);
          return
        }
        io.emit('story',newStory);
        res.json({message:"New Story created!"});
      });
    })
    .get(function(req,res){
      Story.find({creator:req.decoded.id},function(err,stories){
        if(err){
          res.send(err);
          return
        }
        res.json(stories);
      });
    });
  api.get('/me',function(req,res){
    res.json(req.decoded);
  });

  return api
}

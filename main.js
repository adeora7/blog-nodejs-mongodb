var express = require('express');
var app = express();
var session = require('client-sessions');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/blog';


app.use(bodyParser());
app.use(express.static('noding'));
app.set('view engine', 'jade');
app.use(session({
	cookieName: 'session',
	secret: 'helloitsademoblog',
	duration: 30*60*1000 ,
	activeDuration: 5*60*1000
}));

app.get('/',function(req,res){
	if(req.session.user){
		res.redirect('/home');
	}
	else{
		res.render('index', { title: 'Blog-home', message: 'login here'});
	}
});

app.get('/index',function(req,res){
	if(req.session.user){
		res.redirect('/home');
	}
	else{
		res.render('index', { title: 'Blog-home', message: 'login here'});
	}
});

app.get('/logout',function(req,res){
	req.session.reset();
	res.redirect('/');
});

var findUsers = function(req, db, callback) {
   var cursor =db.collection('users').find({email:req.body.email, password:req.body.pass});
   callback(cursor);
}


app.post('/login', function(req,res){	
	MongoClient.connect(url, function(err, db) {
  		assert.equal(null, err);
  		findUsers(req, db, function(cursor) {
  			var check = 1;
      		cursor.each(function(err, doc){
      			assert.equal(err, null);
      			if(doc!=null){
      				if(req.body.email === doc.email && req.body.pass === doc.password)
      				{
      					req.session.user = doc;
      					check = 0;
      					res.redirect('/home');
      				}
      			}
      			else
      			{
      				if(check === 1){
      					console.log('invalid username password');
      					res.redirect('/home');
      				}
      			}
      		});
  		});
	});

});


var findPosts = function(db, callback){
	var cursor = db.collection('posts').find();
	callback(cursor);
} 

app.get('/home',function(req,res){
	if(req.session.user){
		MongoClient.connect(url, function(err, db) {
  			assert.equal(null, err);
  			findPosts(db, function(cursor) {
  				var posts = "[";
  				cursor.each(function(err, doc){
  					if(doc != null)
  					{	if(posts === "[")
  						posts += '{ "title": "' + doc.title +'", "description": "' + doc.description + '", "by": "'+ doc.by + '" }'  
  						else
  						posts += ', { "title": "' + doc.title +'", "description": "' + doc.description + '", "by": "'+ doc.by + '" }'  
  							
  					}
  					else{
  						posts += "]";
  						//console.log(posts);
  						//var result = [{ 'title': 'one', 'description': 'two', 'by': 'three'}, { 'title': 'one', 'description': 'two', 'by': 'three'}];
  						//console.log(JSON.stringify(result));
  						var result = JSON.parse(posts);
  						res.render('home', {title:'Blog-home', message:'Hi, '+req.session.user.email, data: result});
  					}
  				});
  			});
		});

		//display all the posts
		//res.render('home', {title:'Blog-home', message:'Hi, '+req.session.user.email});
	}
	else
	{
		res.redirect('/');
	}
});


app.get('/register',function(req,res){
  res.render('register',{title:'Blog-register', message:'Register here to get started with the blog'});
});

var addUser = function(req, db,callback){
  db.collection('users').insert({email: req.body.email, password: req.body.pass});
  callback();
}

app.post('/registeruser',function(req,res){
  if(req.session.user){
    res.redirect('/home');
  }
  else
  {
    MongoClient.connect(url, function(err, db){
      assert.equal(null, err);
      addUser(req, db, function(){
          console.log('user has been registered');
          res.redirect('/');
      });
    });
    
  }
});

app.get('/post', function(req, res){
  if(req.session.user)
  {
    res.render('post', {title: "Blog-post", message:'Add new post here'});
  }
  else
  {
    res.redirect('/');
  }
});

var addPost = function(req, db, callback){
  db.collection('posts').insert({title: req.body.title, description: req.body.description, by: req.session.user.email});
  callback();
}

app.post('/addpost', function(req, res){
  if(req.session.user){
    MongoClient.connect(url, function(err, db){
      assert.equal(null, err);
      addPost(req, db, function(){
        console.log('New post has been added');
        res.redirect('/home');
      })
    })
  }
  else
  {
    res.redirect('/');
  }
});

var server = app.listen(8081, function(){
	var host = server.address().address
	var port = server.address().port
	console.log("Blog server started");
});
var express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	cons = require('consolidate'),
	dust = require('dustjs-helpers'),
	pg = require('pg'),
	app = express();

var config = {
  //Change
  user: 'test', //env var: PGUSER
  database: 'recipebookdb', //env var: PGDATABASE
  password: 'test', //env var: PGPASSWORD
  port: 5432, //env var: PGPORT
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req,res){

	var pool = new pg.Pool(config);
	// to run a query we can acquire a client from the pool,
	// run a query on the client, and then return the client to the pool
	pool.connect(function(err, client, done) {
	  if(err) {
	    return console.error('error fetching client from pool', err);
	  }
	  client.query('SELECT * FROM recipes', function(err, result) {

	    if(err) {
	      return console.error('error running query', err);
	    }
	    res.render('index',{recipes:result.rows});
	    done();

	  });
	});

	pool.on('error', function (err, client) {
	  // if an error is encountered by a client while it sits idle in the pool
	  // the pool itself will emit an error event with both the error and
	  // the client which emitted the original error
	  // this is a rare occurrence but can happen if there is a network partition
	  // between your application and the database, the database restarts, etc.
	  // and so you might want to handle it and at least log it out
	  console.error('idle client error', err.message, err.stack)
	})
});

app.post('/add', function(req, res){
	var pool = new pg.Pool(config);
	// to run a query we can acquire a client from the pool,
	// run a query on the client, and then return the client to the pool
	pool.connect(function(err, client, done) {
	  if(err) {
	    return console.error('error fetching client from pool', err);
	  }
	  client.query("INSERT INTO recipes(name, ingredients, directions) VALUES($1, $2, $3)",
	  	[req.body.name, req.body.ingredients, req.body.directions]);

	  done();
	  res.redirect('/');
	});

	pool.on('error', function (err, client) {
	  // if an error is encountered by a client while it sits idle in the pool
	  // the pool itself will emit an error event with both the error and
	  // the client which emitted the original error
	  // this is a rare occurrence but can happen if there is a network partition
	  // between your application and the database, the database restarts, etc.
	  // and so you might want to handle it and at least log it out
	  console.error('idle client error', err.message, err.stack)
	})
});

app.delete('/delete/:id', function(req, res){
	var pool = new pg.Pool(config);
	// to run a query we can acquire a client from the pool,
	// run a query on the client, and then return the client to the pool
	pool.connect(function(err, client, done) {
	  if(err) {
	    return console.error('error fetching client from pool', err);
	  }
	  client.query("DELETE FROM recipes WHERE id = $1",
	  	[req.params.id]);

	  done();
	  res.send(200);
	});

	pool.on('error', function (err, client) {
	  // if an error is encountered by a client while it sits idle in the pool
	  // the pool itself will emit an error event with both the error and
	  // the client which emitted the original error
	  // this is a rare occurrence but can happen if there is a network partition
	  // between your application and the database, the database restarts, etc.
	  // and so you might want to handle it and at least log it out
	  console.error('idle client error', err.message, err.stack)
	})
});
app.listen(3000, function(){
	console.log('Server started on port 3000');
});

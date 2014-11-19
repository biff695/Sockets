var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var db = require('mongojs').connect('sockets', ['users']);

var routes = require('./routes/index');
var users = require('./routes/users');

//#region Server Config

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = app.listen(3000, function () {
	console.log("Listening on 3000");
});

module.exports = server;

//#endregion

//#region Sockets

var io = require('socket.io')(server);

io.on('connection', function (socket) {

	console.log('a user connected: ' + socket);

	// Track active sockets
	SocketManager.AddSocket(socket);

	// Authorisation event
	socket.on('authorise', function (authData) {

		var user = authData.UserName;
		
		console.log(authData);
		
		var result = {};

		socket.emit("login response", result);
	});

	// Registration event
	socket.on('register', function (regData) {

		var email, user, pass;

		try {

			// "Validate" user input details
			email = regData.Email.trim();
			user = regData.UserName.trim();
			pass = regData.Password.trim();

			// if any required fields are missing then break
			if (!email || !user || !pass)
				throw "Reg failed";

		} catch (ex) {

			console.log('Registration failed');
			return;
		}

		// Encrypt password for database storage
		var encPass = Encryption.GetEncryptedString(pass);

		// Save user to database
		db.users.save({ email: email, user: user, pass: encPass }, function (err, success) {

			if (err || !success) {

				console.log("Registration failed to save user.");

				// send err back to client
				socket.emit('register failed', err);

			} else {

				console.log("User registered");
			}
		});

	});

	// Message received event
	socket.on('message broadcast', function (msg) {

		console.log(msg);
		io.emit('message broadcast', msg);
	});

	// User disconnected event
	socket.on('disconnect', function () {

		SocketManager.RemoveSocket(socket);

		console.log('user disconnected');
	});
});

var SocketManager = {
	ActiveSockets: [],

	AddSocket: function (skt) {
		SocketManager.ActiveSockets.push(skt);
	},

	RemoveSocket: function (skt) {

		var index = SocketManager.ActiveSockets.indexOf(skt);

		SocketManager.ActiveSockets.slice(index, index + 1);
	}
}

//#endregion

//#region Helpers

var crypto = require('crypto');

var Encryption = {
	GetEncryptedString: function (str) {

		var hmac = crypto.createHmac("sha1", 'auth secret');

		hmac.update(str);

		return hmac.digest("hex");
	}
}

//#endregion
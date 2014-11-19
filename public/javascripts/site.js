var Settings = {
	Username: {
		val: null,
		Get: function () {

			if (!Settings.Username.val)
				Settings.Username.val = localStorage["Settings.Username"];

			return Settings.Username.val;
		},
		Set: function (val) {

			Settings.Username.val = val;
			localStorage["Settings.Username"] = val;
		}
	}
}

var KeyCodes = {
	Enter: 13
}

// Send message on enter key
var inputKeyUp = function (evt) {

	if (evt.keyCode == KeyCodes.Enter)
		Messaging.BroadcastSend();
};

$(document).ready(function () {

	var username = Settings.Username.Get();

	if (username) {
		$("#txtUsername").val(username);
	}

	$("#txtUsername").focus();
});

var Account = {

	Login: function () {

		var username = $("#txtUsername").val().trim();

		if (!username)
			return;

		socket.emit("authorise", { Username: username });
	},

	LoginKeyUp: function (evt) {

		if (evt.keyCode == KeyCodes.Enter)
			Account.Login();
	},

	LoginResponse: function (msg) {

		Settings.Username.Set(msg.Username);

		var allUsers = msg.Users;

		console.log(allUsers);

		$(".auth-wrap").hide();
		$(".messenger").show();
	}
};

var Messaging = {

	PrivateReceived: function (msg) {

	},

	PrivateSend: function () {

	},

	BroadcastReceived: function (msg) {

		var message = Emoticons.Format(msg.Message);

		var isServerMessage = !msg.Username;
		var isSelfMessage = Settings.Username.Get() == msg.Username;

		$('#messages')
			.append($('<li' + (isSelfMessage ? " class=\"self\"" : "") + (isServerMessage ? " class=\"server\"" : "")  + '>')
			.text((msg.Username ? msg.Username + ": " : "") + message));

		var objDiv = document.getElementById("messages");

		objDiv.scrollTop = objDiv.scrollHeight;
	},

	BroadcastSend: function () {

		var msgTxt = $('#txtMessage').val().trim();

		// stop if no message
		if (!msgTxt)
			return;

		// Send message event
		socket.emit('message broadcast', { Username: Settings.Username.Get(), Message: msgTxt });

		// reset msg box
		$('#txtMessage').val('');

		return false;
	},

	KeyUp: function (evt) {

		if (evt.keyCode == KeyCodes.Enter)
			Messaging.BroadcastSend();
	}
};

var Users = {

	Connected: function (msg) {

		console.log(msg);

		Messaging.BroadcastReceived({ Message: msg.Username + " has connected." })

		Users.UpdateList(msg.Users);
	},

	Disconnected: function (msg) {

		console.log(msg);

		Messaging.BroadcastReceived({ Message: msg.Username + " has disconnected." })

		Users.UpdateList(msg.Users);
	},

	UpdateList: function (users) {


	}
}

var Emoticons = {
	":)": "smile",
	":(": "frown",
	":D": "grin",
	"(Y)": "like",
	";)": "wink",
	":P": "tongue",
	":p": "tongue",
	":3": "colonthree",
	":/": "unsure",
	":O": "gasp",
	":o": "gasp",
	":'(": "cry",
	"^_^": "kiki",
	"8-)": "glasses",
	"B|": "sunglasses",
	"<3": "heart",
	"-_-": "squint",
	"o.O": "confused",
	"O.o": "confused",

	Format: function (str) {
		return str;
	}
}

// Open socket connection
var socket = io();

// Attach socket "events"
socket.on("message broadcast", Messaging.BroadcastReceived);
socket.on("message private", Messaging.PrivateReceived);
socket.on("login response", Account.LoginResponse);
socket.on("user connected", Users.Connected);
socket.on("user disconnected", Users.Disconnected);
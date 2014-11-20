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

		Account.Login(username);
	}

	$("#txtUsername").focus();
});

var Account = {

	Login: function (user) {

		var username = user || $("#txtUsername").val().trim();

		if (!username || username.length > 25)
			return;

		socket.emit("authorise", { Username: username });
	},

	LoginKeyUp: function (evt) {

		if (evt.keyCode == KeyCodes.Enter)
			Account.Login();
	},

	LoginResponse: function (msg) {

		if (msg.Success) {

			Settings.Username.Set(msg.Username);

			var allUsers = msg.Users;

			Users.UpdateList(allUsers);

			$(".auth-wrap").hide();
			$(".messenger").show();

			$('#txtMessage').focus();
		} else {
			alert(msg.Message);
		}
	}
};

var Messaging = {

	PrivateReceived: function (msg) {

	},

	PrivateSend: function () {

	},

	BroadcastReceived: function (msg) {

		var message = Emoticons.Format(msg.Message);
		
		message = Messaging.FormatHashes(message);

		var isServerMessage = !msg.Username;
		var isSelfMessage = Settings.Username.Get() == msg.Username;

		var li = $('<li' + (isSelfMessage ? " class=\"self\"" : "") + (isServerMessage ? " class=\"server\"" : "") + '>');

		li.html((!isServerMessage && !isSelfMessage ? msg.Username + ": " : "") + message);

		$('#messages').append(li);

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
	},

	FormatHashes: function (str) {
		return str.replace(/#(\w+)/g, "<span class=\"hashtag\">#$1</span>");
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

		// Reset list
		$("#userList").html("");

		for (var u in users)
			$("#userList").append($("<li>").text(users[u]));
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

		for (var e in Emoticons) {
			if (e == "Format")
				continue;

			var find = "\\" + e.replace(/(.{1})/g, "$1\\");
			
			find = find.substring(0, find.length - 1);

			str = str.replace(new RegExp(find, "g"), "<span class=\"emoticon emoticon_" + Emoticons[e] + "\"></span>");
		}

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
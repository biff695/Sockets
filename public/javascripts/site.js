
var Settings = {
	Name: {
		val: null,
		Get: function () {
			
			if (!Settings.Name.val)
				Settings.Name.val = localStorage["Settings.Name"];

			return Settings.Name.val;
		},
		Set: function (val) {

			Settings.Name.val = val;
			localStorage["Settings.Name"] = val;
		}
	}
}

var socket = io();

// On chat message received
socket.on('message broadcast', function (msg) {

	$('#messages')
		.append($('<li>')
		.text(msg.Name + ": " + msg.Message));

	var objDiv = document.getElementById("messages");
	objDiv.scrollTop = objDiv.scrollHeight;
});

socket.on("login response", Account.LoginResponse);

var init = function () {

	Settings.Name.Set($("#txtName").val());

	$(".splash").css("display", "none");
}

var send = function () {

	var msgTxt = $('#m').val().trim();

	// stop if no message
	if (!msgTxt)
		return;

	// Send message event
	socket.emit('chat message', { Name: Settings.Name, Message: msgTxt });

	// reset msg box
	$('#m').val('');

	return false;
};

// Send message on enter key
var inputKeyUp = function (evt) {

	if (evt.keyCode == 13)
		send();
};

var Registration = {
	Register: function () {

		var email = "adam.lay@uniware.co.uk";
		var username = "Adam Lay";
		var pass = "chilli12";

		var regData = {
			Email: email,
			UserName: username,
			Password: pass
		}

		// Send register event
		socket.emit('register', regData);
	}
}

$(document).ready(function () {

	if (Settings.Name.Get()) {

		$(".splash").css("display", "none");
	}

});

var Account = {

	Login: function () {

		var username = $("#txtUsername").val();

		socket.emit("authorise", { UserName: username });
	},

	LoginResponse: function (msg) {

	}

}
"use strict";

const io = require("socket.io");

let self = function(application){
	
	var server = io(application.server);
	
	var sockets = {};
	
	var users_info = {};
	
	var last_msg = [];
	
	//new connection
	server.on("connection", function(socket) {
		sockets[socket.request.connection.remoteAddress] = socket;
		
		//send profile to new client
		sockets[socket.request.connection.remoteAddress].emit("first_load", {
			id: socket.request.connection.remoteAddress,
			users: users_info,
			last_msg: last_msg
		});
		
		//shared profile
		socket.on("shared_profile", function(data){
			users_info[data.id] = data;
			server.sockets.emit("new_user", data);
		});
		
		//message to server
		socket.on("mts", function(data) {
			try{
				var post = users_info[socket.request.connection.remoteAddress];
				post.message = data;
				post.time = new Date();
				if(last_msg.length==10){
					last_msg.splice(0,1);
				}
				last_msg.push(JSON.parse(JSON.stringify(post)));
				server.sockets.emit("mtc", post);
			}catch(e){
				console.log("socket:mts:" + e.toString());
				console.log(e);
			}
		});
		
		//desconnect
		socket.on("disconnect", function(){
			delete users_info[socket.request.connection.remoteAddress];
			server.sockets.emit("delete_user", socket.request.connection.remoteAddress);
		});
		
	});
}

module.exports = self;
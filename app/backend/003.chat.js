"use strict";

const fs = require("fs");
const io = require("socket.io");

let self = function(application){
	this.dir = application.dir;
	this.config = application.config;
	this.server = io(application.server);
	this.sockets = {};
	this.users_info = {};
	this.last_msg = [];
	this.server.on("connection", (socket)=>{this.connection(socket)});
	this.view = "chat/";
}

self.prototype.connection = function(socket){
	let ip = socket.request.connection.remoteAddress;
	this.sockets[ip] = socket;
	this.sockets[ip].on("shared_profile", (data)=>{this.shared_profile(data)});
	this.sockets[ip].on("mts", (data)=>{this.mts(data,ip)});
	this.sockets[ip].on("disconnect", ()=>{this.disconnect(ip)});	
	this.sockets[ip].emit("first_load", this.first_load(ip));
}

self.prototype.shared_profile = function(data){
	this.users_info[data.id] = data;
	this.server.sockets.emit("new_user", data);
}

self.prototype.mts = function(data,ip){
	try{
		let post = this.users_info[ip];
		post.message = data;
		post.time = new Date();
		if(this.last_msg.length==10){
			this.last_msg.splice(0,1);
		}
		this.last_msg.push(JSON.parse(JSON.stringify(post)));
		this.server.sockets.emit("mtc", post);
	}catch(e){
		console.log("socket:mts:" + e.toString());
		console.log(e);
	}
}

self.prototype.disconnect = function(ip){
	delete this.users_info[ip];
	this.server.sockets.emit("delete_user", ip);
}

self.prototype.first_load = function(ip){
	return {
		id: ip,
		users: this.users_info,
		last_msg: this.last_msg
	}
}



//@route('/chat')
//@method(['get'])
//@roles(['user'])
self.prototype.render_chat_index = async function(req,res){
	try{
		var v = this.view + "index";
		if(!fs.existsSync(this.dir + this.config.properties.views + "/" + v + ".html")){
			throw("URL no encontrada");
		}
		res.render(v,{config: this.config});
	}catch(e){
		res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
	}
}



//@route('/chat/:id')
//@method(['get'])
//@roles(['user'])
self.prototype.render_chat_other = async function(req,res){
	try{
		var v = this.view + req.params.id;
		if(!fs.existsSync(this.dir + this.config.properties.views + "/" + v + ".html")){
			throw("URL no encontrada");
		}
		res.render(v,{config: this.config});
	}catch(e){
		res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
	}
}



module.exports = self;
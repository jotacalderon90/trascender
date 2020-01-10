"use strict";

var fs = require("fs");
var txtomp3 = require("text-to-mp3");
var geoip = require("geoip-lite");

var self = function(application,params){
	
	/*********************************************/
	/*params[0] = (optional) 	path of view
	/*********************************************/
	
	this.dir = application.dir;
	this.config = application.config;
	this.view = (params[0]!=undefined)?params[0] + "/":"";
}

self.prototype.render = function(req,res){
	try{
		var v = this.view + ((req.params.id)?req.params.id:"index");
		if(!fs.existsSync(this.dir + this.config.properties.views + "/" + v + ".html")){
			throw("URL no encontrada");
		}
		res.render(v,{config: this.config});
	}catch(e){
		res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
	}
}

self.prototype.texttomp3 = function(req,res){
	txtomp3.attributes.tl = "es";
	txtomp3.getMp3(req.params.text, function(e, data){
		if(e){
			res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
		}else{
			res.send(data);
		}
	});
}

self.prototype.config_public = function(req,res){
	res.send({data: this.config.public});
}

self.prototype.ip = async function(req,res){
	try{
		var ip =  (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
		res.send({data: ip});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.geoip = function(req,res){
	try{
		var ip =  (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
		res.send({data: geoip.lookup(ip)});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.geoipFromIP = function(req,res){
	try{
		res.send({data: geoip.lookup(req.params.ip)});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

module.exports = self;
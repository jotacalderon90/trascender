"use strict";

const fs = require("fs");

let self = function(a,p){
	this.dir = a.dir;
	this.path = a.dir + "/app.json";
	this.json = a.config;
}

//@route('/config')
//@method(['get','put','delete'])
self.prototype.plain = function(req,res){
	this[req.method.toLowerCase()](req,res);
}

self.prototype.get = function(req,res){
	res.render("config",{config: this.json});
}

self.prototype.put = function(req,res){
	try{
		let json = JSON.parse(req.body.content);
		fs.writeFileSync(this.path, JSON.stringify(json,undefined,"\t"));
		this.json = json;
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}

self.prototype.delete = function(req,res){
	try{
		fs.unlinkSync(this.dir + "/app/backend/001.config.js");
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}

module.exports = self;
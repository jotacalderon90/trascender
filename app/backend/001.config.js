"use strict";

const fs = require("fs");

let self = function(a,p){
	this.dir = a.dir;
	this.config = a.config;
}

//@route('/config')
//@method(['get','put','delete'])
self.prototype.plain = function(req,res){
	this[req.method.toLowerCase()](req,res);
}

self.prototype.get = function(req,res){
	res.render("config",{config: this.config});
}

self.prototype.put = function(req,res){
	try{
		let config = JSON.parse(req.body.content);
		fs.writeFileSync(this.dir + "/app.json", JSON.stringify(config,undefined,"\t"));
		this.config = config;
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}

self.prototype.delete = function(req,res){
	try{
		fs.unlinkSync(this.dir + "/app/backend/001.config.js");
		fs.writeFileSync(this.dir + "/app.json", JSON.stringify(this.config,undefined,"\t"));
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}

module.exports = self;
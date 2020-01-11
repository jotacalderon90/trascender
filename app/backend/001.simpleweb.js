"use strict";

const fs = require("fs");

let self = function(application,params){
	this.dir = application.dir;
	this.config = application.config;
	this.path = "simpleweb";
}



//@route('/')
//@method(['get'])
self.prototype.render_index = function(req,res,next){
	let v = this.path + "/index";
	if(fs.existsSync(this.dir + this.config.properties.views + "/" + v + ".html")){
		res.render(v,{config: this.config});
	}else{
		return next();
	}
}



//@route('/:id')
//@method(['get'])
self.prototype.render_other = function(req,res,next){
	let v = this.path + "/" + req.params.id;
	if(fs.existsSync(this.dir + this.config.properties.views + "/" + v + ".html")){
		res.render(v,{config: this.config});
	}else{
		return next();
	}
}

module.exports = self;
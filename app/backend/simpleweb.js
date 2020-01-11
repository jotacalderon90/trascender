"use strict";

var fs = require("fs");

var self = function(application,params){
	this.dir = application.dir;
	this.config = application.config;
	this.view = "simpleweb/";
}



//@route('/')
//@method(['get'])
self.prototype.render_index = function(req,res){
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



//@route('/:id')
//@method(['get'])
self.prototype.render_other = function(req,res){
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

module.exports = self;
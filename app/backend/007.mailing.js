"use strict";

var fs = require("fs");

var self = function(a,p){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
	this.path = "mailing";
	
	if(a.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(a.config.recaptcha.public,a.config.recaptcha.private);
		this.recaptcha.render();
	}
}



//@route('/api/mailing/message')
//@method(['post'])
//@roles(['admin'])
self.prototype.send = async function(req,res){
	try{
		await this.mailing.send(req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}



//@route('/api/message')
//@method(['post'])
//@description('segunda accion en que usuario/cliente envia informacion al servidor')
self.prototype.create = async function(req,res){
	try{
		await this.mailing.send(req.body);
	}catch(e){
		console.error("ERROR-ERROR-ERROR-ERROR");
		console.error("ERROR-ERROR-ERROR-ERROR");
		console.error("ERROR-ERROR-ERROR-ERROR");
		console.error(e);
	}
	res.send({data: true});
}




//@route('/mailing')
//@method(['get'])
//@roles(['admin'])
self.prototype.render_index = function(req,res,next){
	let view = this.path + "/" + "index";
	if(this.helper.exist(view)){
		res.render(view,{config: this.config});
	}else{
		return next();
	}
}



//@route('/mailing/:id')
//@method(['get'])
//@roles(['admin'])
self.prototype.render_other = function(req,res,next){
	let view = this.path + "/" + req.params.id;
	if(this.helper.exist(view)){
		res.render(view,{config: this.config});
	}else{
		return next();
	}
}



module.exports = self;
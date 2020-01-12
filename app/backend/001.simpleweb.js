"use strict";

const fs = require("fs");

let self = function(a,p){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
	this.render = a.render;
	this.path = "simpleweb";
}



//@route('/')
//@method(['get'])
self.prototype.render_index = function(req,res,next){
	let view = this.path + "/" + "index";
	if(this.helper.exist(view)){
		res.render(view,{config: this.config});
	}else{
		return next();
	}
}



//@route('/:id')
//@method(['get'])
self.prototype.render_other = function(req,res,next){
	let view = this.path + "/" + req.params.id;
	if(this.helper.exist(view)){
		res.render(view,{config: this.config});
	}else{
		return next();
	}
}

//@route('/api/message')
//@method(['post'])
//@description('primera accion en que usuario/cliente envia informacion al servidor')
self.prototype.create = async function(req,res,next){
	try{
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}
		if(this.helper.isEmail(req.body.email)){
			let db = await this.mongodb.connect(this.config.database.url);
			req.body.created = new Date();
			req.body.to = req.body.email;
			req.body.bcc = this.config.properties.admin;
			req.body.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "message.html",{config: this.config, memo: req.body});
			req.body.fields = req.body.fields;
			await this.mongodb.insertOne(db,"message",req.body,true);
			if(this.config.smtp.enabled){
				next();
			}
			res.send({data: true});
		}else{
			throw("IMAIL INVALIDO");
		}
	}catch(e){
		console.error("ERROR-ERROR-ERROR-ERROR");
		console.error("ERROR-ERROR-ERROR-ERROR");
		console.error("ERROR-ERROR-ERROR-ERROR");
		console.error(e);
		res.send({data: true});
	}
}



module.exports = self;
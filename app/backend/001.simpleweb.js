"use strict";

const fs = require("fs");

let self = function(a,p){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
	
	if(a.recaptcha && a.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(this.config.recaptcha.public,this.config.recaptcha.private);
		this.recaptcha.render();
	}
}



self.prototype.render_view = function(req,res,next){
	let view = ((req.params.id)?req.params.id:"index");
	if(this.helper.exist(view)){
		res.render(view);
	}else{
		return next();
	}
}



//@route('/')
//@method(['get'])
self.prototype.render_index = function(req,res,next){
	this.render_view(req,res,next);
}



//@route('/:id')
//@method(['get'])
self.prototype.render_other = function(req,res,next){
	this.render_view(req,res,next);
}



//@route('/api/message')
//@method(['post'])
//@description('primera accion en que usuario/cliente envia informacion al servidor')
self.prototype.message = async function(req,res,next){
	try{
		if(this.helper.isEmail(req.body.email)){
			if(this.recaptcha!=undefined){
				await this.helper.recaptcha(this.recaptcha,req);
			}
			let db = await this.mongodb.connect(this.config.database.url);
			
			req.body.created = new Date();
			req.body.to = req.body.email;
			req.body.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "message.html",req.body);
			
			await this.mongodb.insertOne(db,"message",req.body,true);
			if(this.config.smtp.enabled){
				await this.mailing.send(req.body);
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
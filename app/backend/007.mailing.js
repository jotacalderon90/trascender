"use strict";

var fs = require("fs");

var self = function(application,params){
	
	this.dir		= application.dir;
	this.config		= application.config;
	this.render 	= application.render;
	this.helper 	= application.helper;
	this.mailing	= application.mailing;
	
	if(application.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(application.config.recaptcha.public,application.config.recaptcha.private);
		this.recaptcha.render();
	}
	this.view = "mailing/";
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
self.prototype.create = async function(req,res){
	try{
		
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}
		
		req.body.to = req.body.email;
		req.body.bcc = this.config.properties.admin;
		req.body.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "message.html",req.body);
		await this.mailing.send(req.body);
		
		//finish
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}




//@route('/mailing')
//@method(['get'])
//@roles(['admin'])
self.prototype.render_index = async function(req,res){
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



//@route('/mailing/:id')
//@method(['get'])
//@roles(['admin'])
self.prototype.render_other = async function(req,res){
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
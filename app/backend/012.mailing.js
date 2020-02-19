"use strict";

var self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.render = a.render;
	
	if(a.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(a.config.recaptcha.public,a.config.recaptcha.private);
		this.recaptcha.render();
	}
}



self.prototype.render_view = function(req,res,next){
	let view = "mailing/" + ((req.params.id)?req.params.id:"index");
	if(this.helper.exist(view)){
		res.render(view);
	}else{
		return next();
	}
}



//@route('/mailing')
//@method(['get'])
//@roles(['admin'])
self.prototype.render_index = function(req,res,next){
	this.render_view(req,res,next);
}



//@route('/mailing/:id')
//@method(['get'])
//@roles(['admin'])
self.prototype.render_other = function(req,res,next){
	this.render_view(req,res,next);
}



//@route('/api/mailing/message')
//@method(['post'])
//@roles(['admin'])
self.prototype.send = async function(req,res){
	try{
		if(req.body.template){
			req.body.html = this.render.processTemplateByPath(this.dir + this.config.properties.views + "mailing/" + req.body.template + ".html",req.body);
		}
		await this.mailing.send(req.body);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e});
	}
}
module.exports = self;
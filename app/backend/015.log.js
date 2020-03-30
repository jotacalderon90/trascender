"use strict";

const fs = require("fs");

let self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
}



self.prototype.render_view = function(req,res,next,data){
	let view = "log/" + ((req.params.id)?req.params.id:"index");
	if(this.helper.exist(view)){
		res.render(view,data);
	}else{
		return next();
	}
}



//@route('/log')
//@method(['get'])
//@roles(['admin'])
self.prototype.render = async function(req,res,next){
	try{
		let data = fs.readFileSync(this.dir + "/log.csv","utf-8");
		this.render_view(req,res,next,{data: data});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



//@route('/log/:id')
//@method(['get'])
//@roles(['admin'])
self.prototype.render_id = async function(req,res,next){
	this.render_view(req,res,next);
}



module.exports = self;
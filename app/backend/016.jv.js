"use strict";

const fs = require("fs");

let self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
}



//@route('/api/user.jv/total')
//@method(['get'])
self.prototype.user_total = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		query.roles = {$in: ["JV"]};
		let total = await this.mongodb.count(db,"user",query,{},true);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/user.jv/collection')
//@method(['get'])
self.prototype.user_collection = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		query.roles = {$in: ["JV"]};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		options.projection = {public: 1};
		let data = await this.mongodb.find(db,"user",query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/user.jv/tag/collection')
//@method(['get'])
self.prototype.user_tags = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let data = await this.mongodb.distinct(db,"user","public.tag",true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/jv/total')
//@method(['get'])
self.prototype.jv_total = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count(db,"jv",query,{},true);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/jv/collection')
//@method(['get'])
self.prototype.jv_collection = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find(db,"jv",query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}


//@route('/api/jv/:id')
//@method(['get'])
self.prototype.jv_read = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let row = await this.mongodb.findOne(db,"jv",req.params.id,true);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/jv')
//@method(['get'])
//@roles(['user'])
self.prototype.render_index = async function(req,res){
	try{
		var v = "jv/index";
		if(!fs.existsSync(this.dir + this.config.properties.views + "/" + v + ".html")){
			throw("URL no encontrada");
		}
		res.render(v,{config: this.config});
	}catch(e){
		res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
	}
}



//@route('/jv/:id')
//@method(['get'])
//@roles(['user'])
self.prototype.render_other = async function(req,res){
	try{
		var v = "jv/" + req.params.id;
		if(!fs.existsSync(this.dir + this.config.properties.views + "/" + v + ".html")){
			throw("URL no encontrada");
		}
		res.render(v,{config: this.config});
	}catch(e){
		res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
	}
}



module.exports = self;
"use strict";

const fs = require("fs");

let self = function(application,params){
	//get main dbs
	let mdbs;
	for(db in application.config.database){
		if(application.config.database[db].main){
			mdbs = application.config.database[db];
		}
	}
	
	this.dir				= application.dir;
	this.config				= application.config;
	this.url				= mdbs.url;
	this.helper				= application.helper;
	this.collection_name	= "story";
	this.view_doc			= "story/document";
	this.view_coll			= "story/collection";
	this.match				= "title";
	this.sort				= {year: -1, month: -1, day: -1, title: -1};
	this.mongodb			= application.mongodb;
	this.view = "story/";
}



//@route('/story')
//@method(['get'])
self.prototype.renderCollection = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let title = (req.params.id)?req.params.id:collection;
		let query = (req.params.id)?{tag: req.params.id}:{};
		let options = {};
		options.limit = 10;
		options.sort = this.sort;
		let db = await this.mongodb.connect(this.url);
		let data = await this.mongodb.find(db,collection,query,options,true);
		res.render(this.view_coll,{
			title: title.charAt(0).toUpperCase() + title.slice(1),
			rows: data,
			config: this.config
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/story/categoria/:id')
//@method(['get'])
self.prototype.renderCollectionTag = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let title = (req.params.id)?req.params.id:collection;
		let query = (req.params.id)?{tag: req.params.id}:{};
		let options = {};
		options.limit = 10;
		options.sort = this.sort;
		let db = await this.mongodb.connect(this.url);
		let data = await this.mongodb.find(db,collection,query,options,true);
		res.render(this.view_coll,{
			title: title.charAt(0).toUpperCase() + title.slice(1),
			rows: data,
			config: this.config
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/api/story/total')
//@method(['get'])
self.prototype.total = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count(db,collection,query,{},true);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/collection')
//@method(['get'])
self.prototype.collection = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find(db,collection,query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/tag/collection')
//@method(['get'])
self.prototype.tags = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		let data = await this.mongodb.distinct(db,collection,"tag",true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/:id')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.findOne(db,collection,req.params.id,true);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story')
//@method(['post'])
//@roles(['admin'])
self.prototype.create = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		await this.mongodb.insertOne(db,collection,req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/:id')
//@method(['put'])
//@roles(['admin'])
self.prototype.update = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		await this.mongodb.updateOne(db,collection,req.params.id,req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/story/:id')
//@method(['delete'])
//@roles(['admin'])
self.prototype.delete = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		await this.mongodb.deleteOne(db,collection,req.params.id,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/story/:id')
//@method(['get'])
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
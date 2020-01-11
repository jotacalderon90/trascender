"use strict";

let self = function(a,p){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
	
	this.collection_name	= "blog";
	this.view_doc			= "blog/document";
	this.view_coll			= "blog/collection";
	this.match				= "uri";
	this.sort				= {created: -1};
	
}



//@route('/blog')
//@method(['get'])
self.prototype.renderCollection = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let title = (req.params.id)?req.params.id:collection;
		let query = (req.params.id)?{tag: req.params.id}:{};
		let options = {};
		options.limit = 10;
		options.sort = this.sort;
		let db = await this.mongodb.connect(this.config.database.url);
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



//@route('/blog/categoria/:id')
//@method(['get'])
self.prototype.renderCollectionTag = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let title = (req.params.id)?req.params.id:collection;
		let query = (req.params.id)?{tag: req.params.id}:{};
		let options = {};
		options.limit = 10;
		options.sort = this.sort;
		let db = await this.mongodb.connect(this.config.database.url);
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



//@route('/blog/:id')
//@method(['get'])
self.prototype.renderDocument = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let query = {};
		query[this.match] = req.params.id;		
		let db = await this.mongodb.connect(this.config.database.url);
		let data = await this.mongodb.find(db,collection,query,{},true);
		if(data.length!=1){
			throw("No se encontró el documento solicitado");
		}
		res.render(this.view_doc,{
			row: data[0],
			config: this.config
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/api/blog/total')
//@method(['get'])
self.prototype.total = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count(db,collection,query,{},true);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/blog/collection')
//@method(['get'])
self.prototype.collection = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find(db,collection,query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/blog/tag/collection')
//@method(['get'])
self.prototype.tags = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		let data = await this.mongodb.distinct(db,collection,"tag",true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/blog/:id')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		let row = await this.mongodb.findOne(db,collection,req.params.id,true);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/blog')
//@method(['post'])
//@roles(['admin','BLOGUER'])
self.prototype.create = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		await this.mongodb.insertOne(db,collection,req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/blog/:id')
//@method(['put'])
//@roles(['admin','BLOGUER'])
self.prototype.update = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		await this.mongodb.updateOne(db,collection,req.params.id,req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/blog/:id')
//@method(['delete'])
//@roles(['admin','BLOGUER'])
self.prototype.delete = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		await this.mongodb.deleteOne(db,collection,req.params.id,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = self;
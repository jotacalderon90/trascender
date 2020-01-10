"use strict";

let self = function(application,params){
	
	/***************************************************
	/*params[0] = (required)	url db connection
	/*params[1] = (optional)	static object (undefined = all object)
	/****************************************************/
	
	this.config				= application.config;
	this.url				= application.config.database[params[0]].url;
	this.helper				= application.helper;
	this.collection_name	= "game";
	this.view_doc			= "game/document";
	this.view_coll			= "game/collection";
	this.view_index			= "game/index";
	this.mongodb			= application.mongodb;
	
}

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

self.prototype.renderDocument = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let query = {};
		query[this.match] = req.params.id;		
		let db = await this.mongodb.connect(this.url);
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

self.prototype.renderIndex = async function(req,res){
	try{
		res.render(this.view_index,{});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.export = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.url);
		let o = await this.mongodb.find(db,"object",{name: req.params.name},{});
		if(o.length!=1){
			throw("Problemas con el objeto");
		}
		if(!o[0].public){
			throw("Problemas con el objeto (2)");
		}
		let data = await this.mongodb.find(db,req.params.name,{},{},true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

self.prototype.import = async function(req,res){
	try{
		let request = await this.helper.request(req.body.uri);
		if(!request.data){
			throw(request.error);
		}
		
		let db = await this.mongodb.connect(this.url);
		for(let i=0;i<request.data.length;i++){
			request.data[i]._id = this.mongodb.toId(request.data[i]._id);
			await this.mongodb.insertOne(db,req.params.name,request.data[i]);
			console.log("INSERTADO " + (i+1) + "/" + request.data.length);
		}
		
		db.close();
		
		res.send({data: true});
	}catch(e){
		console.log(e);
		res.send({data: null,error: e.toString()});
	}
}

module.exports = self;
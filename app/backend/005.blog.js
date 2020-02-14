"use strict";

let self = function(a){
	this.config = a.config;
	this.mongodb = a.mongodb;
}



//@route('/blog')
//@method(['get'])
self.prototype.renderCollection = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let data = await this.mongodb.find(db,"blog",{},{limit: 10, sort: {created: -1}},true);
		res.render("blog/collection",{title: "Blog", rows: data});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



//@route('/blog/new')
//@method(['get'])
self.prototype.new = async function(req,res){
	res.render("blog/form");
}



//@route('/blog/edit/:id')
//@method(['get'])
self.prototype.edit = async function(req,res){
	try{	
		let db = await this.mongodb.connect(this.config.database.url);
		let row = await this.mongodb.findOne(db,"blog",req.params.id,true);
		res.render("blog/form",{row: row});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
	
}



//@route('/blog/categoria/:id')
//@method(['get'])
self.prototype.renderCollectionTag = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let data = await this.mongodb.find(db,"blog",{tag: req.params.id},{limit: 10, sort: {created: -1}},true);
		res.render("blog/collection",{title: req.params.id.charAt(0).toUpperCase() + req.params.id.slice(1),rows: data});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



//@route('/blog/:id')
//@method(['get'])
self.prototype.renderDocument = async function(req,res){
	try{	
		let db = await this.mongodb.connect(this.config.database.url);
		let data = await this.mongodb.find(db,"blog",{uri:req.params.id},{},true);
		if(data.length!=1){
			throw("No se encontró el documento solicitado");
		}else{
			res.render("blog/document",{row: data[0]});
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/api/blog/total')
//@method(['get','post'])
self.prototype.total = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count(db,"blog",query,{},true);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/blog/collection')
//@method(['get','post'])
self.prototype.collection = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find(db,"blog",query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/blog/tag/collection')
//@method(['get'])
self.prototype.tag = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let data = await this.mongodb.distinct(db,"blog","tag",true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/blog/:id')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let row = await this.mongodb.findOne(db,"blog",req.params.id,true);
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
		let db = await this.mongodb.connect(this.config.database.url);
		
		req.body.user = req.user._id;
		req.body.created = new Date();
		
		await this.mongodb.insertOne(db,"blog",req.body);
		
		await this.mongodb.insertOne(db,"wall",{
			content: "<p>Creó una nueva publicación en el Blog: <small>" + req.body.title + "</small></p>",
			url: "/blog/" + req.body.uri,
			tag: (typeof req.body.tag=="string")?req.body.tag.split(","):req.body.tag,
			author: req.body.user,
			created: new Date()
		},true);
		
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
		let db = await this.mongodb.connect(this.config.database.url);
		
		req.body.user = req.user._id;
		req.body.updated = new Date();
		
		await this.mongodb.updateOne(db,"blog",req.params.id,req.body);
		
		await this.mongodb.insertOne(db,"wall",{
			content: "<p>Actualizó una publicación del Blog: <small>" + req.body.title + "</small></p>",
			url: "/blog/" + req.body.uri,
			tag: (typeof req.body.tag=="string")?req.body.tag.split(","):req.body.tag,
			author: req.body.user,
			created: new Date()
		},true);
		
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
		let db = await this.mongodb.connect(this.config.database.url);
		let row = await this.mongodb.findOne(db,"blog",req.params.id);
		await this.mongodb.deleteOne(db,"blog",req.params.id);
		await this.mongodb.insertOne(db,"wall",{
			content: "<p>Eliminó una publicación del Blog: <small>" + row.title + "</small></p>",
			tag: ["Blog"],
			author: req.user._id,
			created: new Date()
		},true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



module.exports = self;
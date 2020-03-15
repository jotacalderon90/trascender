"use strict";

let self = function(a){
	this.config = a.config;
	this.mongodb = a.mongodb;
}



//@route('/product')
//@method(['get'])
self.prototype.renderCollection = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let data = await this.mongodb.find(db,"product",{},{limit: 10, sort: {title: 1}},true);
		res.render("product/collection",{title: "Product", rows: data});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



//@route('/product/new')
//@method(['get'])
self.prototype.new = async function(req,res){
	res.render("product/form");
}



//@route('/product/edit/:id')
//@method(['get'])
//@roles(['admin','SELLER'])
self.prototype.edit = async function(req,res){
	try{	
		let db = await this.mongodb.connect(this.config.database);
		let row = await this.mongodb.findOne(db,"product",req.params.id,true);
		res.render("product/form",{row: row});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
	
}



//@route('/product/categoria/:id')
//@method(['get'])
self.prototype.renderCollectionTag = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let data = await this.mongodb.find(db,"product",{tag: req.params.id},{limit: 10, sort: {title: 1}},true);
		res.render("product/collection",{title: req.params.id.charAt(0).toUpperCase() + req.params.id.slice(1),rows: data});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



//@route('/product/:id')
//@method(['get'])
self.prototype.renderDocument = async function(req,res){
	try{	
		let db = await this.mongodb.connect(this.config.database);
		let data = await this.mongodb.find(db,"product",{uri:req.params.id},{},true);
		if(data.length!=1){
			throw("No se encontró el documento solicitado");
		}else{
			res.render("product/document",{row: data[0]});
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/api/product/total')
//@method(['get','post'])
self.prototype.total = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count(db,"product",query,{},true);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/product/collection')
//@method(['get','post'])
self.prototype.collection = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find(db,"product",query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/product/tag/collection')
//@method(['get'])
self.prototype.tag = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let data = await this.mongodb.distinct(db,"product","tag",true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/product/:id')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let row = await this.mongodb.findOne(db,"product",req.params.id,true);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/product')
//@method(['post'])
//@roles(['admin','SELLER'])
self.prototype.create = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		
		req.body.user = req.user._id;
		req.body.created = new Date();
		
		await this.mongodb.insertOne(db,"product",req.body);
		
		await this.mongodb.insertOne(db,"wall",{
			content: "<p>Creó un nuevo Producto: <small>" + req.body.title + "</small></p>",
			url: "/product/" + req.body.uri,
			tag: (typeof req.body.tag=="string")?req.body.tag.split(","):req.body.tag,
			author: req.body.user,
			created: new Date()
		},true);
		
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/product/:id')
//@method(['put'])
//@roles(['admin','SELLER'])
self.prototype.update = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		
		req.body.user = req.user._id;
		req.body.updated = new Date();
		
		await this.mongodb.updateOne(db,"product",req.params.id,req.body);
		
		await this.mongodb.insertOne(db,"wall",{
			content: "<p>Actualizó un Producto: <small>" + req.body.title + "</small></p>",
			url: "/product/" + req.body.uri,
			tag: (typeof req.body.tag=="string")?req.body.tag.split(","):req.body.tag,
			author: req.body.user,
			created: new Date()
		},true);
		
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/product/:id')
//@method(['delete'])
//@roles(['admin','SELLER'])
self.prototype.delete = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let row = await this.mongodb.findOne(db,"product",req.params.id);
		await this.mongodb.deleteOne(db,"product",req.params.id);
		await this.mongodb.insertOne(db,"wall",{
			content: "<p>Eliminó un Producto: <small>" + row.title + "</small></p>",
			tag: ["Product"],
			author: req.user._id,
			created: new Date()
		},true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



module.exports = self;
"use strict";

const fs = require("fs");

let self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
	this.path = "database";
}



//@route('/api/document/:name/export')
//@method(['get'])
//@roles(['admin','ADM_Data'])
self.prototype.export = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
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



//@route('/api/document/:name/import')
//@method(['post'])
//@roles(['admin','ADM_Data'])
self.prototype.import = async function(req,res){
	try{
		let request = await this.helper.request(req.body.uri);
		if(!request.data){
			throw(request.error);
		}
		
		let db = await this.mongodb.connect(this.config.database.url);
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



//@route('/api/document/:name/total')
//@method(['get'])
//@roles(['admin','ADM_Data'])
self.prototype.total = async function(req,res){
	try{
		let collection = req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count(db,collection,query,{},true);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/document/:name/collection')
//@method(['get'])
//@roles(['admin','ADM_Data'])
self.prototype.collection = async function(req,res){
	try{
		let collection = req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find(db,collection,query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/document/:name/tags')
//@method(['get'])
//@roles(['admin','ADM_Data'])
self.prototype.tags = async function(req,res){
	try{
		let collection = req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		let data = await this.mongodb.distinct(db,collection,"tag",true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/document/:name')
//@method(['post'])
//@roles(['admin','ADM_Data'])
self.prototype.create = async function(req,res){
	try{
		let collection = req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		await this.mongodb.insertOne(db,collection,req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/document/:name/:id')
//@method(['get'])
//@roles(['admin','ADM_Data'])
self.prototype.read = async function(req,res){
	try{
		let collection = req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		let row = await this.mongodb.findOne(db,collection,req.params.id,true);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/document/:name/:id')
//@method(['put'])
//@roles(['admin','ADM_Data'])
self.prototype.update = async function(req,res){
	try{
		let collection = req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		await this.mongodb.updateOne(db,collection,req.params.id,req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/document/:name/:id')
//@method(['delete'])
//@roles(['admin','ADM_Data'])
self.prototype.delete = async function(req,res){
	try{
		let collection = req.params.name;
		let db = await this.mongodb.connect(this.config.database.url);
		await this.mongodb.deleteOne(db,collection,req.params.id,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}




//@route('/database')
//@method(['get'])
//@roles(['admin','ADM_Data'])
self.prototype.render_index = function(req,res,next){
	let view = this.path + "/" + "index";
	if(this.helper.exist(view)){
		res.render(view,{config: this.config});
	}else{
		return next();
	}
}



//@route('/database/:id')
//@method(['get'])
//@roles(['admin','ADM_Data'])
self.prototype.render_other = function(req,res,next){
	let view = this.path + "/" + req.params.id;
	if(this.helper.exist(view)){
		res.render(view,{config: this.config});
	}else{
		return next();
	}
}



module.exports = self;
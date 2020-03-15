"use strict";

const fs = require("fs");
const txtomp3 = require("text-to-mp3");

let self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.helper = a.helper;
	this.mongodb = a.mongodb;
	this.collection_name = "map";
}



//@route('/api/map/collection')
//@method(['get'])
self.prototype.collection = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find(db,collection,query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/map')
//@method(['post'])
//@roles(['admin'])
self.prototype.create = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database);
		await this.mongodb.insertOne(db,collection,req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/map/:id')
//@method(['put'])
//@roles(['admin'])
self.prototype.update = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.config.database);
		await this.mongodb.updateOne(db,collection,req.params.id,req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/map')
//@method(['get'])
self.prototype.render_index = async function(req,res){
	try{
		var v = "map/index";
		if(!fs.existsSync(this.dir + this.config.properties.views + "/" + v + ".html")){
			throw("URL no encontrada");
		}
		res.render(v,{config: this.config});
	}catch(e){
		res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
	}
}



//@route('/map/audio/:text')
//@method(['get'])
self.prototype.texttomp3 = function(req,res){
	txtomp3.attributes.tl = "es";
	txtomp3.getMp3(req.params.text, function(e, data){
		if(e){
			res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
		}else{
			res.send(data);
		}
	});
}



module.exports = self;
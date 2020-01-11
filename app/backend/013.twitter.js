"use strict";

const fs = require("fs");

var self = function(application,params){
	this.helper = application.helper;
	this.url = "https://cdn.syndication.twimg.com/timeline/profile?screen_name=";
	this.tweets = {};
	this.dir				= application.dir;
	this.config				= application.config;
	this.url				= application.config.database.url;
	this.helper				= application.helper;
	this.collection_name	= "twitter";
	this.view = "twitter/";
}



//@route('/api/tweet/:name')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		let n = req.params.name.toLowerCase();
		let c = null;
		if(this.tweets[n]){
			let d = this.tweets[n].d - new Date();
			//var diffDays = Math.floor(diffMs / 86400000); // days
			//var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
			//var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
			d = Math.round(((d % 86400000) % 3600000) / 60000);
			c = (d<5)?this.tweets[n].c:null;
		}
		if(c==null){
			c = await this.helper.request(this.url + n);
			this.tweets[n] = {c: c, d: new Date()}
		}
		res.send({data: c});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}


//@route('/api/twitter/total')
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



//@route('/api/twitter/collection')
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



//@route('/api/twitter/tag/collection')
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



//@route('/api/twitter')
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



//@route('/api/twitter/:id')
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



//@route('/api/twitter/:id')
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



//@route('/twitter')
//@method(['get'])
self.prototype.render_index = async function(req,res){
	try{
		var v = this.view + "index";
		if(!fs.existsSync(this.dir + this.config.properties.views + "/" + v + ".html")){
			throw("URL no encontrada");
		}
		res.render(v,{config: this.config});
	}catch(e){
		res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
	}
}



//@route('/twitter/:id')
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
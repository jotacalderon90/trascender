"use strict";

let self = function(application,params){
	
	/***************************************************
	/*params[0] = (required)	url db connection
	/*params[1] = (optional)	static object (undefined = all object)
	/****************************************************/
	
	this.config				= application.config;
	this.url				= application.config.database[params[0]].url;
	this.helper				= application.helper;
	this.collection_name	= "user";
	this.mongodb			= application.mongodb;
	
}

self.prototype.total = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		query.roles = {$in: ["JV"]};
		let total = await this.mongodb.count(db,this.collection_name,query,{},true);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

self.prototype.collection = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		query.roles = {$in: ["JV"]};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		options.fields = {public: 1};
		let data = await this.mongodb.find(db,this.collection_name,query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

self.prototype.tags = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.url);
		let data = await this.mongodb.distinct(db,this.collection_name,"public.tag",true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}

module.exports = self;
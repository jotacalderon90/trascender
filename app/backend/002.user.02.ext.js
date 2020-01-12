"use strict";

const fs = require("fs");

var self = function(a,p){
	this.config = a.config;
	this.mongodb = a.mongodb;
}



//@route('/api/user')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		if(req.user==null){
			throw("empty");
		}else if(req.user.error){
			throw(req.user.error);
		}else{
			let db = await this.mongodb.connect(this.config.database.url);
			let user = await this.mongodb.findOne(db,"user",req.user.sub);
			let active = await this.mongodb.find(db,"user_active",{user_id: req.user.sub},{},true);
			if(active.length==0){
				throw("empty");
			}else{
				res.send({data: user});
			}
		}
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/user/:id')
//@method(['get'])
//@roles(['user'])
self.prototype.public = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let user = await this.mongodb.findOne(db,"user",req.params.id,true);
		res.send({data: {
			nickname: user.nickname,
			thumb: user.thumb
		}});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}



//@route('/api/user/update/ext')
//@method(['put'])
//@roles(['user'])
self.prototype.update_ext = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let user = await this.mongodb.findOne(db,"user",req.user.sub);
		let enabled = ["lmap","public","jv","interest","location","twitter"];
		let fields = {};
		for(let attr in req.body){
			if(enabled.indexOf(attr)>-1){
				fields[attr] = req.body[attr];
			}
		}
		let updated = {$set: fields};
		await this.mongodb.updateOne(db,"user",user._id,updated,true);
		res.send({data: true});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e});
	}
}



module.exports = self;
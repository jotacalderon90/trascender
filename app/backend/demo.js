"use strict";

let self = function(application,params){
	
}

self.prototype.demo = function(req,res){
	res.send("hola mundo, como va todo!");
}

self.prototype.json = function(req,res){
	res.send({data: {title: "hola mundo!",name: "yo soy trascender"}});
}

module.exports = self;
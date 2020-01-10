"use strict";

const fs = require("fs");

var self = function(application,params){
	
	/*********************************************/
	/*params[0] = (required)	url db connection
	/*params[1] = (optional) 	path of view
	/*********************************************/
	
	this.config		= application.config;
	this.dir		= application.dir;
	this.url		= application.config.database[params[0]].url;
	this.render 	= application.render;
	this.helper		= application.helper;
	this.mongodb	= application.mongodb;
	this.mailing	= application.mailing;
	this.view		= (params[1]!=undefined)?params[1] + "/":"";
	
}

self.prototype.start = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.findOne(db,"poll",req.params.id);
		
		row.sent = [];
		row.answer = [];
		
		for(let i=0;i<row.accounts.length;i++){
			row.accounts[i] = row.accounts[i].trim();
			
			let hash = this.helper.toHash(row.accounts[i], row._id.toString());
			
			row.sent.push(hash);
			row.answer.push(null);
		}
		
		//update poll
		row.status = "Enviada";
		await this.mongodb.updateOne(db,"poll",req.params.id,row,true);
		
		//finish
		res.send({data: true, row: row});
		
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.notify = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.findOne(db,"poll",req.params.id);
		let to = req.params.to;
		let hash = this.helper.toHash(to, row._id.toString());
		
		//doc to mail/template
		let doc = {
			to: to,
			subject: row.title,
			poll: row,
			encode: this.config.public.host + "/api/poll/" + row._id + "/answer/" + hash
		}
		
		//set template
		doc.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "poll.html", doc);
		
		//send memo
		await this.mailing.send(doc);
		
		//finish
		res.send({data: true, row: row});
		
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.answer = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.findOne(db,"poll",req.params.id);
		
		if(row.status!="Enviada"){
			throw("La votación ya no está disponible");
		}
		
		//get index of user account
		let indexof = row.sent.indexOf(req.params.encode);
		if(indexof==-1){
			throw("La codificación ingresada no corresponde");
		}
				
		switch(req.method){
			case "GET":
				if(row.answer[indexof]!=null){
					throw("Su solicitud ya ha sido procesada");
				}
				res.render(this.view + "poll",{poll: row, action: this.config.public.host +"/api/poll/" + row._id + "/answer/" + req.params.encode});
			break;
			case "POST":
				row.answer[indexof] = req.body.option;
				await this.mongodb.updateOne(db,"poll",req.params.id,row,true);
				let ext = (row.private)?"":", para ver los resultados ingrese <a href='/api/poll/" + req.params.id + "/result'>aquí</a>";
				res.render("message",{title: "VOTACION", message: "Se ha respondido satisfactoriamente" + ext, class: "success", config: this.config});
			break;
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.answer_anon = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.findOne(db,"poll",req.params.id);
		
		if(row.status!="Enviada"){
			throw("La votación ya no está disponible");
		}
		
		if(!row.anon){
			throw("La votación no está disponible");
		}
		
		switch(req.method){
			case "GET":
				res.render(this.view + "poll",{poll: row, action: this.config.public.host +"/api/poll/" + row._id + "/answer"});
			break;
			case "POST":
				row.anons.push(req.body.option);
				await this.mongodb.updateOne(db,"poll",req.params.id,row,true);
				let ext = (row.private)?"":", para ver los resultados ingrese <a href='/api/poll/" + req.params.id + "/result'>aquí</a>";
				res.render("message",{title: "VOTACION", message: "Se ha respondido satisfactoriamente" + ext, class: "success", config: this.config});
			break;
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.result = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.findOne(db,"poll",req.params.id);
		
		if(row.private && (req.user==undefined || req.user.roles.indexOf("admin")==-1)){
			throw("Los resultados son privados");
		}
		
		row.config = this.config;
		
		res.render(this.view + "result",row);
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

module.exports = self;
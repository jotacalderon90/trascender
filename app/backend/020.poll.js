"use strict";

const fs = require("fs");

var self = function(a){
	this.dir		= a.dir;
	this.config		= a.config;
	this.helper		= a.helper;
	this.mailing	= a.mailing;
	this.mongodb	= a.mongodb;
	this.render 	= a.render;
}


//@route('/api/poll/total')
//@method(['get'])
//@roles(['admin'])
self.prototype.total = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let total = await this.mongodb.count(db,"poll",query,{},true);
		res.send({data: total});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/poll/collection')
//@method(['get'])
//@roles(['admin'])
self.prototype.collection = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let query = (req.method=="GET")?JSON.parse(req.query.query):(req.method=="POST")?req.body.query:{};
		let options = (req.method=="GET")?JSON.parse(req.query.options):(req.method=="POST")?req.body.options:{};
		let data = await this.mongodb.find(db,"poll",query,options,true);
		res.send({data: data});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/poll')
//@method(['post'])
//@roles(['admin'])
self.prototype.create = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		await this.mongodb.insertOne(db,"poll",req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/poll/:id')
//@method(['get'])
//@roles(['admin'])
self.prototype.read = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		let row = await this.mongodb.findOne(db,"poll",req.params.id,true);
		res.send({data: row});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/poll/:id')
//@method(['put'])
//@roles(['admin'])
self.prototype.update = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		await this.mongodb.updateOne(db,"poll",req.params.id,req.body,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/poll/:id')
//@method(['delete'])
//@roles(['admin'])
self.prototype.delete = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database.url);
		await this.mongodb.deleteOne(db,"poll",req.params.id,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



//@route('/api/poll/start/:id')
//@method(['put'])
//@roles(['admin'])
self.prototype.start = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.config.database.url);
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



//@route('/api/poll/notify/:id/:to')
//@method(['put'])
//@roles(['admin'])
self.prototype.notify = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.config.database.url);
		let row = await this.mongodb.findOne(db,"poll",req.params.id);
		let to = req.params.to;
		let hash = this.helper.toHash(to, row._id.toString());
		
		//doc to mail/template
		let doc = {
			to: to,
			subject: row.title,
			poll: row,
			encode: this.config.properties.host + "/api/poll/" + row._id + "/answer/" + hash
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



//@route('/api/poll/:id/answer/:encode')
//@method(['get','post'])
self.prototype.answer = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.config.database.url);
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
				res.render("poll" + "/" + "poll",{poll: row, action: this.config.properties.host +"/api/poll/" + row._id + "/answer/" + req.params.encode});
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



//@route('/api/poll/:id/answer')
//@method(['get','post'])
self.prototype.answer_anon = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.config.database.url);
		let row = await this.mongodb.findOne(db,"poll",req.params.id);
		
		if(row.status!="Enviada"){
			throw("La votación ya no está disponible");
		}
		
		if(!row.anon){
			throw("La votación no está disponible");
		}
		
		switch(req.method){
			case "GET":
				res.render("poll" + "/" + "poll",{poll: row, action: this.config.properties.host +"/api/poll/" + row._id + "/answer"});
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



//@route('/api/poll/:id/result')
//@method(['get'])
self.prototype.result = async function(req,res){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.config.database.url);
		let row = await this.mongodb.findOne(db,"poll",req.params.id);
		
		if(row.private && (req.user==undefined || req.user.roles.indexOf("admin")==-1)){
			throw("Los resultados son privados");
		}
		
		row.config = this.config;
		
		res.render("poll" + "/" + "result",row);
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/poll')
//@method(['get'])
//@roles(['admin'])
self.prototype.render_ = async function(req,res,next){
	res.render("poll/index");
}



module.exports = self;
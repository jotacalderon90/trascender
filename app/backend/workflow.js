"use strict";

var self = function(application,params){
	
	/***************************************************
	/*params[0] = (required)	url db connection
	/*params[1] = (optional)	path of view
	/****************************************************/
	
	this.config				= application.config;
	this.dir				= application.dir;
	this.url				= application.config.database[params[0]].url;
	this.render				= application.render;
	this.helper				= application.helper;
	this.mongodb			= application.mongodb;
	this.mailing			= application.mailing;
	this.name				= params[1];
	this.view				= ((params[1]!=undefined)?params[1] + "/":"") + "transaction";
	this.setWorkflow(params[1]);
	
	if(application.config.recaptcha && application.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(application.config.recaptcha.public,application.config.recaptcha.private);
		this.recaptcha.render();
	}
	
	this.setMemo = function(doc){
		doc.subject = this.workflow.on[doc.status.toString()].subject;
		doc.text = this.workflow.on[doc.status.toString()].text;
		doc.title = this.workflow.on[doc.status.toString()].title;
		doc.config = this.config;
		return doc;
	}
	
	this.setMemoClient = function(doc){
		doc.to = doc.email;
		doc.bcc = this.config.properties.admin;
		doc.btn = this.workflow.on[doc.status.toString()].btnToClient;
		if(doc.btn!=undefined){
			for(var i=0;i<doc.btn.length;i++){
			doc.btn[i].href = this.config.public.host + "/" + this.name + "/transaction/" + (new Buffer(doc.insertedId).toString("base64"));
			}
		}
		doc.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "" + this.name + ".html", doc);
		return doc;
	}
	
	this.setMemoAdmin = function(doc){
		doc.subject = doc.subject + " [copia al administrador]";
		doc.to = this.config.properties.admin;
		doc.btn = this.workflow.on[doc.status.toString()].btnToAdmin;
		if(doc.btn!=undefined){
			for(var i=0;i<doc.btn.length;i++){
				doc.btn[i].href = this.config.public.host + "/" + this.name + "/transaction/" + (new Buffer(doc.insertedId+":"+doc.insertedId).toString("base64"));
			}
		}
		doc.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "" + this.name + ".html", doc);
		return doc;
	}
}

self.prototype.setWorkflow = async function(name){
	try{
		
		//get document
		let db = await this.mongodb.connect(this.url);
		this.workflow = await this.mongodb.find(db,"workflow",{name: name},{},true);
		this.workflow = this.workflow[0];
		
	}catch(e){
		console.log(e);
	}
}

self.prototype.create = async function(req,res){
	try{

		//valid email
		if(!this.helper.validEMAIL(req.body.email)){ throw("El email ingresado no es válido");}
		
		//recaptcha valid
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}

		//format new document
		let doc = {};
		doc.ip = req.headers["X-Real-IP"] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		doc.email = req.body.email;
		doc.phone = req.body.phone;
		doc.message = "Cliente: " + req.body.message + " <small>" + (new Date()).toISOString() + "</small>";
		doc.product = [];
		doc.total = 0;
		for(let i=0;i<req.body.product.length;i++){
			doc.product.push({
				title: req.body.product[i].title,
				img: req.body.product[i].img,
				price: req.body.product[i].price,
				cant: req.body.product[i].cant,
				total: req.body.product[i].cant * req.body.product[i].price
			});
			doc.total += doc.product[i].total;
		}
		doc.status = 10;
		doc.created = new Date();
		
		//insert document
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.insertOne(db,this.name,doc,true);
		
		//config notification
		doc.insertedId = row.insertedId.toString();
		doc = this.setMemo(doc);
		
		//send notification to client
		doc = this.setMemoClient(doc);
		await this.mailing.send(doc);
		
		//send notification to admin
		doc = this.setMemoAdmin(doc);
		await this.mailing.send(doc);
		
		res.send({data: true});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.read = async function(req,res){
	try{
		//get params
		let params = (new Buffer(req.params.id,"base64")).toString();
		let isadmin = false;
		if(params.indexOf(":")>-1){
			isadmin = true;
			params = params.split(":");
		}else{
			params = [params];
		}
		
		//get document
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.findOne(db,this.name,params[0],true);
		
		//finish
		res.render(this.view,{
			document:	row, 
			title:		this.workflow.on[row.status.toString()].title,
			message:	this.workflow.on[row.status.toString()].message,
			action:		this.config.public.host + "/" + this.name + "/transaction/" + new Buffer((isadmin)?params[0] + ":" + params[0]:params[0]).toString("base64"),
			btn:		this.workflow.on[row.status.toString()][((isadmin)?"btnToAdmin":"btnToClient")],
			config:		this.config
		});
		
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.update = async function(req,res){
	try{
		
		//recaptcha valid
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}
		
		//valid action
		let action = parseInt(req.body.action);
		if(this.workflow.status.indexOf(action)==-1){
			throw("La acción ejecutada no existe");
		}
		
		//get params
		let params = (new Buffer(req.params.id,"base64")).toString();
		let isadmin = false;
		if(params.indexOf(":")>-1){
			isadmin = true;
			params = params.split(":");
		}else{
			params = [params];
		}
		
		//get document
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.findOne(db,this.name,params[0]);
		
		//set document
		row.message = row.message + "<br>" + ((isadmin)?"Administrador":"Cliente") + ": " + req.body.message + " <small>" + (new Date()).toISOString() + "</small>";
		row.status = action;
		
		//cache on update
		let insertedId = row._id;
		
		//update
		await this.mongodb.updateOne(db,this.name,params[0],row,true);
		
		//config notification
		row.insertedId = params[0];
		row = this.setMemo(row);
		
		//send notification to client
		row = this.setMemoClient(row);
		await this.mailing.send(row);
		
		//send notification to admin
		row = this.setMemoAdmin(row);
		await this.mailing.send(row);
		
		//finish
		res.render(this.view,{
			document:	row, 
			title:		this.workflow.on[row.status.toString()].title,
			message:	this.workflow.on[row.status.toString()].message,
			action:		this.config.public.host + "/" + this.name + "/transaction/" + new Buffer((isadmin)?params[0] + ":" + params[0]:params[0]).toString("base64"),
			btn:		this.workflow.on[row.status.toString()][((isadmin)?"btnToAdmin":"btnToClient")],
			config:		this.config
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

module.exports = self;
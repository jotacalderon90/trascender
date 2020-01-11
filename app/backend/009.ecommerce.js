"use strict";

const fs = require("fs");

let self = function(application,params){
	this.url				= application.config.database.url;
	this.config				= application.config;
	this.dir				= application.dir;
	this.render				= application.render;
	this.helper				= application.helper;
	this.mongodb			= application.mongodb;
	this.mailing			= application.mailing;
	this.collection_name	= "product";
	this.view_doc			= "product/document";
	this.view_coll			= "product/collection";
	this.match				= "uri";
	this.sort				= {title: 1};
	
	//ECOMMERCE
	this.name				= "ecommerce";
	this.view				= this.name + "/transaction";
	this.setWorkflow(this.name);
	
	if(application.config.recaptcha && application.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(application.config.recaptcha.public,application.config.recaptcha.private);
		this.recaptcha.render();
	}
	
}



//@route('/product')
//@method(['get'])
self.prototype.renderCollection = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let title = (req.params.id)?req.params.id:collection;
		let query = (req.params.id)?{tag: req.params.id}:{};
		let options = {};
		options.limit = 10;
		options.sort = this.sort;
		let db = await this.mongodb.connect(this.url);
		let data = await this.mongodb.find(db,collection,query,options,true);
		res.render(this.view_coll,{
			title: title.charAt(0).toUpperCase() + title.slice(1),
			rows: data,
			config: this.config
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/product/categoria/:id')
//@method(['get'])
self.prototype.renderCollectionTag = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let title = (req.params.id)?req.params.id:collection;
		let query = (req.params.id)?{tag: req.params.id}:{};
		let options = {};
		options.limit = 10;
		options.sort = this.sort;
		let db = await this.mongodb.connect(this.url);
		let data = await this.mongodb.find(db,collection,query,options,true);
		res.render(this.view_coll,{
			title: title.charAt(0).toUpperCase() + title.slice(1),
			rows: data,
			config: this.config
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/product/:id')
//@method(['get'])
self.prototype.renderDocument = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let query = {};
		query[this.match] = req.params.id;		
		let db = await this.mongodb.connect(this.url);
		let data = await this.mongodb.find(db,collection,query,{},true);
		if(data.length!=1){
			throw("No se encontró el documento solicitado");
		}
		res.render(this.view_doc,{
			row: data[0],
			config: this.config
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/api/product/total')
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



//@route('/api/product/collection')
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



//@route('/api/product/tag/collection')
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



//@route('/api/product/:id')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		let row = await this.mongodb.findOne(db,collection,req.params.id,true);
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
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		await this.mongodb.insertOne(db,collection,req.body,true);
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
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		await this.mongodb.updateOne(db,collection,req.params.id,req.body,true);
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
		let collection = (this.collection_name!=undefined)?this.collection_name:req.params.name;
		let db = await this.mongodb.connect(this.url);
		await this.mongodb.deleteOne(db,collection,req.params.id,true);
		res.send({data: true});
	}catch(e){
		res.send({data: null,error: e.toString()});
	}
}



/*ECOMMERCE*/
self.prototype.setMemo = function(doc){
	doc.subject = this.workflow.on[doc.status.toString()].subject;
	doc.text = this.workflow.on[doc.status.toString()].text;
	doc.title = this.workflow.on[doc.status.toString()].title;
	doc.config = this.config;
	return doc;
}
	
self.prototype.setMemoClient = function(doc){
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
	
self.prototype.setMemoAdmin = function(doc){
	doc.subject = doc.subject + " [copia al administrador]";
	doc.to = this.config.properties.admin;
	doc.btn = this.workflow.on[doc.status.toString()].btnToAdmin;
	if(doc.btn!=undefined){
		for(var i=0;i<doc.btn.length;i++){
			doc.btn[i].href = this.config.properties.host + "/" + this.name + "/transaction/" + (new Buffer(doc.insertedId+":"+doc.insertedId).toString("base64"));
		}
	}
	doc.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "" + this.name + ".html", doc);
	return doc;
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



//@route('/ecommerce/transaction')
//@method(['post'])
self.prototype.ecommerce_create = async function(req,res){
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



//@route('/ecommerce/transaction/:id')
//@method(['get'])
self.prototype.ecommerce_read = async function(req,res){
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
			action:		this.config.properties.host + "/" + this.name + "/transaction/" + new Buffer((isadmin)?params[0] + ":" + params[0]:params[0]).toString("base64"),
			btn:		this.workflow.on[row.status.toString()][((isadmin)?"btnToAdmin":"btnToClient")],
			config:		this.config
		});
		
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/ecommerce/transaction/:id')
//@method(['post'])
self.prototype.ecommerce_update = async function(req,res){
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
			action:		this.config.properties.host + "/" + this.name + "/transaction/" + new Buffer((isadmin)?params[0] + ":" + params[0]:params[0]).toString("base64"),
			btn:		this.workflow.on[row.status.toString()][((isadmin)?"btnToAdmin":"btnToClient")],
			config:		this.config
		});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}



//@route('/ecommerce/:id')
//@method(['get'])
self.prototype.render_ = async function(req,res){
	try{
		var v = this.name + "/" + req.params.id;
		if(!fs.existsSync(this.dir + this.config.properties.views + v + ".html")){
			throw("URL no encontrada");
		}
		res.render(v,{config: this.config});
	}catch(e){
		res.status(404).render("message",{title: "Error 404", message: e.toString(), error: 404, class: "danger"});
	}
}



module.exports = self;
"use strict";

var self = function(application,params){
	
	/******************************************
	/*params[0] = (required) url db connection
	/*params[1] = (optional) path of view
	/*****************************************/
	
	this.dir		= application.dir;
	this.config		= application.config;
	this.url		= application.config.database[params[0]].url;
	this.mongodb	= application.mongodb;
	this.render 	= application.render;
	this.helper		= application.helper;
	this.mailing	= application.mailing;
	this.auth		= application.auth;
	this.view		= (params[1]!=undefined)?params[1] + "/":"";
	
	if(this.config.recaptcha && this.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(this.config.recaptcha.public,this.config.recaptcha.private);
		this.recaptcha.render();
	}
	
	if(application.config.google && application.config.google.auth && application.config.google.auth.clientId && application.config.google.auth.clientId!=""){
		this.google = application.google;
		this.config.public.google_url = this.google.getURL();
	}
}

self.prototype.subscriber = async function(req,res){
	try{
		
		req.body.email = req.body.email.toLowerCase();
		
		//valid email
		if(!this.helper.validEMAIL(req.body.email)){ throw("El email ingresado no es válido");}
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		//valid unique user email
		let ce = await this.mongodb.count(db,"user",{email: req.body.email},{});
		if(ce!=0){
			throw("El email ingresado ya está registrado");
		}
		
		//create user document
		let doc = {};
		doc.email = req.body.email;
		doc.hash = this.helper.random(10);
		doc.password = this.helper.toHash("123456" + req.body.email,doc.hash);
		doc.nickname = req.body.email;
		doc.notification = true;
		doc.thumb = this.config.public.host + "/media/img/user.png";
		doc.roles = ["user"];
		doc.created = new Date;
		
		//insert document
		await this.mongodb.insertOne(db,"user",doc,true);
		
		//create memo document
		let memo = {};
		memo.to = doc.email;
		memo.bcc = this.config.properties.admin;
		memo.subject = "Activación de cuenta"
		memo.nickname = doc.nickname;
		memo.hash = this.config.public.host + "/" + this.view + "activate/" + new Buffer(doc.password).toString("base64");
		memo.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "activate_account.html", memo);
		memo.config = this.config;
		
		//send memo
		await this.mailing.send(memo);
		
		//finish
		res.render("message",{title: "Usuario registrado", message: "Se ha enviado un correo para validar su registro", class: "success", config: this.config});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.create = async function(req,res){
	try{
		
		if(this.recaptcha!=undefined){
			await this.helper.recaptcha(this.recaptcha,req);
		}
		
		req.body.email = req.body.email.toLowerCase();
		
		//valid email
		if(!this.helper.validEMAIL(req.body.email)){ throw("El email ingresado no es válido");}
		
		//valid password
		if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){ throw("La contraseña ingresada debe tener al menos 5 caracteres");}
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		//valid unique user email
		let ce = await this.mongodb.count(db,"user",{email: req.body.email},{});
		if(ce!=0){
			throw("El email ingresado ya está registrado");
		}
		
		//create user document
		let doc = {};
		doc.email = req.body.email;
		doc.hash = this.helper.random(10);
		doc.password = this.helper.toHash(req.body.password + req.body.email,doc.hash);
		doc.nickname = req.body.email;
		doc.notification = true;
		doc.thumb = this.config.public.host + "/media/img/user.png";
		doc.roles = ["user"];
		doc.created = new Date;
		
		//insert document
		await this.mongodb.insertOne(db,"user",doc,true);
		
		//create memo document
		let memo = {};
		memo.to = doc.email;
		memo.bcc = this.config.properties.admin;
		memo.subject = "Activación de cuenta"
		memo.nickname = doc.nickname;
		memo.hash = this.config.public.host + "/" + this.view + "activate/" + new Buffer(doc.password).toString("base64");
		memo.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "activate_account.html", memo);
		memo.config = this.config;
		
		//send memo
		await this.mailing.send(memo);
		
		//finish
		res.render("message",{title: "Usuario registrado", message: "Se ha enviado un correo para validar su registro", class: "success", config: this.config});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.activate = async function(req,res){
	try{
		
		//get hash params
		let hash = new Buffer(req.params.hash, "base64").toString("ascii");
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		//get document whit hash password
		let row = await this.mongodb.find(db,"user",{password: hash},{});
		if(row.length!=1){
			throw("se ha encontrado más de un usuario asociado a este hash");
		}
		
		//update activation field
		row[0].activate = true;
		await this.mongodb.updateOne(db,"user",row[0]._id,row[0],true);
		
		//finish
		res.render("message",{title: "Usuario activado", message: "Se ha completado su registro correctamente", class: "success", config: this.config});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.desactivate = async function(req,res){
	try{
		
		//get hash params
		let hash = new Buffer(req.params.hash, "base64").toString("ascii");
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		//get document whit hash password
		let row = await this.mongodb.find(db,"user",{password: hash},{});
		if(row.length!=1){
			throw("se ha encontrado más de un usuario asociado a este hash");
		}
		
		//update activation field
		row[0].activate = null;
		await this.mongodb.updateOne(db,"user",row[0]._id,row[0],true);
		
		//finish
		res.render("message",{title: "Usuario desactivado", message: "Se ha completado su desactivación correctamente", class: "success", config: this.config});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.login = async function(req,res){
	try{
		switch(req.method){
			case "GET":
				res.render(this.view + "login", {config: this.config});
				break;
			case "POST":
						
				//valid recaptcha
				if(this.recaptcha!=undefined){
					await this.helper.recaptcha(this.recaptcha,req);
				}
				
				//connect to mongo
				let db = await this.mongodb.connect(this.url);
				
				req.body.email = req.body.email.toLowerCase();
				
				//get user by email
				let rows = await this.mongodb.find(db,"user",{email: req.body.email, activate: true},{});
				if(rows.length!=1){
					throw("No se ha encontrado el usuario asociado");
				}
				
				//valid password
				if(this.helper.toHash(req.body.password+req.body.email,rows[0].hash) != rows[0].password){
					throw("Los datos ingresados no corresponden");
				}
				
				//set Authorization token
				res.cookie("Authorization",this.auth.encode(rows[0]));
				
				//update active_user in dbmongo
				let active = await this.mongodb.find(db,"user_active",{user_id: rows[0]._id.toString()},{});
				if(active.length!=1){
					await this.mongodb.insertOne(db,"user_active",{user_id: rows[0]._id.toString(), email: rows[0].email, date: new Date()},true);
				}
				
				//finish
				if(req.session.redirectTo){
					res.redirect(req.session.redirectTo);
				}else{
					res.redirect("/" + this.view + "info");
				}
				
				break;
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.login_google = async function(req,res){
	try{
		
		//get user google info
		let user = await this.google.getUserInfo(req.query.code);
		
		if(user==null){
			throw(this.google.error);
		}
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		console.log("usuario google:");
		console.log(user);
		
		//get user by email
		let row = await this.mongodb.find(db,"user",{email: user.emails[0].value},{});
		if(row.length!=1){
			
			//new user
			row = {};
			row.email = user.emails[0].value;
			row.hash = this.helper.random(10);
			row.password = this.helper.toHash(row.hash + user.emails[0].value,row.hash);
			row.nickname = user.displayName;
			row.notification = true;
			row.thumb = user.image.url;
			row.roles = ["user"];
			row.created = new Date;
			row.activate = true
			row.google = user;
			
			//insert document
			await this.mongodb.insertOne(db,"user",row);
			
			//get inserted
			row = await this.mongodb.find(db,"user",{email: user.emails[0].value},{});
			
		}else{
			
			//old user
			let updated = {
				$set: {
					nickname: user.displayName,
					thumb: user.image.url,
					google: user
				}
			};
			
			//update mongo user
			row = row[0];
			await this.mongodb.updateOne(db,"user",row._id,updated);
		}
		
		//set Authorization token
		res.cookie("Authorization",this.auth.encode(row));
		
		//update active_user in dbmongo
		let active = await this.mongodb.find(db,"user_active",{user_id: row._id.toString()},{});
		if(active.length!=1){
			await this.mongodb.insertOne(db,"user_active",{user_id: row._id.toString(), email: row.email, date: new Date()},true);
		}
		
		//finish
		if(req.session.redirectTo){
			res.redirect(req.session.redirectTo);
		}else{
			res.redirect("/" + this.view + "info");
		}
		
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.logout = async function(req,res){
	try{
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		//get user
		let user = await this.mongodb.find(db,"user_active",{user_id: req.user.sub},{});
		if(user.length==1){
			
			//remove from active_user
			await this.mongodb.deleteOne(db,"user_active",user[0]._id,true);
			
		}
		
		//delete from server
		req.session.destroy();
		
		//finish
		res.render(this.view + "login", {config: this.config});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.info = async function(req,res){
	try{
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		//get user
		let user = await this.mongodb.findOne(db,"user",req.user.sub,true);
		
		//finish
		res.render(this.view + "info",{user: user, config: this.config});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.read = async function(req,res){
	try{
		
		if(req.user==null){
			throw("empty");
		}
		if(req.user.error){
			throw(req.user.error);
		}
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		//get user
		let user = await this.mongodb.findOne(db,"user",req.user.sub);
		
		//get active user
		let active = await this.mongodb.find(db,"user_active",{user_id: req.user.sub},{},true);
		if(active.length==0){
			throw("empty");
		}
		
		//finish
		res.send({data: user});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.update = async function(req,res){
	try{
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		//get user
		let user = await this.mongodb.findOne(db,"user",req.user.sub);
		
		//set user document
		let updated = {
			$set: {
				nickname: req.body.nickname,
				thumb: req.body.thumb,
				notification: req.body.notification
			}
		};
		
		let redirect = "/" + this.view + "info";
		
		//password update
		if(!user.google && req.body.password!=user.password){
			if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){
				throw("La contraseña ingresada debe tener al menos 5 caracteres");
			}
			updated["$set"]["password"] = this.helper.toHash(req.body.password + user.email,user.hash);
			redirect = "/" + this.view + "logout";
		}
		
		//update mongo user
		await this.mongodb.updateOne(db,"user",user._id,updated,true);
		
		res.redirect(redirect);
		
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.update_ext = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.url);
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

self.prototype.forget = async function(req,res){
	try{
		switch(req.method){
			case "GET":
				res.render(this.view + "forget", {config: this.config});
			break;
			case "POST":
			
				//valid recaptcha
				if(this.recaptcha!=undefined){
					await this.helper.recaptcha(this.recaptcha,req);
				}
				
				//connect to mongo
				let db = await this.mongodb.connect(this.url);
				
				req.body.email = req.body.email.toLowerCase();
				
				//valid registred user
				let user = await this.mongodb.find(db,"user",{email: req.body.email},{});
				if(user.length!=1){
					console.log(user);
					throw("No se encontró usuario asociado al email " + req.body.email);
				}
				
				//create memo document
				let memo = {};
				memo.to = req.body.email;
				memo.bcc = this.config.properties.admin;
				memo.subject = "Reestablecer contraseña";
				memo.hash = this.config.public.host + "/" + this.view + "recovery/" + new Buffer(user[0].password).toString("base64");
				memo.html = this.render.processTemplateByPath(this.dir + this.config.properties.mailing + "recovery_account.html", memo);
				memo.config = this.config;
		
				//send memo
				await this.mailing.send(memo);
				
				//finish
				res.render("message",{title: "Recuperación de cuenta", message: "Se ha enviado un correo para poder reestablecer su contraseña", class: "success", config: this.config});
			break;
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.recovery = async function(req,res){
	try{
		switch(req.method){
			case "GET":
				res.render(this.view + "recovery", {hash: req.params.hash, config: this.config});
			break;
			case "POST":
				
				//valid recaptcha
				if(this.recaptcha!=undefined){
					await this.helper.recaptcha(this.recaptcha,req);
				}
				
				//connect to mongo
				let db = await this.mongodb.connect(this.url);
				
				//get registred user
				let user = await this.mongodb.find(db,"user",{password:  new Buffer(req.body.hash,"base64").toString("ascii")},{});
				if(user.length!=1){
					console.log(user);
					throw("No se encontró usuario asociado");
				}
						
				//set user document
				let updated = {
					$set: {
						password: this.helper.toHash(req.body.password + user[0].email,user[0].hash)
					}
				};
				
				//update mongo user
				await this.mongodb.updateOne(db,"user",user[0]._id,updated,true);
				
				//finish
				res.render("message",{title: "Actualización de contraseña", message: "Se ha actualizaco la contraseña correctamente", class: "success", config: this.config});
			break;
		}
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

self.prototype.public = async function(req,res){
	try{
		
		//connect to mongo
		let db = await this.mongodb.connect(this.url);
		
		//get user
		let user = await this.mongodb.findOne(db,"user",req.params.id,true);
		
		//finish
		res.send({data: {
			nickname: user.nickname,
			thumb: user.thumb
		}});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

module.exports = self;
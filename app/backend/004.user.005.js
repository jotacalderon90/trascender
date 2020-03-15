"use strict";

var self = function(a){
	this.dir = a.dir;
	this.config = a.config;
	this.auth = a.auth;
	this.helper = a.helper;
	this.mailing = a.mailing;
	this.mongodb = a.mongodb;
	this.render = a.render;
	
	if(this.config.recaptcha && this.config.recaptcha.enabled===true){
		this.recaptcha = require("express-recaptcha");
		this.recaptcha.init(this.config.recaptcha.public,this.config.recaptcha.private);
		this.recaptcha.render();
	}
	
	this.google_url = "";
	if(this.config.google && this.config.google.auth && this.config.google.auth.enabled){
		this.google = a.google;
		this.google_url = this.google.getURL();
	}
}



//@route('/user')
//@method(['get','post'])
self.prototype.create = async function(req,res){
	try{
		switch(req.method.toLowerCase()){
			case "get":
				res.render("user/new",{google_url: this.google_url});
			break;
			case "post":
				req.body.email = req.body.email.toLowerCase();
				if(!this.helper.isEmail(req.body.email)){
					throw("El email ingresado no es válido");
				}else{
					if(!req.body.xhr){
						if(this.recaptcha!=undefined){
							await this.helper.recaptcha(this.recaptcha,req);
						}
					}
					if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){ 
						throw("La contraseña ingresada debe tener al menos 5 caracteres");
					}else{
						let db = await this.mongodb.connect(this.config.database);
						let ce = await this.mongodb.count(db,"user",{email: req.body.email},{});
						if(ce!=0){
							throw("El email ingresado ya está registrado");
						}else{
							let doc = {};
							doc.email = req.body.email;
							doc.hash = this.helper.random(10);
							doc.password = this.helper.toHash(req.body.password + req.body.email,doc.hash);
							doc.nickname = req.body.email;
							doc.notification = true;
							doc.thumb = "/media/img/user.png";
							doc.roles = ["user"];
							doc.created = new Date;
							doc.activate = (this.config.smtp.enabled)?false:true;
							await this.mongodb.insertOne(db,"user",doc,true);
							if(this.config.smtp.enabled===true){
								let memo = {};
								memo.to = doc.email;
								memo.subject = "Activación de cuenta"
								memo.nickname = doc.nickname;
								memo.hash = this.config.properties.host + "/api/user/activate/" + new Buffer(doc.password).toString("base64");
								memo.html = this.render.processTemplateByPath(this.dir + this.config.properties.views + "mailing/template_activate.html", memo);
								await this.mailing.send(memo);
								if(req.body.xhr){
									res.send({data: true});
								}else{
									res.render("message",{title: "Usuario registrado", message: "Se ha enviado un correo para validar su registro", class: "success"});
								}
							}else{
								res.render("message",{title: "Usuario registrado", message: "Se ha completado su registro correctamente", class: "success"});
							}
						}
					}
				}
			break;
		}
	}catch(e){
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



//@route('/user/login')
//@method(['get','post'])
self.prototype.login = async function(req,res){
	try{
		switch(req.method.toLowerCase()){
			case "get":
				res.render("user/login",{google_url: this.google_url});
			break;
			case "post":
				if(!req.body.xhr){
					if(this.recaptcha!=undefined){
						await this.helper.recaptcha(this.recaptcha,req);
					}
				}
				req.body.email = req.body.email.toLowerCase();
				let db = await this.mongodb.connect(this.config.database);
				let rows = await this.mongodb.find(db,"user",{email: req.body.email, activate: true},{});
				if(rows.length!=1){
					throw("Los datos ingresados no corresponden");
				}else{
					if(this.helper.toHash(req.body.password+req.body.email,rows[0].hash) != rows[0].password){
						throw("Los datos ingresados no corresponden");
					}else{
						let cookie = this.auth.encode(rows[0]);
						res.cookie("Authorization",cookie);
						let active = await this.mongodb.find(db,"user_active",{user_id: rows[0]._id.toString()},{});
						if(active.length!=1){
							await this.mongodb.insertOne(db,"user_active",{user_id: rows[0]._id.toString(), email: rows[0].email, date: new Date()},true);
						}
						if(req.body.xhr){
							res.send({data: true, ext: {cookie: cookie}});
						}else if(req.session.redirectTo){
							res.redirect(req.session.redirectTo);
						}else{
							res.redirect("/user/info");
						}
					}
				}
			break;
		}
	}catch(e){
		console.error(e);
		if(req.body.xhr){
			res.send({data: null, error: e.toString()});
		}else{
			res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
		}
	}
}



//@route('/user/info')
//@method(['get'])
//@roles(['user'])
self.prototype.info = async function(req,res){
	try{
		res.render("user/info",{user: req.user});
	}catch(e){
		console.log(e);
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
	}
}



//@route('/user/update')
//@method(['post'])
//@roles(['user'])
self.prototype.update = async function(req,res){
	try{
		let updated = {
			$set: {
				nickname: req.body.nickname,
				thumb: req.body.thumb,
				notification: req.body.notification
			}
		};
		let redirect = "/user/info";
		if(!req.user.google && req.body.password!=req.user.password){
			if(req.body.password==undefined || req.body.password==null || req.body.password.length < 5){
				throw("La contraseña ingresada debe tener al menos 5 caracteres");
			}else{
				updated["$set"]["password"] = this.helper.toHash(req.body.password + req.user.email,req.user.hash);
				redirect = "/user/logout";
			}
		}
		let db = await this.mongodb.connect(this.config.database);
		await this.mongodb.updateOne(db,"user",req.user._id,updated,true);
		if(req.body.xhr){
			res.send({data: true, ext: {redirect: redirect}});
		}else{
			res.redirect(redirect);
		}
	}catch(e){
		console.log(e);
		if(req.body.xhr){
			res.send({data: null, error: e.toString()});
		}else{
			res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
		}
	}
}



//@route('/user/logout')
//@method(['get'])
//@roles(['user'])
self.prototype.logout = async function(req,res){
	try{
		let db = await this.mongodb.connect(this.config.database);
		let user = await this.mongodb.find(db,"user_active",{user_id: req.user._id.toString()});
		if(user.length==1){
			await this.mongodb.deleteOne(db,"user_active",user[0]._id,true);
		}
		req.session.destroy();
		if(req.query.xhr){
			res.send({data: true});
		}else{
			res.render("user/login");
		}
	}catch(e){
		console.log(e);
		if(req.query.xhr){
			res.send({data: null, error: e.toString()});
		}else{
			res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
		}
	}
}



//@route('/user/forget')
//@method(['get','post'])
self.prototype.forget = async function(req,res){
	try{
		switch(req.method.toLowerCase()){
			case "get":
				res.render("user/forget");
			break;
			case "post":
				if(!req.body.xhr){
					if(this.recaptcha!=undefined){
						await this.helper.recaptcha(this.recaptcha,req);
					}
				}
				let db = await this.mongodb.connect(this.config.database);
				req.body.email = req.body.email.toLowerCase();
				let user = await this.mongodb.find(db,"user",{email: req.body.email},{});
				if(user.length!=1){
					throw("Los datos ingresados no corresponden");
				}else{
					let memo = {};
					memo.to = req.body.email;
					memo.bcc = this.config.properties.admin;
					memo.subject = "Reestablecer contraseña";
					memo.hash = this.config.properties.host + "/user/recovery?hash=" + new Buffer(user[0].password).toString("base64");
					memo.html = this.render.processTemplateByPath(this.dir + this.config.properties.views + "mailing/template_recovery.html", memo);
					await this.mailing.send(memo);
					if(req.body.xhr){
						res.send({data: true});
					}else{
						res.render("message",{title: "Recuperación de cuenta", message: "Se ha enviado un correo para poder reestablecer su contraseña", class: "success"});
					}
				}
			break;
		}
	}catch(e){
		console.log(e);
		if(req.query.xhr){
			res.send({data: null, error: e.toString()});
		}else{
			res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
		}
	}
}



//@route('/user/recovery')
//@method(['get','post'])
self.prototype.recovery = async function(req,res){
	try{
		switch(req.method.toLowerCase()){
			case "get":
				res.render("user/recovery",{hash: req.query.hash});
			break;
			case "post":
				if(!req.body.xhr){
					if(this.recaptcha!=undefined){
						await this.helper.recaptcha(this.recaptcha,req);
					}
				}
				let db = await this.mongodb.connect(this.config.database);
				let user = await this.mongodb.find(db,"user",{password:  new Buffer(req.body.hash,"base64").toString("ascii")},{});
				if(user.length!=1){
					throw("Los datos ingresados no corresponden");
				}else{
					let updated = {$set: {password: this.helper.toHash(req.body.password + user[0].email,user[0].hash)}};
					await this.mongodb.updateOne(db,"user",user[0]._id,updated,true);
					if(req.body.xhr){
						res.send({data: true});
					}else{
						res.render("message",{title: "Actualización de contraseña", message: "Se ha actualizaco la contraseña correctamente", class: "success"});
					}
				}
			break;
		}
	}catch(e){
		console.log(e);
		if(req.query.xhr){
			res.send({data: null, error: e.toString()});
		}else{
			res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
		}
	}
}



//@route('/user/auth/google')
//@method(['get'])
self.prototype.google_url = async function(req,res){
	res.send({data: this.google_url});
}



//@route('/user/auth/google/callback')
//@method(['get'])
self.prototype.google_login = async function(req,res){
	try{
		let user = await this.google.getUserInfo(req.query.code);
		if(user==null){
			throw(this.google.error);
		}else{
			let db = await this.mongodb.connect(this.config.database);
			let row = await this.mongodb.find(db,"user",{email: user.emails[0].value},{});
			if(row.length!=1){
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
				await this.mongodb.insertOne(db,"user",row);
				row = await this.mongodb.find(db,"user",{email: user.emails[0].value},{});
			}else{
				let updated = {
					$set: {
						nickname: user.displayName,
						thumb: user.image.url,
						google: user
					}
				};
				row = row[0];
				await this.mongodb.updateOne(db,"user",row._id,updated);
			}
			let cookie = this.auth.encode(row);
			res.cookie("Authorization",cookie);
			let active = await this.mongodb.find(db,"user_active",{user_id: row._id.toString()},{});
			if(active.length!=1){
				await this.mongodb.insertOne(db,"user_active",{user_id: row._id.toString(), email: row.email, date: new Date()},true);
			}
			if(req.body.xhr){
				res.send({data: true, ext: {cookie: cookie, redirect: ((req.session.redirectTo)?req.session.redirectTo:"/user/info")}});
			}else if(req.session.redirectTo){
				res.redirect(req.session.redirectTo);
			}else{
				res.redirect("/user/info");
			}
		}
	}catch(e){
		console.log(e);
		if(req.query.xhr){
			res.send({data: null, error: e.toString()});
		}else{
			res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger"});
		}
	}
}



//@route('/api/user')
//@method(['get'])
self.prototype.read = async function(req,res){
	try{
		if(req.user==undefined){
			throw("empty");
		}else{
			res.send({data: req.user});
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
		let db = await this.mongodb.connect(this.config.database);
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
		let db = await this.mongodb.connect(this.config.database);
		let enabled = ["lmap","public","jv","interest","location","twitter"];
		let fields = {};
		for(let attr in req.body){
			if(enabled.indexOf(attr)>-1){
				fields[attr] = req.body[attr];
			}
		}
		let updated = {$set: fields};
		await this.mongodb.updateOne(db,"user",req.user._id,updated,true);
		res.send({data: true});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e});
	}
}



module.exports = self;



/*
******versions******
001:
	methods:create/login/info/update/logout
	description: workflow basico para autenticar usuarios
002:
	methods:forget/recovery
	description: workflow para recuperar contraseña
003:
	methods:google_url/google_login
	description: workflow para autenticar por google
004:
	methods: read/public/updateext
	descripcion: metodos de uso generico
005:
	methods: all
	description: se habilita ajax para workflows para apps
*/

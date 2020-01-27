console.log(new Date() + " == iniciando aplicacion");

//importar librerias externas
console.log(new Date() + " == importando fs");
const fs			= require("fs");
console.log(new Date() + " == importando path");
const path			= require("path");
console.log(new Date() + " == importando express");
const express		= require("express");
console.log(new Date() + " == importando body-parser");
const bodyParser	= require("body-parser");
console.log(new Date() + " == importando cookie-parser");
const cookieParser	= require("cookie-parser");
console.log(new Date() + " == importando express-session");
const session		= require("express-session");
console.log(new Date() + " == importando express-fileupload");
const upload		= require('express-fileupload');
console.log(new Date() + " == importando helmet");
const helmet 		= require("helmet");
console.log(new Date() + " == importando http");
const http			= require("http");
console.log(new Date() + " == importando trascender.router");
const router 		= require("trascender.router");
console.log(new Date() + " == importando trascender.render");
const render 		= require("trascender.render");
			
//kernel/core/motor del sistema trascender
let trascender = function(){
	try{
		
		//configurar estandar de aplicacion web/nodejs/express/trascender
		if(true){
			console.log(new Date() + " == configurando aplicacion");
			this.express = express();
			this.express.use(bodyParser.json({limit: "50mb"})); 
			this.express.use(bodyParser.urlencoded({extended: true}));
			this.express.use(cookieParser());
			this.express.use(session({secret: (new Date()).toISOString(), resave: false, saveUninitialized: false}));
			this.express.use(upload());
			this.express.use(helmet());
			
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			
			this.dir		= __dirname;
			this.config		= JSON.parse(fs.readFileSync("./app.json","utf8"));
			this.config.properties.views = "/app/frontend/html/";
			this.config.properties.mailing = "/app/frontend/html/mailing/templates_back/";
			
			this.server		= http.Server(this.express);
			
			this.render = new render(this, __dirname + "/app/frontend/html/");
			
			let libs = fs.readdirSync("./app/backend/lib","utf8").filter(function(row){
				return fs.statSync(path.join("./app/backend/lib",row)).isFile();
			});
			
			for(let i=0;i<libs.length;i++){
				let l = libs[i].replace(".js","");
				console.log(new Date() + " == instanciando libreria " + l);
				this[l]	= new(require("./app/backend/lib/" + l))(this);
			}
			
			if(this.config.properties.cors===true){
				let cors = require("cors");
				this.express.use(cors());
			}
		}
		
		//definir funciones internas propias de trascender
		if(true){
					
			//primera funcion a ejecutar para peticion http - obtener ip
			this.express.use(function(req,res,next){
				req.real_ip = (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
				next();
			});
			
			//segunda funcion a ejecutar para peticion http - decodifica usuario
			this.express.use((req,res,next)=>{
				try{
					req.user = null;
					if(req.method.toLowerCase()=="get" && req.query.Authorization && req.query.Authorization!=""){
						let token = this.auth.decode(req.query.Authorization);
						req.user = (token==null)?{error: this.auth.error.toString()}:token;
					}else if(req.method.toLowerCase()=="post" && req.body.Authorization && req.body.Authorization!=""){
						let token = this.auth.decode(req.body.Authorization);
						req.user = (token==null)?{error: this.auth.error.toString()}:token;
					}else if(req.headers && req.headers.cookie){
						let cookies = req.headers.cookie.split(";");
						for(let i=0;i<cookies.length;i++){
							if(cookies[i].indexOf("Authorization=")>-1){
								let token = this.auth.decode(cookies[i].split("=")[1]);
								req.user = (token==null)?{error: this.auth.error.toString()}:token;
							}
						}
					}
				}catch(e){
					console.log(e);
				}
				return next();
			});
			
			//tercera funcion a ejecutar para peticion http - registra llamada
			this.express.use((req,res,next)=>{
				req.created = new Date();
				let content = "\n" + req.created.toISOString() + ";" + req.real_ip + ";" + req.originalUrl + ";" + req.method + ";" + JSON.stringify(req.body);
				console.log(content);
				fs.appendFile("./log.csv", content, function (err) {});
				this.log.create(req);
				return next();
			});
			
			let mdbs = this.config.database.url;
			const mongodb = this.mongodb;
			this.hasRole = function(roles){
				return async function(req,res,next){
					try{
						if(roles==undefined || roles.length==0){
							return next();
						}else{
							if(req.user==undefined){
								throw("Acción restringida");
							}
							if(req.user.error){
								throw(req.user.error);
							}
							
							//validar "usuario activo"
							let db = await mongodb.connect(mdbs);
							let active = await mongodb.find(db,"user_active",{user_id: req.user.sub},{},true);
							if(active.length==0){
								throw("Acción restringida");
							}
							
							for(let i=0;i<roles.length;i++){
								if(req.user.roles.indexOf(roles[i])>-1){
									return next();
								}
							}
							throw("Acción restringida");
						}
					}catch(e){
						if(req.url.indexOf("/api/")==-1){
							req.session.redirectTo = req.url;
						}
						res.status(401).render("message",{title: "Error 401", message: e.toString(), error: 401, class: "danger"});
					}
				}
			}
			
			this.getFile = function(file){
				return function(req,res){
					res.sendFile(file);
				};
			}
			
			this.getRedirect = function(to){
				return function(req,res){
					res.redirect(to);
				};
			}
			
			this.getAPI = function(api,method){
				return function(req,res,next){
					api[method](req,res,next);
				}
			}
			
		}
		
		//levantar aplicación solicitada
		if(true){
			
			//publicar archivos
			console.log(new Date() + " == publicando archivos");
			this.express.get("/favicon.ico", this.hasRole([]), this.getFile(this.dir + "/app/frontend/media/img/favicon.ico"));
			this.express.get("/robots.txt", this.hasRole([]), this.getFile(this.dir + "/app/frontend/media/doc/robots.txt"));
			if(this.config.files){
				for(let i=0;i<this.config.files.length;i++){
					this.express.get(this.config.files[i].uri, this.hasRole(this.config.files[i].roles), this.getFile(this.dir + this.config.files[i].src));
				}
			}
				
			//publicar carpetas
			console.log(new Date() + " == publicando carpetas");
			this.express.use("/", this.hasRole([]), express.static(this.dir + "/app/frontend"));
			if(this.config.folders){
				for(let i=0;i<this.config.folders.length;i++){
					this.express.use(this.config.folders[i].uri, this.hasRole(this.config.folders[i].roles), express.static(this.dir + this.config.folders[i].src));
				}
			}
				
			//importar router
			new router(this,__dirname + "/app/backend");
			
			//publicar redireccionamientos
			if(this.config.redirect){
				for(let i=0;i<this.config.redirect.length;i++){
					console.log(new Date() + " == publicando redireccionamientos");
					this.express.use(this.config.redirect[i].from, this.hasRole(this.config.redirect[i].roles), this.getRedirect(this.config.redirect[i].to));
				}
			}
			
			//publicar error 404
			this.express.use(function(req,res,next){
				console.log(new Date() + " == publicando error 404");
				res.status(404).render("message",{title: "Error 404", message: "URL no encontrada", error: 404, class: "danger"});
			});
			
			this.log.mongodb = this.mongodb;
			
			//iniciar aplicacion
			let port = this.config.properties.port;
			console.log(new Date() + " == abriendo puerto");
			this.server.listen(port, function(){
				console.log("app started in port " + port);
			});
			
		}
	
	}catch(e){
		console.log("ERROR AL LEVANTAR SISTEMA TRASCENDER!");
		console.log(e);
		process.exit();
	}
}();
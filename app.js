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
			
//kernel/core/motor del sistema trascender
let trascender = function(){
	try{
		
		//configurar estandar de aplicacion web/nodejs/express/trascender
		if(true){
			console.log(new Date() + " == configurando aplicacion");
			this.app = express();
			this.app.use(bodyParser.json({limit: "50mb"})); 
			this.app.use(bodyParser.urlencoded({extended: true}));
			this.app.use(cookieParser());
			this.app.use(session({secret: (new Date()).toISOString(), resave: false, saveUninitialized: false}));
			this.app.use(upload());
			this.app.use(helmet());
			
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			
			this.dir		= __dirname;
			this.config		= JSON.parse(fs.readFileSync("./app.json","utf8"));
			this.config.properties.views = "/app/frontend/html/";
			this.config.properties.mailing = "/app/frontend/html/mailing/templates_back/";
			
			this.server		= http.Server(this.app);
			
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
				this.app.use(cors());
			}
		}
		
		//definir funciones internas propias de trascender
		if(true){
						
			this.extract = function(content,from,to){
				var index1 = content.indexOf(from) + from.length;
				content = content.substring(index1);
				var index2 = content.indexOf(to);
				return content.substring(0,index2);
			}
			
			//primera funcion a ejecutar para peticion http - obtener ip
			this.getIP = function(){
				return function(req,res,next){
					req.ip = (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
					req.ip2 = (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
					req.real_ip = (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
					console.log("IP: " + req.ip);
					next();
				}
			}
			
			//segunda funcion a ejecutar para peticion http - decodifica usuario
			const auth	= this.auth;
			this.decodeUser = function(){
				return function(req,res,next){
					try{
						req.user = null;
						if(req.method.toLowerCase()=="get" && req.query.Authorization && req.query.Authorization!=""){
							let token = auth.decode(req.query.Authorization);
							req.user = (token==null)?{error: auth.error.toString()}:token;
						}else if(req.method.toLowerCase()=="post" && req.body.Authorization && req.body.Authorization!=""){
							let token = auth.decode(req.body.Authorization);
							req.user = (token==null)?{error: auth.error.toString()}:token;
						}else if(req.headers && req.headers.cookie){
							let cookies = req.headers.cookie.split(";");
							for(let i=0;i<cookies.length;i++){
								if(cookies[i].indexOf("Authorization=")>-1){
									let token = auth.decode(cookies[i].split("=")[1]);
									req.user = (token==null)?{error: auth.error.toString()}:token;
								}
							}
						}
					}catch(e){
						console.log(e);
					}
					return next();
				}
			}
			
			//tercera funcion a ejecutar para peticion http - registra llamada
			const log = this.log;
			this.newRequest = function(type){
				return function(req,res,next){
					req.ip = (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
					req.type = type;
					req.created = new Date();
					req.dateref = {
						year: req.created.getFullYear(), 
						month: req.created.getMonth(), 
						day: req.created.getDate()
					}
					let content = "\n" + req.created.toISOString() + ";" + req.type + ";" + req.ip + ";" + req.originalUrl + ";" + req.method + ";" + JSON.stringify(req.body);
					console.log(content);
					fs.appendFile("./log.csv", content, function (err) {});
					log.create(req);
					return next();
				}
			}
			
			//cuarta funcion a ejecutar para peticion http - valida autenticacion
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
			
			//funcion para URLS que enlazan un archivo
			this.getFile = function(file){
				return function(req,res){
					res.sendFile(file);
				};
			}
			
			//funcion para URLS que redireccionan
			this.getRedirect = function(to){
				return function(req,res){
					res.redirect(to);
				};
			}
			
			//funcion para URLS que enlazan una API
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
			this.app.get("/favicon.ico", this.decodeUser(), this.newRequest("FILE"), this.hasRole([]), this.getFile(this.dir + "/app/frontend/media/img/favicon.ico"));
			this.app.get("/robots.txt", this.decodeUser(), this.newRequest("FILE"), this.hasRole([]), this.getFile(this.dir + "/app/frontend/media/doc/robots.txt"));
			if(this.config.files){
				for(let i=0;i<this.config.files.length;i++){
					this.app.get(this.config.files[i].uri, this.getIP(), this.decodeUser(), this.newRequest("FILE"), this.hasRole(this.config.files[i].roles), this.getFile(this.dir + this.config.files[i].src));
				}
			}
				
			//publicar carpetas
			console.log(new Date() + " == publicando carpetas");
			this.app.use("/",this.decodeUser(), this.newRequest("FOLDER"), this.hasRole([]), express.static(this.dir + "/app/frontend"));
			if(this.config.folders){
				for(let i=0;i<this.config.folders.length;i++){
					this.app.use(this.config.folders[i].uri, this.getIP(), this.decodeUser(), this.newRequest("FOLDER"), this.hasRole(this.config.folders[i].roles), express.static(this.dir + this.config.folders[i].src));
				}
			}
				
			//publicar api
			let api = fs.readdirSync("./app/backend","utf8").filter(function(row){
				return fs.statSync(path.join("./app/backend",row)).isFile();
			});
			api.sort();
			for(let i=0;i<api.length;i++){
				let b = api[i];
				console.log(new Date() + " == publicando api " + b);
				let c = fs.readFileSync("./app/backend/" + b,"utf-8");
				let a = new (require("./app/backend/" + b))(this);
				let r = c.split("//@route");
				for(let x=1;x<r.length;x++){
					let data = r[x];
					let uri = eval(this.extract(data,"(",")"));
					let method = eval(this.extract(data,"@method(",")"));
					let action = this.extract(data,"self.prototype.","=").trim();
					let roles = [];
					if(data.indexOf("@roles(")>-1){
						roles = eval(this.extract(data,"@roles(",")"));
					}
					for(let y=0;y<method.length;y++){
						this.app[method[y]](uri, this.getIP(), this.decodeUser(), this.newRequest("API"), this.hasRole(roles), this.getAPI(a,action));
					}
				}
			}
			
			//publicar redireccionamientos
			if(this.config.redirect){
				for(let i=0;i<this.config.redirect.length;i++){
					console.log(new Date() + " == publicando redireccionamientos");
					this.app.use(this.config.redirect[i].from, this.getIP(), this.decodeUser(), this.newRequest("REDIRECT"), this.hasRole(this.config.redirect[i].roles), this.getRedirect(this.config.redirect[i].to));
				}
			}
			
			//publicar error 404
			this.app.use(function(req,res,next){
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
}

//inicio sistema trascender
new trascender();
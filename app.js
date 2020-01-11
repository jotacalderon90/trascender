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
console.log(new Date() + " == importando cookie-parses");
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
			this.server		= http.Server(this.app);
			
			let libs = fs.readdirSync("./app/backend/lib","utf8").filter(function(row){
				return fs.statSync(path.join("./app/backend/lib",row)).isFile();
			});
			
			for(let i=0;i<libs.length;i++){
				let l = libs[i].replace(".js","");
				console.log(new Date() + " == instanciando libreria " + l);
				this[l]	= new(require("./app/backend/lib/" + l))(this);
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
			
			//primera funcion a ejecutar para peticion http - decodifica usuario
			const auth	= this.auth;
			this.decodeUser = function(){
				return function(req,res,next){
					try{
						req.user = null;
						if(req.headers && req.headers.cookie){
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
			
			//segunda funcion a ejecutar para peticion http - registra llamada
			const log = "./log.csv";
			this.newRequest = function(type){
				return function(req,res,next){
					let ip = (req.connection.remoteAddress!="::ffff:127.0.0.1")?req.connection.remoteAddress:req.headers["x-real-ip"];
					let content = "\n" + (new Date()).toISOString() + ";" + type + ";" + ip + ";" + req.originalUrl + ";" + req.method + ";" + JSON.stringify(req.body);
					console.log(content);
					fs.appendFile(log, content, function (err) {});
					return next();
				}
			}
			
			//tercera funcion a ejecutar para peticion http - valida autenticacion
			let mdbs;
			for(db in this.config.database){
				if(this.config.database[db].main){
					mdbs = this.config.database[db].url;
				}
			}
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
									console.log("TIENE ROL!!!!");
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
				return function(req,res){
					api[method](req,res);
				}
			}
			
		}
		
		//levantar aplicación solicitada
		if(true){
			
			//publicar archivos
			console.log(new Date() + " == publicando archivos");
			if(this.config.files){
				for(let i=0;i<this.config.files.length;i++){
					this.app.get(this.config.files[i].uri, this.decodeUser(), this.newRequest("FILE"), this.hasRole(this.config.files[i].roles), this.getFile(this.dir + this.config.files[i].src));
				}
			}
				
			//publicar carpetas
			console.log(new Date() + " == publicando carpetas");
			if(this.config.folders){
				for(let i=0;i<this.config.folders.length;i++){
					this.app.use(this.config.folders[i].uri,this.decodeUser(), this.newRequest("FOLDER"), this.hasRole(this.config.folders[i].roles), express.static(this.dir + this.config.folders[i].src));
				}
			}
				
			//publicar backend
			if(this.config.backend){
				for(let i=0;i<this.config.backend.length;i++){
					let b = this.config.backend[i];
					let n;
					let p;
					if(typeof b=="string"){
						n = b;
					}else{
						n = b.name;
						p = b.params;
					}
					console.log(new Date() + " == publicando backend " + n);
					let c = fs.readFileSync("./app/backend/" + n + ".js","utf-8");
					let a = new (require("./app/backend/" + n))(this,p);
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
							this.app[method[y]](uri,this.decodeUser(), this.newRequest("API"), this.hasRole(roles), this.getAPI(a,action));
						}
					}
				}
			}
			
			//publicar api
			if(this.config.api){
				for(let i=0;i<this.config.api.length;i++){
					console.log(new Date() + " == publicando modulo " + this.config.api[i].name);
					let module = new (require("./app/backend/" + this.config.api[i].name))(this,this.config.api[i].params);
					for(let x=0;x<this.config.api[i].services.length;x++){
						let service = this.config.api[i].services[x];
						this.app[service.method](service.uri,this.decodeUser(), this.newRequest("API"), this.hasRole(service.roles), this.getAPI(module,service.action));
					}
				}
			}
			
			//publicar redireccionamientos
			if(this.config.redirect){
				for(let i=0;i<this.config.redirect.length;i++){
					console.log(new Date() + " == publicando redireccionamientos");
					this.app.use(this.config.redirect[i].from,this.decodeUser(), this.newRequest("REDIRECT"), this.hasRole(this.config.redirect[i].roles), this.getRedirect(this.config.redirect[i].to));
				}
			}
			
			//publicar error 404
			this.app.use(function(req,res,next){
				console.log(new Date() + " == publicando error 404");
				res.status(404).render("message",{title: "Error 404", message: "URL no encontrada", error: 404, class: "danger"});
			});
			
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
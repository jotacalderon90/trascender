//////////////////////////////////////////////////////////
//defino objeto readline apoyado por librería externa read
//////////////////////////////////////////////////////////
var readline = function(){
	this.read = require("../lib/read");
	//pregunta por consola
	this.ask = function(q,c){
		this.read({prompt: q,silent:false,default:""},this.callback(c));
	}
	//pregunta por consola con respuesta oculta
	this.askh = function(q,c){
		this.read({prompt: q,silent:true,default:""},this.callback(c));
	}
	//funcion de retorno a la respuesta
	this.callback = function(c){
		return function(err,res){
			if(err){
				c(err,true);
			}else{
				c(res,false);
			}
		}
	}
}

helper	= new (require("../lib/helper"))	();
mongodb	= new (require("../lib/mongodb"))();

var create = async function(database,email,password){
	let doc = {};
	doc.email = email;
	doc.hash = helper.random(10);
	doc.password = helper.toHash(password + email,doc.hash);
	doc.nickname = email;
	doc.notification = "on";
	doc.thumb = "http://downloadicons.net/sites/default/files/anonymous-icon-16523.png";
	doc.roles = ["admin","user"];
	doc.created = new Date;
	doc.activate = true;
	
	let db = await mongodb.connect("mongodb://127.0.0.1:27017/" + database);
	await mongodb.insertOne(db,"user",doc,true);
	console.log("usuario administrador configurado correctamente");
}

var read = new readline();

read.ask("database: ", function(database){
	read.ask("email: ", function(email){
		read.ask("password: ", function(password){
			create(database,email,password);
		});
	});
});
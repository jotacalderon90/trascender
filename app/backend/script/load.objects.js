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

mongodb	= new (require("../lib/mongodb"))();

var create = async function(database){
	let db = await mongodb.connect("mongodb://127.0.0.1:27017/" + database);
	console.log("db abierta correctamente");
	
	await mongodb.insertOne(db,"object",{"name": "user","label": "Usuario","schema": {"email": "","hash": "","password": "","nickname": "","notification": true,"thumb": "","created": "","roles": [],"activate": false},"default": {"nickname": "document.email"},"static": {"hash": "this.helper.random(20)","password": "this.helper.toHash(document.password,document.hash)","notification": true,"created": "new Date()","roles": ["user"]},"output": {"email": true,"nickname": true,"roles": true},"sort": {"email": 1},"form": {"email": {"input": "text","label": "Email"},"password": {"input": "text","label": "Contraseña"},"nickname": {"input": "text","label": "Nickname"},"notification": {"input": "checkbox","label": "Notificaciones"},"thumb": {"input": "text","label": "Imágen de perfil"},"roles": {"input": "text","label": "Palabras claves"}} },false);
	console.log("object user insertado correctamente");
	
	await mongodb.insertOne(db,"object",{"name": "blog","label": "Blog","schema": {"title": "","uri": "","img": "","thumb": "","images": [],"resume": "","content": "","tag": [],"author": "","created": ""},"required": ["title","resume"],"static": {"author": "this.helper.getUser(req)","created": "new Date()"},"output": {"title": true,"created": true,"tag_main": true},"sort": {"created": -1},"match": "uri","views": {"document": "blog_document","collection": "blog_collection"},"version": true,"form": {"title": {"input": "text","label": "Título","required": true,"unique": true,"events": [{"event": "blur","action": "$('input[name=\"uri\"]').val(getCleanedString(this.value));self.document.updateJSON();"}]},"uri": {"input": "text","label": "URL","required": true,"unique": true},"img": {"input": "text","label": "URL de Imagen normal"},"thumb": {"input": "text","label": "URL de Imagen pequeña"},"images": {"input": "text","label": "Otras imágenes"},"resume": {"input": "text","label": "Resumen"},"content": {"input": "textarea","label": "Contenido","class": "ckeditor"},"tag": {"input": "text","label": "Palabras claves"}} },false);
	console.log("object blog insertado correctamente");
	
	await mongodb.insertOne(db,"object",{"name": "product","label": "Producto","schema": {	"title": "",	"uri": "",	"img": "",	"thumb": "",	"resume": "",	"content": "",	"tag": [],	"price": 0},"output": {	"title": true,	"price": true,	"tag": true},"sort": {	"title": 1},"match": "uri","views": {	"document": "product_document",	"collection": "product_collection"},"form": {	"title": {"input": "text","label": "Título","required": true,"unique": true,"events": [	{"event": "blur","action": "$('input[name=\"uri\"]').val(getCleanedString(this.value));self.document.updateJSON();"	}]	},	"uri": {"input": "text","label": "URL","required": true,"unique": true	},	"img": {"input": "text","label": "URL de Imagen normal"	},	"thumb": {"input": "text","label": "URL de Imagen pequeña"	},	"images": {"input": "text","label": "Otras imágenes"	},	"resume": {"input": "text","label": "Resumen"	},	"content": {"input": "textarea","label": "Contenido","class": "ckeditor"	},	"tag": {"input": "text","label": "Palabras claves"	},	"price": {"input": "number","label": "Precio"	},	"dcto": {"input": "number","label": "Descuento en %"	},	"khipu": {"input": "text","label": "Link de khipu"	}} },false);
	console.log("object product insertado correctamente");
	
	await mongodb.insertOne(db,"object",{"name": "ecommerce","label": "Orden de Compra","schema": {"ip": "","email": "","phone": "","message": "","product": [],"total": 0,"status": "","created": ""},"default": {"status": 10},"static": {"created": "new Date()"},"output": {"email": true,"total": true,"status": true},"sort": {"created": -1},"version": true },false);
	console.log("object ecommerce insertado correctamente");
	
	await mongodb.insertOne(db,"object",{"name": "wall","schema": {"author": "","created": "","content": "","link": ""},"sort": {"created": -1} },false);
	console.log("object wall insertado correctamente");
	
	await mongodb.insertOne(db,"object",{"name": "comment","schema": {"comment": "","author": "","type": "","parent": "","created": ""} },false);
	console.log("object comment insertado correctamente");
	
	await mongodb.insertOne(db,"object",{"name": "plebiscite","schema": {"title": "","content": "","options": [],"accounts": [],"status": ""},"output": {"title": true,"status": true} },false);
	console.log("object plebisite insertado correctamente");
	
	await mongodb.insertOne(db,"object",{"name": "story","label": "Historia","schema": {"year": 0,"month": 0,"day": 0,"title": "","resume": "","img": "","font": [],"tag": [],"audio": "","latitud": 0,"longitud": 0},"output": {"year":true,"month":true,"day":true,"title":true},"sort": {"year": -1,"month": -1,"day": -1,"title": 1},"match": "title","views": {"document": "story_document","collection": "story_collection"} },true);
	console.log("object story insertado correctamente");
	
	console.log("db cerrada correctamente");
}

var read = new readline();

read.ask("database: ", function(database){
	create(database);
});
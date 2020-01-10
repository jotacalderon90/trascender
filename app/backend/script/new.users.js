/*
	carga usuarios desde un archivo llamado users.csv
	ejecutar: node _users.js --db "dbname"
*/
try{
		
	var fs		= require("fs");
	var helper	= new (require("../lib/helper"))();
	var mongodb	= new (require("../lib/mongodb"))();

	var db;
	var dbname;
	
	var create = async function(row,disconnect){
		row = row.toLowerCase();
		if(row.indexOf(";")>-1){
			row = row.split(";");
		}else{
			let n = row.split("@")[0];
			row = [n,row.replace("\r","")];
		}
		
		var doc = {};
		doc.email = row[1];
		doc.hash = helper.random(10);
		doc.password = helper.toHash(row[1] + row[1],doc.hash);
		doc.nickname = row[0];
		doc.notification = "on";
		doc.thumb = "http://downloadicons.net/sites/default/files/anonymous-icon-16523.png";
		doc.roles = ["user"];
		doc.created = new Date;
		doc.activate = true;
		
		db = await mongodb.connect("mongodb://127.0.0.1:27017/" + dbname);
		await mongodb.insertOne(db,"user",doc,true);
	}

	for(var i=0;i<process.argv.length;i++){
		if(process.argv[i]=="--db"){
			dbname=process.argv[i+1];
		}
	}

	var rows = (fs.readFileSync("./users.csv","utf8")).split("\n");
	
	for(var i=0;i<rows.length;i++){
		create(rows[i],((i+1==rows.length)?true:false));
		console.log("usuario agregado correctamente: " + (i+1) + "/" + rows.length);
	}
	console.log("proceso finalizado");
}catch(e){
	console.log("error");
	console.log(e);
}
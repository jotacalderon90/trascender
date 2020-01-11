const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.question('database: ', (database) => {
	rl.question('email: ', (email) => {
		rl.question('password: ', (password) => {
			rl.question('roles: ', (roles) => {
				let helper	= new (require("../lib/helper"))();
				let mongodb	= new (require("../lib/mongodb"))();
				let create = async function(database,email,password,roles){
					let doc = {};
					doc.email = email;
					doc.hash = helper.random(10);
					doc.password = helper.toHash(password + email,doc.hash);
					doc.nickname = email;
					doc.notification = true;
					doc.thumb = "/media/img/user.png";
					doc.roles = roles.split(",");
					doc.created = new Date;
					doc.activate = true;
					
					let db = await mongodb.connect("mongodb://127.0.0.1:27017/" + database);
					await mongodb.insertOne(db,"user",doc,true);
					console.log("usuario administrador configurado correctamente");
				}
				create(database,email,roles);
			});
		});
	});
});
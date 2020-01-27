let self = function(a){
	this.config = a.config;
	this.mongodb;
	
	this.ips = [];//ips por día
	
	let d = new Date();
	this.dateref = {year: d.getFullYear(), month: d.getMonth(), day: d.getDate()};
}

//registro de logs que entran sin ser identificados
self.prototype.create = async function(req){
	try{
		console.log(req.ip);
		//si cambio la fecha, entonces limpiar cache
		if(req.dateref.year!=this.dateref.year || req.dateref.month!=this.dateref.month || req.dateref.day!=this.dateref.day){
			let d = new Date();
			this.dateref = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate()};
			this.ips = [];
		}
		
		//ingresa por primera vez en el día
		if(this.ips.indexOf(req.ip)==-1){
			console.log(req.user);
			let db = await this.mongodb.connect(this.config.database.url);
			if(req.user){
				//nueva ip de usuario authenticado
				user = await this.mongodb.findOne(db,"user",req.user.sub);
				user.ip = (user.ip)?user.ip:[];
				if(user.ip.indexOf(req.ip)==-1){
					user.ip.push(req.ip);
				}
				await this.mongodb.updateOne(db,"user",user._id,user);
			}else{
				let possibles = await this.mongodb.count(db,"user",{ip: {$in: [req.ip]}});
				if(possibles==0){
					await this.mongodb.insertOne(db,"log",{ip: req.ip, created: req.created, url: req.url, method: req.method, body: JSON.stringify(req.body)});
				}
			}
			let docip = await this.mongodb.find(db,"ip",{ip: req.ip});
			if(docip.length!=1){
				console.log("inserta nueva ip: " + req.ip);
				await this.mongodb.insertOne(db,"ip",{ip: req.ip, created: req.created, url: req.url, method: req.method, body: JSON.stringify(req.body)});
			}
			this.ips.push(req.ip);
			db.close();
		}
	}catch(e){
		console.log(e);
	}
}

module.exports = self;
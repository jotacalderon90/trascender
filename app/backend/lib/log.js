let self = function(a){
	this.config = a.config;
	this.mongodb;
	
	this.ips = [];
	
	let d = new Date();
	this.dateref = {year: d.getFullYear(), month: d.getMonth(), day: d.getDate()};
}

self.prototype.create = async function(req){
	try{
		if(req.real_ip && this.ips.indexOf(req.real_ip)==-1){
			this.ips.push(req.real_ip);
			if(req.created.getFullYear!=this.dateref.year || req.created.getMonth()!=this.dateref.month || req.created.d.getDate()!=this.dateref.day){
				let d = new Date();
				this.dateref = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate()};
				this.ips = [];
				this.ips.push(req.real_ip);
			}
			let db = await this.mongodb.connect(this.config.database.url);
			let docip = await this.mongodb.find(db,"ip",{ip: req.real_ip});
			if(docip.length!=1){
				await this.mongodb.insertOne(db,"ip",{ip: req.real_ip, created: req.created, url: req.url, method: req.method, body: JSON.stringify(req.body)});
			}
			if(req.user){
				user = await this.mongodb.findOne(db,"user",req.user.sub);
				user.ip = (user.ip)?user.ip:[];
				if(user.ip.indexOf(req.real_ip)==-1){
					user.ip.push(req.real_ip);
				}
				await this.mongodb.updateOne(db,"user",user._id,user);
			}else{
				let possibles = await this.mongodb.count(db,"user",{ip: {$in: [req.real_ip]}});
				if(possibles==0){
					await this.mongodb.insertOne(db,"log",{ip: req.real_ip, created: req.created, url: req.url, method: req.method, body: JSON.stringify(req.body)});
				}
			}
			db.close();
		}
	}catch(e){
		console.log(e);
	}
}

module.exports = self;
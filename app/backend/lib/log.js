let self = function(a){
	this.config = a.config;
	this.mongodb;
	this.restart();
}

self.prototype.restart = function(){
	let d = new Date();
	this.dateref = { year: d.getFullYear(), month: d.getMonth(), day: d.getDate()};
	this.ips = {};
}

self.prototype.setBody = function(req){
	return {ip: req.real_ip, created: req.created, url: req.url, method: req.method, body: JSON.stringify(req.body)};
}

self.prototype.saveBackup = async function(req){
	for(ip in this.ips){
		await this.mongodb.insertOne("log",this.ips[ip]);
	}
}

self.prototype.create = async function(req){
	try{
		if(req.created.getFullYear()!=this.dateref.year || req.created.getMonth()!=this.dateref.month || req.created.getDate()!=this.dateref.day){
			this.restart();
			this.saveBackup();
		}
		if(!this.ips[req.real_ip]){
			this.ips[req.real_ip] = this.setBody(req);
			if(req.user){
				req.user.ip = (req.user.ip)?req.user.ip:[];
				if(req.user.ip.indexOf(req.real_ip)==-1){
					req.user.ip.push(req.real_ip);
					await this.mongodb.updateOne("user",req.user._id,{$set: {ip: req.user.ip}});
				}
			}
		}
	}catch(e){
		console.error(e);
	}
}

module.exports = self;
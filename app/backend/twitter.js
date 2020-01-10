"use strict";

var self = function(application,params){
	this.helper = application.helper;
	this.url = "https://cdn.syndication.twimg.com/timeline/profile?screen_name=";
	this.tweets = {};
}

self.prototype.read = async function(req,res){
	try{
		let n = req.params.name.toLowerCase();
		let c = null;
		if(this.tweets[n]){
			let d = this.tweets[n].d - new Date();
			//var diffDays = Math.floor(diffMs / 86400000); // days
			//var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
			//var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
			d = Math.round(((d % 86400000) % 3600000) / 60000);
			c = (d<5)?this.tweets[n].c:null;
		}
		if(c==null){
			c = await this.helper.request(this.url + n);
			this.tweets[n] = {c: c, d: new Date()}
		}
		res.send({data: c});
	}catch(e){
		console.log(e);
		res.send({data: null, error: e.toString()});
	}
}

module.exports = self;
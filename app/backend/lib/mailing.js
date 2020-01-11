"use strict";

const mailer = require("nodemailer");
const transport = require("nodemailer-smtp-transport");

var self = function(application){
	
	this.config = application.config;
	
	this.createTransport = function(){
		//attachments : [{filename: 'text3.txt',path: 'Your File path'}]
		return mailer.createTransport(transport({
			host : this.config.smtp.host,
			secureConnection : this.config.smtp.secureConnection,
			port: this.config.smtp.port,
			auth : {
				user : this.config.smtp.user, 
				pass : this.config.smtp.pass
			}
		}));
	}
}

self.prototype.send = function(body){
	let me = this;
	return new Promise(function(resolve,reject){
		body.from = (me.config.smtp.from!=undefined && me.config.smtp.from.trim()!="")?me.config.smtp.from:me.config.smtp.user;
		me.createTransport().sendMail(body, function(e, response){
			if(e){
				return reject(e);
			}else{
				resolve(response);
			}
		});
	});
}

module.exports = self;
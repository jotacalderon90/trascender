"use strict";

const crypto = require("crypto");
const fs	 = require("fs");
const http 	 = require("http");
const https  = require("https");

var self = function(){
	
}

self.prototype.random = function(length){
	let possibleChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let text = "";
	for (let i = 0; i < length; i++){
		text += possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
	}
	return text;
}

self.prototype.toHash = function(text,hash){
	return crypto.createHmac("sha256", text).update(hash).digest("hex");
}

self.prototype.getUser = function(req){
	try{
		return req.session.passport.user.email;
	}catch(e){
		return "anonymous";
	}
}

self.prototype.validEMAIL = function(email){
	if(email!=undefined && email.trim()!="" && /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)){
		return true;
	}else{
		return false;
	}
}

self.prototype.recaptcha = function(recaptcha,req){
	return new Promise(function(resolve,reject){
		recaptcha.verify(req, function(error){
			if(error){
				return reject(error);
			}else{
				resolve(true);
			}
		});
	});
}

self.prototype.request = function(url){
	let r = (url.indexOf("https://")==0)?https:http;
	return new Promise(function(resolve,reject){
		r.get(url, (resp) => {
			let data = '';
			resp.on('data', (chunk) => {
				data += chunk;
			});
			resp.on('end', () => {
				try{
					let json = JSON.parse(data);
					if(json.body){
						resolve(json.body);
					}else{
						resolve(json);
					}					
				}catch(e){
					reject(e);
				}
			});
		}).on("error", (e) => {
			reject(e);
		});
	});
}


module.exports = self;
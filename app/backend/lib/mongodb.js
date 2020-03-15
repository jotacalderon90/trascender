"use strict";

var mongodb	= require("mongodb");
var MongoClient	= mongodb.MongoClient;

var self = function(){
	
}

self.prototype.toId = function(id){
	return new mongodb.ObjectID(id);
}

self.prototype.connect = function(config){
	return new Promise(function(resolve,reject){
		MongoClient.connect(config.url, {useUnifiedTopology: true}, function(error, client) {
			if(error){
				return reject(error);
			}else{
				resolve({
					c: client,
					d: client.db(config.db)
				});
			}
		});
	});
}

self.prototype.count = function(client,collection,query,options,close){
	return new Promise(function(resolve,reject){
		client.d.collection(collection).countDocuments(query, options, function(error, data){
			if(close){
				client.c.close();
			}
			if(error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.find = function(client,collection,query,options,close){
	return new Promise(function(resolve,reject){
		client.d.collection(collection).find(query, options).toArray(function(error, data){
			if(close){
				client.c.close();
			}
			if(error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.insertOne = function(client,collection,document,close){
	return new Promise(function(resolve,reject){
		client.d.collection(collection).insertOne(document, function(error, data) {
			if(close){
				client.c.close();
			}
			if (error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.findOne = function(client,collection,id,close){
	return new Promise(function(resolve,reject){
		client.d.collection(collection).findOne({_id: new mongodb.ObjectID(id)}, function(error, data) {
			if(close){
				client.c.close();
			}
			if (error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.updateOne = function(client,collection,id,document,close){
	delete document._id;
	return new Promise(function(resolve,reject){
		client.d.collection(collection).replaceOne({_id: new mongodb.ObjectID(id)}, document, function(error, data) {
			if(close){
				client.c.close();
			}
			if (error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.deleteOne = function(client,collection,id,close){
	return new Promise(function(resolve,reject){
		client.d.collection(collection).deleteOne({_id: new mongodb.ObjectID(id)}, function(error, data) {
			if(close){
				client.c.close();
			}
			if (error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.distinct = function(client,collection,field,close){
	return new Promise(function(resolve,reject){
		client.d.collection(collection).distinct(field, function(error, data) {
			if(close){
				client.c.close();
			}
			if (error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

module.exports = self;
"use strict";

var mongo	= require("mongodb");
var client	= mongo.MongoClient;

var self = function(){
	
}

self.prototype.toId = function(id){
	return new mongo.ObjectID(id);
}

self.prototype.connect = function(url){
	return new Promise(function(resolve,reject){
		client.connect(url, function(error, db) {
			if(error){
				return reject(error);
			}else{
				resolve(db);
			}
		});
	});
}

self.prototype.count = function(db,collection,query,options,close){
	return new Promise(function(resolve,reject){
		db.collection(collection).count(query, options, function(error, data){
			if(close){
				db.close();
			}
			if(error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.find = function(db,collection,query,options,close){
	return new Promise(function(resolve,reject){
		db.collection(collection).find(query, options).toArray(function(error, data){
			if(close){
				db.close();
			}
			if(error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.insertOne = function(db,collection,document,close){
	return new Promise(function(resolve,reject){
		db.collection(collection).insertOne(document, function(error, data) {
			if(close){
				db.close();
			}
			if (error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.findOne = function(db,collection,id,close){
	return new Promise(function(resolve,reject){
		db.collection(collection).findOne({_id: new mongo.ObjectID(id)}, function(error, data) {
			if(close){
				db.close();
			}
			if (error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.updateOne = function(db,collection,id,document,close){
	delete document._id;
	return new Promise(function(resolve,reject){
		db.collection(collection).updateOne({_id: new mongo.ObjectID(id)}, document, function(error, data) {
			if(close){
				db.close();
			}
			if (error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.deleteOne = function(db,collection,id,close){
	return new Promise(function(resolve,reject){
		db.collection(collection).deleteOne({_id: new mongo.ObjectID(id)}, function(error, data) {
			if(close){
				db.close();
			}
			if (error){
				return reject(error);
			}else{
				resolve(data);
			}
		});
	});
}

self.prototype.distinct = function(db,collection,field,close){
	return new Promise(function(resolve,reject){
		db.collection(collection).distinct(field, function(error, data) {
			if(close){
				db.close();
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
"use strict";

var fs = require("fs");
var path = require("path");

let self = function(application,params){
	
	this.decode = function(value){
		return decodeURIComponent(new Buffer(value,"base64"));
	};
	
	this.base = application.dir + params[0];
	
}

self.prototype.getTotalFolder = function(req,res){
	try{
		let dir = this.base + this.decode(req.params.id);
		let response = fs.readdirSync(dir,"utf8").filter(function(row){
			return !fs.statSync(path.join(dir,row)).isFile();
		}).length;
		res.send({data: response});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.getCollectionFolder = function(req,res){
	try{
		let dir = this.base + this.decode(req.params.id);
		let response = fs.readdirSync(dir,"utf8").filter(function(row){
			return !fs.statSync(path.join(dir,row)).isFile();
		});
		res.send({data: response});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.createFolder = function(req,res){
	try{
		fs.mkdirSync(this.base + this.decode(req.params.id) + req.body.name);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.updateFolder = function(req,res){
	try{
		fs.renameSync(this.base + this.decode(req.params.id), this.base + "/" + req.body.name);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.deleteFolder = function(req,res){
	try{
		fs.rmdirSync(this.base + this.decode(req.params.id));
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.fullDirectory = function(req,res){
	try{
		let getDirectory = function(src, dirbase){
			let tmpDir = fs.readdirSync(src);
			let directory = [];
			for(let i=0;i<tmpDir.length;i++){
				let direct = path.join(src, tmpDir[i]);
				let dir = {text: tmpDir[i], id: dirbase + tmpDir[i], type: (fs.statSync(direct).isDirectory())?"folder":"file"}
				if(fs.statSync(direct).isDirectory()){
					dir.children = getDirectory(direct, dirbase + tmpDir[i] + "/");
				}
				directory.push(dir);
			}
			return directory;
		};
		res.send({data: getDirectory(this.base,"/")});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.getTotalFile = function(req,res){
	try{
		let dir = this.base + this.decode(req.params.id);
		let response = fs.readdirSync(dir,"utf8").filter(function(row){
			return fs.statSync(path.join(dir,row)).isFile();
		}).length;
		res.send({data: response});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.getCollectionFile = function(req,res){
	try{
		let dir = this.base + this.decode(req.params.id);
		let response = fs.readdirSync(dir,"utf8").filter(function(row){
			return fs.statSync(path.join(dir,row)).isFile();
		});
		res.send({data: response});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.createFile = function(req,res){
	try{
		fs.writeFileSync(this.base + this.decode(req.params.id) + req.body.name, (req.body.content)?req.body.content:"");
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.readFile = function(req,res){
	try{
		res.send({data: fs.readFileSync(this.base + this.decode(req.params.id),"utf8")});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.updateFile = function(req,res){
	try{
		fs.writeFileSync(this.base + this.decode(req.params.id), req.body.content);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.deleteFile = function(req,res){
	try{
		fs.unlinkSync(this.base + this.decode(req.params.id));
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.renameFile = function(req,res){
	try{
		fs.renameSync(this.base + this.decode(req.params.id),this.base + "/" + req.body.name);
		res.send({data: true});
	}catch(e){
		res.send({data: null, error: e.toString()});
	}
}

self.prototype.downloadFile = function(req,res){
	try{
		res.download(this.base + this.decode(req.params.id));
	}catch(e){
		res.send({data: null, error: e});
	}
}

self.prototype.getFile = function(req,res){
	try{
		res.sendFile(this.base + this.decode(req.params.id));
	}catch(e){
		res.send({data: null, error: e});
	}
}

self.prototype.upload_process = function(file,path){
	return new Promise(function(resolve,reject){
		file.mv(path, function(err) {
			if (err){
				return reject(error);
			}else{
				resolve(true);
			}
		});
	});
}

self.prototype.upload = async function(req,res){
	try{
		if (!req.files || Object.keys(req.files).length === 0) {
			throw("no file");
		}
		
		let dir = this.base + (this.decode(req.params.id)).substr(1);
		
		if(Array.isArray(req.files.file)){
			for(let i=0;i<req.files.file.length;i++){
				console.log("subiendo archivo" + req.files.file[i].name);
				await this.upload_process(req.files.file[i], dir + req.files.file[i].name);
			}
		}else{
			console.log("subiendo archivo" + req.files.file.name);
			await this.upload_process(req.files.file, dir + req.files.file.name);
		}
		
		//res.send({data: true});
		res.redirect("/filemanager");
	}catch(e){
		res.status(500).render("message",{title: "Error en el Servidor", message: e.toString(), error: 500, class: "danger", config: this.config});
	}
}

module.exports = self;
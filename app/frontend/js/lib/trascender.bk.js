var jotaTranscend = function(){
	
	var self = function(data){
		
		this.newdoc = null; 
		this.doc = null;
		this.coll = [];
		
		this.recovery = null;
		
		this.total = 0;
		this.obtained = 0;
		this.increase = false;
		this.action = null;
		
		this.output = [];
		this.filter = {};
		
		this.totalpages = 0;
		this.rowsByPage = 10;
		this.pages = [];
		this.selectedPage = 0;
		
		this.headerContentType = "application/json;charset=UTF-8";
		
		this.service = {
			total:		["GET", 	data.baseurl + "/total?query=:query"],
			collection: ["GET", 	data.baseurl + "/collection?query=:query&options=:options"],
			create:		["POST",	data.baseurl],
			read:		["GET", 	data.baseurl + "/:id"],
			update:		["PUT",		data.baseurl + "/:id"],
			delete:		["DELETE",	data.baseurl + "/:id"],
			schema:		["GET", 	data.baseurl + "/schema"]
		};
		
		this.response = {
			total: "data",
			collection: "data",
			create: "data",
			read: "data",
			update: "data",
			delete: "data",
			schema: "data"
		}
		
		this.message = {
			total: {on: "Cargando total de documentos", error: "Error al obtener la cantidad de documentos", success: "Total de documentos cargados"},
			collection: {on: "Cargando documentos", error: "Error al cargar documentos", success: "Documentos cargados correctamente"},
			create: {on: "Creando documento", error: "Error al crear documento", success: "Documento creado correctamente"},
			read: {on: "Cargando documento", error: "Error al cargar documento", success: "Documento cargado correctamente"},
			update: {on: "Actualizando documento", error: "Error al actualizar el documento", success: "Documento actualizado correctamente"},
			delete: {on: "Eliminando documento", error: "Error al eliminar el documento", success: "Documento eliminado correctamente"},
			schema: {on: "Cargando esquema", error: "Error al obtener esquema", success: "Esquema obtenido correctamente"}
		}
		
		this.logger = {
			coll: [],
			push: function(message){
				this.coll.push({
					show: true, 
					spinner: true, 
					class: "alert-info", 
					msg: message, 
					error: null,
					success: function(scope){
						var self = this;
						setTimeout(function(){
							self.show = false;
							if(scope){scope.$digest(function(){});}
						},2000);
					}
				});
				return this.coll[this.coll.length-1];
			}
		};
		
		if(data){
			
			//creación objetos personalizados
			for(attr in data){
				this[attr] = data[attr];
			}
			
			//creacion de los servicios rest
			for(service in this.service){
				this.service[service] = this.serviceCreate(this.service[service][0],this.service[service][1],this.service[service][2],this.headerContentType);
			}
			
			//creacion de sub objetos
			if(data.subdocuments){
				this.subdocument = {};
				var self = this;
				for(var i=0;i<data.subdocuments.length;i++){
					var name = data.subdocuments[i].name;
					var path = data.subdocuments[i].path;
					
					this.subdocument[name] = {
						doc: {},
						path: path,
						clean: function(){
							 for(attr in this.doc){
								 this.doc[attr] = null;
							 }
						},
						push: function(){
							self.getSubElement(self.doc,this.path).push(this.doc);
							this.clean();
						},
						edit: function(index){
							self.getSubElement(self.doc,this.path)[index].recovery = angular.copy(self.getSubElement(self.doc,this.path)[index]);
							self.getSubElement(self.doc,this.path)[index].mode=2;
						},
						update: function(index){
							delete self.getSubElement(self.doc,this.path)[index].recovery;
							self.getSubElement(self.doc,this.path)[index].mode=1;
						},
						remove: function(index){
							self.getSubElement(self.doc,this.path).splice(index,1);
						},
						cancel: function(index){
							self.getSubElement(self.doc,this.path)[index] = self.getSubElement(self.doc,this.path)[index].recovery;
							self.getSubElement(self.doc,this.path)[index].mode=1;
						}
					}
					for(attr in data.subdocuments[i]){
						this.subdocument[name][attr] = data.subdocuments[i][attr];
					}
				}
			}
			
			//iniciar app
			if(this.start){
				this.start();
			}
		}
	}

	self.prototype.default = function(){
		return {};
	}
	
	self.prototype.new = function(){
		this.action = "new";
		this.newdoc = this.default();
		this.afterChangeMode("new",this.newdoc);
	}
	
	self.prototype.select = function(doc){
		this.action = "read";
		this.doc = angular.copy(doc);
		this.afterChangeMode("read",doc);
	}
	
	self.prototype.changeMode = function(action,doc){
		doc = (doc==undefined)?this.doc:doc;
		this.action = action;
		this.doc = angular.copy(doc);
		this.afterChangeMode(action,doc);
	}
	
	self.prototype.afterChangeMode = function(action,doc){
		
	}

	self.prototype.resetFilters = function() {
		for (property in this.filter) {
		    this.filter[property].value = "";
		    this.filter[property].value2 = "";
		}
	}
	
	self.prototype.close = function(){
		this.doc = null;
		this.newdoc = null;
		this.action = null;
		this.afterClose();
	}
	
	self.prototype.afterClose = function(){
		
	}
	
	self.prototype.isCreateMode = function(){
		return (this.action=="new")?true:false;
	}
	
	self.prototype.isReadMode = function(){
		return (this.action=="read")?true:false;
	}

	self.prototype.isEditMode = function(){
		return (this.action=="edit")?true:false;
	}
	
	self.prototype.formatCollectionToClient = function(coll){
		if(coll!=undefined){
			for(var i=0;i<coll.length;i++){
				coll[i] = this.formatToClient(coll[i]);
			}
			return coll;
		}else{
			return [];
		}
	}
	
	self.prototype.formatToClient = function(doc){
		return doc;
	}
	
	self.prototype.formatToServer = function(doc){
		return doc;
	}
	
	self.prototype.getQuerystring = function(){
		var str = "";
		
		var output = this.output.join(";");
		
		var fields = [];
		var operation = [];
		var value1 = [];
		var value2 = [];
		for(filter in this.filter){
			if(this.filter[filter].value!=""){
				fields.push(filter);
				//operation.push((this.filter[filter].value2!="")?"between":"=");
				operation.push(this.filter[filter].operation);
				value1.push(this.filter[filter].value);
				value2.push((this.filter[filter].value2=="")?"null":this.filter[filter].value2);
			}
		}
		
		return "&output=" + output + "&fields=" + fields.join(";") + "&operation=" + operation.join(";") + "&value1=" + value1.join(";") + "&value2=" + value2.join(";");
	}
	
	self.prototype.callback = function(response,client){
		try{
			client.log.spinner = false;
			if(response.status!=200){
				client.log.error = {type: "HTTP", status: response.status, desc: response.statusText};
				client.onError(response,client);
			}else{
				response.data = JSON.parse(response.responseText);
				if(response.data.data==null){
					client.log.error = {type: "SERVER", status: 200, desc: response.data.error};
					client.onError(response,client);
				}else{
					client.onSuccess(response,client);
				}
			}
		}catch(e){
			console.log(e);
			client.log.error = {type: "APPLICATION", status: 0, desc: response.responseText};
			client.onError(response,client);
		}finally{
			if(client.self.scope!=undefined){
				client.self.scope.$digest(function(){});
			}
		}
	}
	
	self.prototype.formatBody = function(doc){
		if(this.headerContentType=="application/json;charset=UTF-8"){
			return JSON.stringify(doc);
		}else{
			var formData = new FormData();
			if(doc.attachment!=undefined && doc.attachment!=null){
				formData.append("file", doc.attachment);
				formData.append("filename", doc.attachment.name);
				formData.append("mimetype", doc.attachment.type);
			}
			formData.append("data", JSON.stringify(doc));
			return formData;
		}
	}
	
	self.prototype.getSubElement = function(obj,subObj){
		var sub = subObj.split(".");
		var res = obj;
		for(var i=0;i<sub.length;i++){
			res = res[sub[i]];
		}
		return res;
	}
	
	self.prototype.validToServer = function(doc){
		return true;
	}
	
	/************/
	/*GET SCHEMA*/
	/************/
	self.prototype.beforeGetSchema= function(){
		return true;
	}
	
	self.prototype.paramsToGetSchema = function(){
		return {};
	}
	
	self.prototype.clientToGetSchema = function(){
		return {
			log: this.logger.push(this.message.schema.on),
			self: this
		};
	}

	self.prototype.getSchema = function(params){
		if(this.beforeGetSchema()){
			this.service.schema((params!=undefined)?params:this.paramsToGetSchema(),this.clientToGetSchema(),this.callbackGetSchema);
		}
	}
	
	self.prototype.callbackGetSchema = function(response,client){
		client.onSuccess = client.self.successGetSchema;
		client.onError = client.self.errorGetSchema;
		client.self.callback(response,client);
	}
	
	self.prototype.successGetSchema = function(response,client){
		client.log.msg = client.self.message.schema.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.schema = client.self.getSubElement(response.data,client.self.response.schema);
		
		client.self.output = [];
		client.self.filter = {};
		for(field in client.self.schema){
			//generate output
			client.self.output.push(field);

			//generatefilter
			client.self.filter[field] = {
				operation: "=",
				value: "",
				value2: ""
			};
		}
		
		client.self.afterGetSchema(response,client,true);
	}

	self.prototype.errorGetSchema= function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.schema.error;
		client.self.afterGetSchema(response,client,false);
	}
	
	self.prototype.afterGetSchema = function(response,client,success){
		
	}
	
	/***********/
	/*GET TOTAL*/
	/***********/
	
	self.prototype.beforeGetTotal = function(){
		return true;
	}
	
	self.prototype.paramsToGetTotal = function(){
		return {querystring: this.getQuerystring()};
	}
	
	self.prototype.clientToGetTotal = function(){
		return {
			log: this.logger.push(this.message.total.on),
			self: this
		};
	}

	self.prototype.getTotal = function(params){
		if(this.beforeGetTotal()){
			this.service.total((params!=undefined)?params:this.paramsToGetTotal(),this.clientToGetTotal(),this.callbackGetTotal);
		}
	}
	
	self.prototype.callbackGetTotal = function(response,client){
		client.onSuccess = client.self.successGetTotal;
		client.onError = client.self.errorGetTotal;
		client.self.callback(response,client);
	}
	
	self.prototype.successGetTotal = function(response,client){
		client.log.msg = client.self.message.total.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.total = client.self.getSubElement(response.data,client.self.response.total);
		client.self.setPages();
		client.self.afterGetTotal(response,client,true);
	}

	self.prototype.errorGetTotal = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.total.error;
		client.self.afterGetTotal(response,client,false);
	}
	
	self.prototype.afterGetTotal = function(response,client,success){
		
	}
	
	/****************/
	/*GET COLLECTION*/
	/****************/

	self.prototype.beforeGetCollection = function(){
		return true;
	}
	
	self.prototype.paramsToGetCollection = function(){
		return {from: this.obtained, querystring: this.getQuerystring()};
	}
	
	self.prototype.clientToGetCollection = function(){
		return {
			log: this.logger.push(this.message.collection.on),
			self: this
		};
	}
	
	self.prototype.getCollection = function(params){
		if(this.beforeGetCollection()){
			this.service.collection((params!=undefined)?params:this.paramsToGetCollection(),this.clientToGetCollection(),this.callbackGetCollection);
		}
	}
	
	self.prototype.callbackGetCollection = function(response,client){
		client.onSuccess = client.self.successGetCollection;
		client.onError = client.self.errorGetCollection;
		client.self.callback(response,client);
	}
	
	self.prototype.successGetCollection = function(response,client){
		client.log.msg = client.self.message.collection.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		var coll = client.self.formatCollectionToClient(client.self.getSubElement(response.data,client.self.response.collection));
		client.self.obtained+=coll.length;
		if(client.self.increase){
			client.self.coll = client.self.coll.concat(coll);
		}else{
			client.self.coll = coll;
		}
		client.self.afterGetCollection(response,client,true);
	}

	self.prototype.errorGetCollection = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.collection.error;
		client.self.afterGetCollection(response,client,false);
	}
	
	self.prototype.afterGetCollection = function(response,client,status){
		
	}

	/********/
	/*CREATE*/
	/********/

	self.prototype.beforeCreate = function(doc){
		return this.validToServer(doc);
	}
	
	self.prototype.paramsToCreate = function(){
		return {};
	}
	
	self.prototype.clientToCreate = function(){
		return {
			log: this.logger.push(this.message.create.on),
			self: this
		};
	}
	
	self.prototype.create = function(){
		this.newdoc = this.formatToServer(this.newdoc);
		if(this.beforeCreate(this.newdoc)){
			this.service.create(this.paramsToCreate(),this.formatBody(this.newdoc),this.clientToCreate(),this.callbackCreate);
		}
	}
	
	self.prototype.callbackCreate = function(response,client){
		client.onSuccess = client.self.successCreate;
		client.onError = client.self.errorCreate;
		client.self.callback(response,client);
	}
	
	self.prototype.successCreate = function(response,client){
		client.log.msg = client.self.message.create.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.close();
		client.self.afterCreate(response,client,true);
	}
	
	self.prototype.errorCreate = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.create.error;
		client.self.afterCreate(response,client,false);
	}

	self.prototype.afterCreate = function(response,client,status){
		
	}
	
	/******/
	/*READ*/
	/******/

	self.prototype.beforeRead = function(){
		return true;
	}
	
	self.prototype.paramsToRead = function(){
		return {};
	}
	
	self.prototype.clientToRead = function(){
		return {
			log: this.logger.push(this.message.read.on),
			self: this
		};
	}
	
	self.prototype.read = function(params){
		if(this.beforeRead()){
			this.service.read((params!=undefined)?params:this.paramsToRead(),this.clientToRead(),this.callbackRead);
		}
	}
	
	self.prototype.callbackRead = function(response,client){
		client.onSuccess = client.self.successRead;
		client.onError = client.self.errorRead;
		client.self.callback(response,client);
	}
	
	self.prototype.successRead = function(response,client){
		client.log.msg = client.self.message.read.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.doc = client.self.formatToClient(client.self.getSubElement(response.data,client.self.response.read));
		client.self.action = "read";
		client.self.afterRead(response,client,true);
	}
	
	self.prototype.errorRead = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.read.error;
		client.self.afterRead(response,client,false);
	}

	self.prototype.afterRead = function(response,client,status){
		
	}

	/********/
	/*UPDATE*/
	/********/

	self.prototype.beforeUpdate = function(doc){
		return this.validToServer(doc);
	}
	
	self.prototype.paramsToUpdate = function(){
		return {};
	}
	
	self.prototype.clientToUpdate = function(){
		return {
			log: this.logger.push(this.message.update.on),
			self: this
		};
	}
	
	self.prototype.update = function(params){
		this.doc = this.formatToServer(this.doc);
		if(this.beforeUpdate(this.doc)){
			this.service.update((params!=undefined)?params:this.paramsToUpdate(),this.formatBody(this.doc),this.clientToUpdate(),this.callbackToUpdate);
		}
	}
	
	self.prototype.callbackToUpdate = function(response,client){
		client.onSuccess = client.self.successUpdate;
		client.onError = client.self.errorUpdate;
		client.self.callback(response,client);
	}
	
	self.prototype.successUpdate = function(response,client){
		client.log.msg = client.self.message.update.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.close();
		client.self.afterUpdate(response,client,true);
	}

	self.prototype.errorUpdate = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.update.error;
		client.self.afterUpdate(response,client,true,false);
	}
	
	self.prototype.afterUpdate = function(response,client,status){
		
	}

	/********/
	/*DELETE*/
	/********/

	self.prototype.beforeDelete = function(doc){
		return true;
	}
	
	self.prototype.paramsToDelete = function(){
		return {};
	}
	
	self.prototype.clientToDelete = function(){
		return {
			log: this.logger.push(this.message.delete.on),
			self: this
		};
	}
	
	self.prototype.delete = function(params){
		if(this.beforeDelete(this.doc)){
			this.service["delete"]((params!=undefined)?params:this.paramsToDelete(),this.clientToDelete(),this.callbackDelete);
		}
	}
	
	self.prototype.deleteById = function(id){
		this["delete"]({id: id});
	}
	
	self.prototype.callbackDelete = function(response,client){
		client.onSuccess = client.self.successDelete;
		client.onError = client.self.errorDelete;
		client.self.callback(response,client);
	}
	
	self.prototype.successDelete = function(response,client){
		client.log.msg = client.self.message.delete.success;
		client.log.class = "alert-success";
		client.log.success(client.self.scope);
		client.self.close();
		client.self.afterDelete(response,client,true);
	}

	self.prototype.errorDelete = function(response,client){
		console.log(response);
		client.log.class = "alert-danger";
		client.log.msg = client.self.message.delete.error;
		client.self.afterDelete(response,client,false);
	}
	
	self.prototype.afterDelete = function(response,client,status){
		
	}
	
	/***********/
	/*PAGINATOR*/
	/***********/
	
	self.prototype.setPages = function(){
		this.totalpages = Math.ceil(this.total / this.rowsByPage);
		this.pages = [];
		for(var i=1;i<=this.totalpages;i++){
			this.pages.push(i);
		}
		this.selectedPage = 1;
	}
	
	self.prototype.gotoFirstPage = function(){
		this.obtained = (1*this.rowsByPage) - this.rowsByPage;
		this.getCollection();
		this.selectedPage = 1;
	}
	
	self.prototype.gotoPage = function(page){
		this.obtained = (page*this.rowsByPage) - this.rowsByPage;
		this.getCollection();
		this.selectedPage = page;
	}
	
	self.prototype.gotoLastPage = function(){
		this.obtained = (this.pages[this.pages.length-1]*this.rowsByPage)-this.rowsByPage;
		this.getCollection();
		this.selectedPage = this.pages.length;
	}

	self.prototype.gotoPrev = function(){
		if(this.selectedPage!=1){
			this.gotoPage(this.selectedPage-1);
		}
	}
	
	self.prototype.gotoNext = function(){
		if(this.pages.length>this.selectedPage){
			this.gotoPage(this.selectedPage+1);
		}
	}

	self.prototype.isSelected = function(page){
		return (page==this.selectedPage)?"active":"";
	}
	
	self.prototype.getPages = function(){
		if(this.pages.length <= 10){
			return this.pages;
		}else{
			if(this.selectedPage<=5){
				return this.pages.slice(0,10);
			}else{
				return this.pages.slice(this.selectedPage-5,this.selectedPage-5+10);
			}
		}
	}
	
	/**************/
	/*REST SERVICE*/
	/**************/
	
	self.prototype.serviceCreate = function(METHOD,URL,HASBODY,headerContentType){

		var fncParams = function(METHOD){
			return function(params,cli,cb,ct){
				self.prototype.execute(METHOD,self.prototype.URIBuild(URL,params),undefined,cb,cli,headerContentType);
			}
		};
		
		var fncBody = function(METHOD){
			return function(params,body,cli,cb,ct){
				self.prototype.execute(METHOD,self.prototype.URIBuild(URL,params),body,cb,cli,headerContentType);
			}
		};
		
		if(METHOD=="GET" || METHOD=="DELETE"){
			return fncParams(METHOD);
		}else{
			HASBODY = (HASBODY==undefined)?true:HASBODY;
			return (HASBODY)?fncBody(METHOD):fncParams(METHOD);
		}
	}
	
	self.prototype.URIBuild = function(uri,params){
		for(var attr in params){
			uri = uri.replace(":"+attr,params[attr]);
		}
		return uri;
	}
	
	self.prototype.execute = function(method,url,body,callback,client,headerContentType){
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {if (xhttp.readyState == 4) {callback(xhttp,client);}};
		xhttp.open(method,url);
		if(body!=undefined){
			if(headerContentType!=""){
				xhttp.setRequestHeader("Content-Type", headerContentType);
			}
			xhttp.send(body);
		}else{
			xhttp.send();
		}
	}
	
	return self;
	
};

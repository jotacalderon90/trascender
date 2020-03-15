app.controller("pollCtrl", function(trascender,$scope){
	
	this.user = new trascender({
		increase: true,
		baseurl: "/api/document/user",
		start: function(){
			this.query = {notification: true};
			this.getTotal();
			this.emails = [];
			this.roles = [];
		},
		afterGetTotal: function(){
			this.getCollection();
		},
		formatToClient: function(doc){
			this.emails.push(doc.email);
			for(let i=0;i<doc.roles.length;i++){
				if(this.roles.indexOf(doc.roles[i])==-1){
					this.roles.push(doc.roles[i]);
				}
			}
			return doc;
		},
		beforeGetCollection: function(){
			this.options = {skip: this.obtained, limit: this.rowsByPage};
			this.collectionLog = this.addLog(this.message.collection.on);
			return true;
		},
		afterGetCollection: function(){
			if(this.obtained<this.cant){
				this.getCollection();
			}
		},
		getByEmail: function(email){
			return this.coll.filter(function(r){
				return r.email == email;
			});
		},
		getByRol: function(rol){
			return this.coll.filter(function(r){
				return r.roles.indexOf(rol)>-1;
			});
		}
	});
	
	var instances = {
		collection: function(){
			return new trascender({
				baseurl: "api/poll",
				start: function(){
					this.options.projection = {"title":1,"status":1};
					this.getTotal();
				},
				beforeGetTotal: function(){
					this.obtained = 0;
					this.coll = [];
					return true;
				},
				afterGetTotal: function(){
					this.getCollection();
				},
				afterGetCollection: function(){
					$scope.$digest(function(){});
				}
			});
		},
		document: function(){
			return new trascender({
				baseurl: "api/poll",
				start: function(){
					CKEDITOR.replace("input_content");
					this.service_start = this.serviceCreate("PUT", "api/poll/start/:id",true,"");
					this.service_notify = this.serviceCreate("PUT", "api/poll/notify/:id/:to",true,"");
				},
				default: function(){
					return {title: "", content: "", accounts: [], options: [], status: "Inicial", private: false, anon: false, anons: []};
				},
				afterChangeMode: function(action,doc){
					switch(action){
						case "new":
							CKEDITOR.instances["input_content"].setData("");
							CKEDITOR.instances["input_content"].setReadOnly(false);
						break;
						case "read":
							CKEDITOR.instances["input_content"].setReadOnly(true);
							this.read(this.doc._id);
						break;
						case "edit":
							CKEDITOR.instances["input_content"].setReadOnly(false);
						break;
					}
				},
				formatToClient: function(doc){
					
					doc.sending = (typeof doc.accounts=="string")?doc.accounts.split("\n"):doc.accounts;
					doc.sending_status = [];
					for(let i=0;i<doc.sending.length;i++){
						doc.sending_status.push(0);
					}
					
					doc.accounts = (typeof doc.accounts=="string")?doc.accounts:doc.accounts.join("\n");
					
					for(let i=0;i<doc.options.length;i++){
						doc.options[i] = {text: doc.options[i]};
					}
					
					return doc;
					
				},
				afterRead: function(){
					CKEDITOR.instances["input_content"].setData(this.doc.content);
					$("#modalDocument").modal("show");
					$scope.$digest(function(){});
				},
				formatToServer: function(doc){
					delete doc.sending;
					delete doc.sending_status;
					doc.content = CKEDITOR.instances["input_content"].getData();
					doc.accounts = doc.accounts.split("\n");
					for(let i=0;i<doc.options.length;i++){
						doc.options[i] = doc.options[i].text;
					}
					this.status_sender = (doc.status=="Enviada")?doc._id:null;
					return doc;
				},
				beforeCreate: function(){
					return confirm("confirme creación del documento");
				},
				afterCreate: function(){
					if(this.status_sender!=null){
						this.start_plebiscite(this.status_sender);
					}else{
						location.reload();
					}
				},
				beforeUpdate: function(){
					return confirm("confirme actualización del documento");
				},
				paramsToUpdate: function(){
					return {id: this.doc._id};
				},
				afterUpdate: function(){
					if(this.status_sender!=null){
						this.start_plebiscite(this.status_sender);
					}else{
						location.reload();
					}
				},
				beforeDelete: function(){
					return confirm("confirme eliminación del documento");
				},
				paramsToDelete: function(){
					return {id: this.doc._id};
				},
				afterDelete: function(){
					location.reload();
				},
				loadUsers: function(rol){
					if(this.getDoc().accounts!=""){
						this.getDoc().accounts+="\n";
					}
					switch(rol){
						case "*":
							this.getDoc().accounts += self.user.emails.join("\n");
						break;
						default:
							this.getDoc().accounts += self.user.getByRol(rol).map(function(r){return r.email;}).join("\n");
						break;
					}
				},
				
				start_plebiscite: async function(id){
					try{
						alert("Iniciando encuesta");
						await this.service_start({id: id});
						alert("Encuesta iniciada correctamente");
					}catch(e){
						alert("Error al iniciar encuesta: " + e.toString());
						console.log(e);
					}
					location.reload();
				},
				
				notifyAll: function(){
					for(let i=0;i<this.doc.sending.length;i++){
						this.notify(this.doc._id,this.doc.sending[i],i);
					}
				},
				notify: async function(id,to,index){
					try{
						this.doc.sending_status[index] = 1;
						await this.service_notify({id: id, to: to.trim()});
						this.doc.sending_status[index] = 2;
					}catch(e){
						this.doc.sending_status[index] = 3;
					}
					$scope.$digest(function(){});
				},
				getSendingStatus: function(index){
					return this.doc.sending_status[index];
				}
			});
		}
	}
	
	for(instance in poll_instances){
		this[poll_instances[instance]] = new instances[poll_instances[instance]]();
	}
	
	var self = this;
	
});
app.controller("mailingCtrl", function(trascender,$scope){
	
	var self = this;
	
	this.template = new trascender({
		increase: true,
		service: {
			total: 		["GET", "/api/mailing/file/" + btoa("/") + "/total"],
			collection: ["GET", "/api/mailing/file/" + btoa("/") + "/collection"],
			read: 		["GET", "/api/mailing/file/:id"]
		},
		start: function(){
			this.getTotal();
		},
		afterGetTotal: function(){
			this.getCollection();
		},
		formatToClient: function(doc){
			doc = {id: doc, name: doc.replace(".html","")};
			return doc;
		},
		afterGetCollection: function(){
			if(this.obtained<this.cant){
				this.getCollection();
			}else{
				$scope.$digest(function(){});
			}
		},
		select: async function(){
			try{
				if(this.doc!=""){
					this.content = await this.service_read({id: btoa("/" + this.doc + ".html")});
					this.metadata = this.getMetadata(this.content);
					$("#dvTemplate").html(this.content);
					$scope.$digest(function(){});
				}
			}catch(e){
				alert(e);
			}
		},
		getMetadata: function(template){
			var rows = [];
			while(template.indexOf("{{")>-1){
				var index1 = template.indexOf("{{");
				var tmp = template.substring(index1);
				var index2 = tmp.indexOf("}}");
				var tempTemplate = tmp.substring(2,index2);
				rows.push({name: tempTemplate,type: "static", value: ""});
				template = template.split("{{"+tempTemplate+"}}").join("metadata");
			}
			return rows;
		}
	});
	
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
			}else{
				$scope.$digest(function(){});
				/*$( "#to" ).autocomplete({
					source: this.emails
				});*/
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

	this.mailing = new trascender({
		service: {
			create: ["POST","/api/mailing/message"]
		},
		start: function(){
			this.to = "";
			this.subject = "";
		},
		load: function(rol){
			if(this.to!=""){
				this.to+=",";
			}
			switch(rol){
				case "*":
					this.to+=self.user.emails.join(",");
				break;
				default:
					this.to+=self.user.getByRol(rol).map(function(r){return r.email;}).join(",");
				break;
			}
		},
		plane: function(){
			try{
				let p = prompt("Ingrese el mensaje");
				if(p==null){
					return;
				}
				if(confirm("confirme envío de correo")){
					this.to = this.to.split(",");
					for(let i=0;i<this.to.length;i++){
						let user = self.user.getByEmail(this.to[i]);
						if(user.length==1){
							user = user[0];
							this.newdoc = {
								to: this.to[i],
								subject: this.subject,
								text: p,
								html: p
							};
							this.create();
						}
					}
					alert("email enviado");
				}
			}catch(e){
				alert(e);
			}
		},
		process: function(){
			try{
				if(confirm("confirme envío de correo")){
					this.to = this.to.split(",");
					for(let i=0;i<this.to.length;i++){
						let user = self.user.getByEmail(this.to[i]);
						if(user.length==1){
							user = user[0];
							let html = $("#dvTemplate").html();
							for(var x=0;x<self.template.metadata.length;x++){
								let m = self.template.metadata[x];
								if(m.type=="static"){
									html = html.split("{{"+m.name+"}}").join(m.value);
								}else if(m.type=="document"){
									html = html.split("{{"+m.name+"}}").join(user[m.name]);
								}
							}
							html = html.split("--hash--").join(btoa(user.password));
							this.newdoc = {
								to: this.to[i],
								subject: this.subject,
								text: html,
								html: html
							};
							this.create();
						}
					}
					alert("email enviado");
				}
			}catch(e){
				alert(e);
			}
		}
	});
	
});
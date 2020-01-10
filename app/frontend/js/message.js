app.controller("messageCtrl", function(trascender,$scope){
	self = this;
	this.message = new trascender({
		service: {
			create: ["POST","/api/message"]
		},
		start: function(){
			this.message.create = {
				on: "Enviando mensaje",
				error: "Error al enviar su mensaje", 
				success: "Su mensaje ha sido enviado correctamente :D"
			};
			this.new();
		},
		default: function(){
			return {email: "", message: ""}
		},
		validMail: function(data){
			let exp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			if(data!=undefined && data.trim()!="" && exp.test(data)){
				return true;
			}else{
				return false;
			}
		},
		beforeCreate: function(doc){
			
			if(!this.validMail(doc.email)){
				alert("Email inválido");
				return false;
			}
			
			try{
				doc["g-recaptcha-response"] = grecaptcha.getResponse();
			}catch(e){
				if(e.toString()!="ReferenceError: grecaptcha is not defined"){
					console.log(e);
				}
			}
			
			let msg = "";
			for(item in doc){
				msg += item + ": " + doc[item] + "<br>";
			}
			doc.message = msg;
			
			this.createLog = this.addLog(this.message.create.on);
			
			//crear documento en paralelo
			self.message_document.newdoc = doc;
			self.message_document.create();
			
			return true;
		},
		afterCreate: function(success, xhttp){
			$scope.$digest(function(){});
			this.new();
		}
	});
	this.message_document = new trascender({
		service: {
			create: ["POST","/api/message/document"]
		},
		start: function(){
			this.new();
		},
		beforeCreate: function(){
			console.log("doc message creating");
			return true;
		},
		afterCreate: function(){
			console.log("doc message created");
		}
	});
});
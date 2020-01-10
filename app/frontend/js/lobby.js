app.controller("lobbyCtrl", function(transcend,$scope){
	 
	let self = this;
	
	//lobby
	self.lobby = new transcend({
		scope:$scope, 
		baseurl: "api/lobby",
		start: function(){
			this.new();
			
			$("#form input").bind("cut copy paste",function(e) {
				e.preventDefault();
			});
			
			if(typeof global!="undefined" && global.admin){
				if(global.admin==1){
					this.startFromAdmin_collection();
				}else if(global.admin==2){
					this.startFromAdmin_document();
				}
			}
		},
		startFromAdmin_collection: function(){
			this.coll = [];
			for(let i=0;i<global.coll.length;i++){
				this.coll.push(this.formatToClient(global.coll[i]));
			}
		},
		startFromAdmin_document: function(){
			this.doc = this.formatToClient(global.document);
		},
		reload_document: function(){
			if(typeof global!="undefined" && global.admin==2){
				this.startFromAdmin_document();
			}
		},
		paramsToGetTotal: function(){
			let querystring = {};
			if(this.filter.user!=undefined && this.filter.user!=null && this.filter.user.trim()!=""){
				querystring.user = this.filter.user;
			}
			if(this.filter.code!=undefined && this.filter.code!=null && this.filter.code.trim()!=""){
				querystring.code = this.filter.code;
			}
			if(this.filter.date_start!=undefined && this.filter.date_start!=null){
				querystring.date_start = this.filter.date_start.toISOString().split("T")[0];
			}
			if(this.filter.date_end!=undefined && this.filter.date_end!=null){
				querystring.date_end = this.filter.date_end.toISOString().split("T")[0];
			}
			return {from: this.obtained, querystring: "&querystring=" + btoa(JSON.stringify(querystring))};
		},
		paramsToGetCollection: function(){
			return this.paramsToGetTotal();
		},
		paramsToUpdate: function(){
			return {id: this.doc._id.toString()};
		},
		beforeGetTotal: function(){
			this.obtained = 0;
			this.coll = [];
			return true;
		},
		afterGetTotal: function(){
			this.getCollection();
		},
		default: function(){
			return {_02_domicilio: "",_02_fono: "",_02_giro:"",_02_domicilio:"",_03_giro:"",_03_actividad:"",_03_domicilio:"",_06_asistentes: [], temp: {}};
		},
		formatToClient: function(doc){
			doc.createdv = doc.created.split("T")[0];
			doc.created2 = new Date(doc.created);
			doc.created_year = doc.created2.getFullYear();
			doc.created_month = doc.created2.getMonth();
			doc.created_day = doc.created2.getDay();
			doc.lobista = this.formatToClient_lobista(doc["_01_sujetopasivo"]);
			doc.estado = this.formatToClient_status(doc["status"]);
			doc.detalle = doc["_05_detalle"].substr(0,20) + "...";
			doc.status = doc.status.toString();//se pasa a string por conflicto con <select> 
			if(doc.admin_schedule_date){
				doc.admin_schedule_date = new Date(doc.admin_schedule_date);
			}
			if(doc.admin_schedule_time){
				doc.admin_schedule_time = doc.admin_schedule_time.split(":")
				let tmp = new Date();
				tmp.setHours(parseInt(doc.admin_schedule_time[0]),parseInt(doc.admin_schedule_time[1]),0,0);
				doc.admin_schedule_time = tmp;
			}
			
			return doc;
		},
		formatToClient_lobista: function(id){
			return global.lobby_user.filter(function(row){
				return row["_id"] == id;
			})[0];
		},
		formatToClient_status: function(status){
			switch(status){
				case 10:
				return "Pendiente";
				break;
				case 20:
				return "Rechazada";
				break;
				case 30:
				return "Derivada";
				break;
				case 40:
				return "Agendada";
				break;
				case 50:
				return "Publicada";
				break;
				default:
				return "No definido";
				break;
			}
		},
		formatToServer: function(doc){
			
			if(!(typeof global!="undefined" && global.admin)){
				doc["g-recaptcha-response"] = grecaptcha.getResponse();
			}
			
			doc.status = parseInt(doc.status)//se vuelve a int por conflicto con <select> 
			
			delete doc.temp;
			delete doc.createdv;
			delete doc.created_year;
			delete doc.created_month;
			delete doc.created_day;
			delete doc.created2;
			delete doc.lobista;
			delete doc.estado;
			delete doc.detalle;
			
			if(doc["_06_asistentes"]){
				for(let i=0;i<doc["_06_asistentes"].length;i++){
					delete doc["_06_asistentes"][i]["$$hashKey"];
					delete doc["_06_asistentes"][i]["title"];
				}
			}
			
			if(doc["admin_schedule_time"]!=undefined){
				doc["admin_schedule_time"] = doc["admin_schedule_time"].getHours() + ":" + doc["admin_schedule_time"].getMinutes();
			}
			
			return doc;
		},
		validToServer: function(doc){
			//validar datos obligatorios segun criterios
			let fields = ["_01_sujetopasivo","_02_tipopersona","_02_nombre","_02_nacionalidad","_02_rut","_02_correo","_02_correo_confirmacion","_03_representatercero","_04_reciberemuneracion","_05_detalle"];
			
			if(doc["_02_tipopersona"]=="Natural"){
				fields.push("_02_apaterno");
				fields.push("_02_amaterno");
			}
			if(doc["_02_tipopersona"]=="Jurídica"){
				fields.push("_02_representantelegal");
			}
			if(doc["_03_representatercero"]=="Si"){
				fields.push("_03_tipopersona");
				fields.push("_03_nombre");
				if(doc["_03_tipopersona"]=="Natural"){
					fields.push("_03_apaterno");
					fields.push("_03_amaterno");
					fields.push("_03_nacionalidad");
					fields.push("_03_rut");
				}
				if(doc["_03_tipopersona"]=="Jurídica"){
					fields.push("_03_nacionalidad");
					fields.push("_03_rut");
					fields.push("_03_representantelegal");
				}
				if(doc["_03_tipopersona"]=="Sin personalidad jurídica"){
					fields.push("_03_actividad");
				}
			}
			
			let empty = [];
			for(let i=0;i<fields.length;i++){
				if(doc[fields[i]]==undefined || doc[fields[i]].trim()==""){
					empty.push(fields[i]);
				}
			}
			
			if(empty.length > 0){
				this.reload_document();
				alert("Faltan campos obligatorios");
				return false;
			}
			
			//validar correo
			if(doc["_02_correo"]!=doc["_02_correo_confirmacion"]){
				this.reload_document();
				alert("El correo de confirmación no coincide");
				return false;
			}
			
			//validar segun estado
			if(doc.status){
				switch(doc.status){
					case 30:
						//validar destinatario
						if(doc["admin_derive_user"]==undefined || doc["admin_derive_user"].trim()==""){
							this.reload_document();
							alert("Debe seleccionar destinatario");
							return false;
						}
					break;
					case 40:
						//validar fecha/hora
						if(doc["admin_schedule_date"]==undefined || doc["admin_schedule_time"]==undefined){
							this.reload_document();
							alert("Debe seleccionar fecha y hora de agendamiento");
							return false;
						}
					break;
				}
			}
			
			//validar captcha
			if(typeof global!="undefined" && global.admin){
				//no valida para miembros de la aplicacion
			}else{
				if(doc["g-recaptcha-response"]==undefined || doc["g-recaptcha-response"].trim()==""){
					alert("Favor validar recaptcha");
					return false;
				}
			}
			
			return true;
		},
		afterCreate: function(r,c,s){
			if(s){
				window.location.href = "/?message=Su solicitud ha sido creada correctamente, su código de audiencia es: " + r.data.det;
			}else{
				console.log(r);
				window.location.href = "/?message=Ha ocurrido un error inesperado, pruebe nuevamente más tarde. Error (" + r.data.error + ")";
			}
		},
		afterUpdate: function(r,c,s){
			let message = "";
			try{
				let res = JSON.parse(r.responseText);
				if(res.data){
					message += "La solicitud ha sido actualizada correctamente";
				}else{
					message += "Ha ocurrido un error de " + res.error + ", " + res.message;
				}
			}catch(e){
				message += "Ha ocurrido un error inesperado, pruebe nuevamente más tarde. Error (" + e.toString() + ")";
			}
			let href = window.location.href;
			if(href.indexOf("?message=")){
				href = href.split("?message=");
				href = href[0] + "?message=" + message;
			}else{
				href = href + "?message=" + message;
			}
			window.location.href = href;
		},
		formatFilter: function(){
			if(this.filter_created_temp!=null && this.filter_created_temp!=undefined){
				this.filter.created_year = this.filter_created_temp.getFullYear();
				this.filter.created_month = this.filter_created_temp.getMonth();
				this.filter.created_day = this.filter_created_temp.getDay();
			}else{
				this.filter.created_year = undefined;
				this.filter.created_month = undefined;
				this.filter.created_day = undefined;
			}
		},
		getStatusClass: function(){
			if(this.doc==undefined || this.doc==null){
				return "";
			}else{
				switch(this.doc.status){
					case 10:
						return "alert-warning";
					break;
					case 20:
						return "alert-danger";
					break;
					case 30:
						return "alert-info";
					break;
					case 40:
						return "alert-success";
					break;
					case 50:
						return "alert-success";
					break;
				}
			}
		}
	});
	
});
app.controller("storyCtrl", function(trascender,$scope){
	
	if(typeof user!="undefined"){
		this.user = user;
		this.user.isAdmin = function(){
			if(this.doc && this.doc.roles && (this.doc.roles.indexOf("admin")>-1)){
				return true;
			}else{
				return false;
			}
		}
	}
	
	var instances = {
		collection: function(){
			return new trascender({
				increase: true,
				scrolling: true,
				baseurl: "/api/story",
				start: function(){
					window.title = document.getElementsByTagName("title")[0].innerHTML.trim();
					this.query = (window.title!="Story")?{tag: window.title}:{};
					this.months =["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
					this.sorted = -1;
					this.getAll = false;
					this.fulltext = "";
					this.getTotal();
					this.getTag();
				},
				beforeGetTotal: function(){
					this.getAll = false;
					this.obtained = 0;
					this.coll = [];
					
					if(this.fulltext.trim()!=""){
						this.query["$text"] = {"$search": this.fulltext};
					}
					
					return true;
				},
				afterGetTotal: function(){
					this.getCollection();
				},
				beforeGetCollection: function(){
					this.options.sort = {year: this.sorted, month: this.sorted, day: this.sorted, title: this.sorted};
					return true;
				},
				afterGetCollection: function(){
					if(this.getAll){
						if(this.obtained < this.cant){
							this.getCollection();
						}else{
							$scope.$digest(function(){});
						}
					}else{
						$scope.$digest(function(){});
					}
				},
				formatToClient: function(doc){
					if(doc.year<0){
						doc.fecha = doc.year.toString().replace("-","") + " (ac)";
						doc.fechat = doc.fecha;
					}else{
						if(isNaN(doc.month) || doc.month==0){
							doc.fecha = moment([doc.year,1,1], "YYYYMMDD").fromNow();
							doc.fechat = "Alrededor del año " + doc.year;
						}else{
							doc.mes = doc.month;
							if(isNaN(doc.day) || doc.day==0){
								doc.fecha = moment([doc.year,doc.mes,1], "YYYYMMDD").fromNow();
								doc.fechat = this.months[doc.month-1] + " del año " + doc.year;
							}else{
								doc.dia = doc.day;
								doc.fecha = moment([doc.year,doc.mes,doc.dia], "YYYYMMDD").fromNow();
								doc.fechat = moment([doc.year,doc.mes-1,doc.dia]).format("dddd, DD MMMM YYYY");
							}
						}
					}
					if(doc.tag){
						doc.tag_inline = doc.tag.join(",");
					}
					if(doc.font){
						doc.font_inline = doc.font.join(",");
					}
					return doc;
				},
				getSortInfo: function(type){
					switch(type){
						case "label":
							return (this.sorted==-1)?"descendente":"ascendente";
						break;
						case "class":
							return (this.sorted==-1)?"desc":"asc";
						break;
					}
				}
			});
		},
		document: function(){
			return new trascender({
				baseurl: "/api/story",
				paramsToUpdate: function(){
					return {id: this.doc._id};
				},
				paramsToDelete: function(){
					return {id: this.doc._id};
				},
				beforeCreate: function(){
					return confirm("Confirme");
				},
				beforeUpdate: function(){
					return confirm("Confirme");
				},
				beforeDelete: function(){
					return confirm("Confirme");
				},
				afterCreate: function(){location.reload();},
				afterUpdate: function(){location.reload();},
				afterDelete: function(){location.reload();},
				formatToServer: function(doc){
					doc.font = doc.font_inline.split(",");
					doc.tag = doc.tag_inline.split(",");
					delete doc.font_inline;
					delete doc.tag_inline;
					delete doc["$$hashKey"];
					return doc;
				}
			});
		},
		dayastoday: function(){
			return new trascender({
				increase: true,
				scrolling: true,
				baseurl: "/api/story",
				start: function(){
					let d = new Date();
					this.query = {day: d.getDate(),month: d.getMonth() + 1};
					this.months =["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
					this.options.sort = {year: -1, month: -1, day: -1, title: -1};
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
					if(this.obtained < this.cant){
						this.getCollection();
					}else{
						$scope.$digest(function(){});
					}
				},
				formatToClient: function(doc){
					if(doc.year<0){
						doc.fecha = doc.year.toString().replace("-","") + " (ac)";
						doc.fechat = doc.fecha;
					}else{
						if(isNaN(doc.month) || doc.month==0){
							doc.fecha = moment([doc.year,1,1], "YYYYMMDD").fromNow();
							doc.fechat = "Alrededor del año " + doc.year;
						}else{
							doc.mes = doc.month;
							if(isNaN(doc.day) || doc.day==0){
								doc.fecha = moment([doc.year,doc.mes,1], "YYYYMMDD").fromNow();
								doc.fechat = this.months[doc.month-1] + " del año " + doc.year;
							}else{
								doc.dia = doc.day;
								doc.fecha = moment([doc.year,doc.mes,doc.dia], "YYYYMMDD").fromNow();
								doc.fechat = moment([doc.year,doc.mes-1,doc.dia]).format("dddd, DD MMMM YYYY");
							}
						}
					}
					if(doc.tag){
						doc.tag_inline = doc.tag.join(",");
					}
					if(doc.font){
						doc.font_inline = doc.font.join(",");
					}
					return doc;
				}
			});
		}
	}
	
	for(instance in story_instances){
		this[story_instances[instance]] = new instances[story_instances[instance]]();
	}
	
	var self = this;
	
	setTimeout(function(){$scope.$digest(function(){});}, 500);
});
			
//reemplazar elemento de array
//db.story.updateMany({ tag: "Colonia" }, { $set: { "tag.$" : "Chile Colonial" } })
//agregar elemento al array
//db.story.updateMany({},{$push:{tag:"Chile"}})
//eliminar elemento de un array
//db.story.updateMany({},{$pull:{tag:"Chile"}})
//crear indice de texto
//db.story.ensureIndex({title:"text"})
//busqueda de texto con índice
//db.story.find({$text:{$search:"manuel"}})
//indice de todos
//db.collection.ensureIndex({"$**": "text" })
//obtener elementos del array
//db.story.distinct("tag")
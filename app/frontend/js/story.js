app.controller("storyCtrl", function(trascender,$scope){
	
	if(typeof user!="undefined"){
		this.user = user;
		this.user.setAdmin(["admin"]);
	}
	
	trascender.prototype.formatToClient = function(row){
		if(row.year<0){
			row.fecha = row.year.toString().replace("-","") + " (ac)";
			row.fechat = row.fecha;
		}else{
			if(isNaN(row.month) || row.month==0){
				row.fecha = moment([row.year,1,1], "YYYYMMDD").fromNow();
				row.fechat = "Alrededor del año " + row.year;
			}else{
				row.mes = row.month;
				if(isNaN(row.day) || row.day==0){
					row.fecha = moment([row.year,row.mes,1], "YYYYMMDD").fromNow();
					row.fechat = this.months[row.month-1] + " del año " + row.year;
				}else{
					row.dia = row.day;
					row.fecha = moment([row.year,row.mes,row.dia], "YYYYMMDD").fromNow();
					row.fechat = moment([row.year,row.mes-1,row.dia]).format("dddd, DD MMMM YYYY");
				}
			}
		}
		return row;
	}
	
	let i = {
		collection: function(){
			return new trascender({
				increase: true,
				baseurl: "/api/story",
				start: function(){
					var url = new URL(location.href);
					var s = url.searchParams.get("s");
					
					window.title = document.getElementsByTagName("title")[0].innerHTML.trim();
					this.query = (window.title!="Story")?{tag: window.title}:{};
					this.months =["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
					this.sorted = (s)?parseInt(s):-1;
					this.getAll = false;
					this.fulltext = "";
					this.getTotal();
					this.getTag();
					//$(window).scroll(()=>{this.scrolling()});	
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
					this.options.skip = this.obtained;
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
				getSortInfo: function(type){
					switch(type){
						case "label":
							return (this.sorted==-1)?"descendente":"ascendente";
						break;
						case "class":
							return (this.sorted==-1)?"desc":"asc";
						break;
					}
				},
				scrolling: function(){
					if(Math.round($(window).scrollTop() + $(window).height()) == Math.round($(document).height())) {
						if(!this.isLoading && this.obtained < this.cant){
							this.getCollection();
						}
					}
				}
			});
		},
		document: function(){
			return new trascender({
				baseurl: "api/story",
				default: function(){
					return {tag: [],font:[]};
				},
				start: function(){
					if(typeof _document != "undefined"){
						this.select(_document);
					}else{
						this.new();
					}
					this.getTag();
				},
				beforeCreate: function(doc){
					return confirm("Confirme creación del documento");
				},
				afterCreate: function(s){
					if(s){
						location.href = "/story";
					}else{
						$scope.$digest(function(){});
					}
				},
				beforeUpdate: function(doc){
					return confirm("Confirme actualización del documento");
				},
				afterUpdate: function(s){
					if(s){
						location.reload();
					}else{
						$scope.$digest(function(){});
					}
				},
				beforeDelete: function(){
					return confirm("Confirme eliminación del documento");
				},
				afterDelete: function(s){
					if(s){
						location.href = "/story";
					}else{
						$scope.$digest(function(){});
					}
				},
				formatToServer: function(doc){
					delete doc.tagbk;
					delete doc.fontgbk;
					return doc;
				},
				addTag: function(event){
					if(event.which === 13) {
						if(this.getDoc().tag.indexOf(this.getDoc().tagbk)==-1){
							this.getDoc().tag.push(this.getDoc().tagbk);
							this.getDoc().tagbk = "";
						}
					}
				},
				removeTag: function(i){
					this.getDoc().tag.splice(i,1);
				},
				addFont: function(event){
					if(event.which === 13) {
						if(this.getDoc().font.indexOf(this.getDoc().fontbk)==-1){
							this.getDoc().font.push(this.getDoc().fontbk);
							this.getDoc().fontbk = "";
						}
					}
				},
				removeFont: function(i){
					this.getDoc().font.splice(i,1);
				},
				afterGetTag: function(){
					$(".input_tag").autocomplete({source: this.tag, select: ( event, ui )=>{
						this.getDoc().tagbk = ui.item.value;
					}});
				}
			});
		},
		resume: function(){
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
				}
			});
		}
	}
	
	for(instance in instances.story){
		this[instances.story[instance]] = new i[instances.story[instance]]();
	}
	
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
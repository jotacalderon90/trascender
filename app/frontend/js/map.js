app.controller("storyCtrl", function(trascender,$scope){
	
	var self = this;
	
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
				baseurl: "/api/story",
				months:  ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
				index: 0,
				start: async function(){
					
					await self.user.checkUser();
					
					this.audio = document.getElementById("audio");
					this.speech = document.getElementById("speech");
					this.audio.volume = 0.4;
					this.speech.onended = this.speechEnd(this);

					this.loadMap();
					
					//{latitud: {$nin: [null,""]},longitud :{$nin: [null,""]}};
					this.query = {};

					let url = new URL(location.href);
					let c = url.searchParams.get("tag");
					if(c!=null){
						this.query.tag = c;
					}
					c = url.searchParams.get("nospeech");
					if(c!=null){
						this.speech = null;
						$(".to-speech").fadeOut();
					}
					
					this.options = {sort: {year: 1, month: 1, day: 1, title: 1}, limit: 10, skip: this.obtained};
					
					this.getTag();
					
				},
				afterGetTag: function(){
					this.getTotal();
				},
				loadMap: function(){
					let lat = -33.59875863395195;
					let lng = -70.7080078125;
					this.map = L.map("map").setView([lat, lng],3);
					
					let mapLink = '<a href="http://www.esri.com/">Esri</a>';
					let wholink = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';	
					L.tileLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}g").addTo(this.map);
					
					this.marker = L.marker([lat, lng]).addTo(this.map);
					this.refresh();
				},
				refresh: async function(){
					if(self.user.isAdmin()){
						let drawnItems = L.featureGroup().addTo(this.map);
						L.control.layers({}, { 'drawlayer': drawnItems }, { position: 'topleft', collapsed: false }).addTo(this.map);
						this.map.addControl(new L.Control.Draw({
							edit: {
								featureGroup: drawnItems,
								poly: {
									allowIntersection: false
								}
							},
							draw: {
								polygon: {
									allowIntersection: false,
									showArea: true
								}
							}
						}));
						this.map.on(L.Draw.Event.CREATED, (event)=>{this.onDragMarker(event);});
						
						$(".leaflet-control-layers-toggle,"+
						".leaflet-draw-draw-polyline,"+
						".leaflet-draw-draw-polygon,"+
						".leaflet-draw-draw-rectangle,"+
						".leaflet-draw-draw-circle,"+
						".leaflet-draw-draw-marker,"+
						".leaflet-draw-draw-circlemarker,"+
						".leaflet-draw-edit-edit,"+
						".leaflet-draw-edit-remove").css("display","none");
						
					}
				},
				onDragMarker: function(event){
					let layer = event.layer;
					self.document.getDoc().CENTER = this.map.getCenter();
					self.document.getDoc().ZOOM = this.map.getZoom();
					self.document.getDoc().LNG = layer.toGeoJSON().geometry.coordinates[0];
					self.document.getDoc().LAT = layer.toGeoJSON().geometry.coordinates[1];
					$('#mdDoc').modal('show');
					$scope.$digest(function(){});
				},
				speechEnd: function(me){
					return function(){
						if(me.inprocess){
							$("article").fadeOut();
							setTimeout(function(){
								me.next();
								$scope.$digest(function(){});
							}, 2000);
						}
					}					
				},
				afterGetTotal: function(){
					this.getCollection();
				},
				formatToClient: function(doc){
					//date format
					if(doc.year<0){
						doc.fecha = doc.year.toString().replace("-","") + " (ac)";
						doc.fechat = doc.fecha;
					}else{
						if(isNaN(doc.month) || doc.month==0){
							doc.fecha = moment([doc.year,1,1], "YYYYMMDD").fromNow();
							doc.fechat = "Alrededor del año " + doc.year;
							doc.date = new Date(doc.year,0,1);
						}else{
							doc.mes = doc.month;
							if(isNaN(doc.day) || doc.day==0){
								doc.fecha = moment([doc.year,doc.mes,1], "YYYYMMDD").fromNow();
								doc.fechat = this.months[doc.month-1] + " del año " + doc.year;
								doc.date = new Date(doc.year,doc.month-1,1);
							}else{
								doc.dia = doc.day;
								doc.fecha = moment([doc.year,doc.mes,doc.dia], "YYYYMMDD").fromNow();
								doc.fechat = moment([doc.year,doc.mes-1,doc.dia]).format("dddd, DD MMMM YYYY");
								doc.date = new Date(doc.year,doc.month-1,doc.day);
							}
						}
					}
					
					/*mejora fechat
					if(doc.fechat.indexOf(",")>-1){
						let a = doc.fechat.split(",");
						a[1] = a[1].trim().split(" ");
						a[1][0] = (a[1][0].indexOf("0")==0)?a[1][0].replace("0",""):a[1][0];
						doc.fechat = a[0] + ", " + a[1][0] + " de " + a[1][1] + " del año " + a[1][2];
					}*/
					
					return doc;
				},
				afterGetCollection: function(){
					this.load();
				},
				load: function(){
					if(this.coll[this.index]){
						this.select(this.coll[this.index]);
					}else{
						this.getCollection();
					}
				},
				afterChangeMode: async function(action,doc){
					self.document.getCollection();
				},
				afterGetMapInfo: function(doc){
					
					if(doc==null){
						this.map.removeLayer(this.marker);
						return;
					}
					this.marker.addTo(this.map);
					this.marker.setLatLng([doc.LAT, doc.LNG]);
					this.map.setView([doc.LAT, doc.LNG],((doc.ZOOM)?doc.ZOOM:3));
					
					this.audio.src = doc.AUDIO;
					this.audio.currentTime = 0;
					this.audio.play();
					
					if(this.speech!=null){
						let speech = (this.doc.title + " " + this.doc.resume).toLowerCase();
						speech = speech.split("ñ").join("ni");
						speech = speech.split("á").join("a");
						speech = speech.split("é").join("e");
						speech = speech.split("í").join("i");
						speech = speech.split("ó").join("o");
						speech = speech.split("ú").join("u");
						speech = speech.split("ll").join("y");
						speech = speech.split(" ").join("");
						speech = speech.split(".").join("");
						speech = "/map/audio/" + speech;
						
						this.speech.src = speech;
						this.speech.currentTime = 0;
						this.speech.play();
					}
					
					$("article").fadeIn();
				},
				prev: function(){
					this.index--;
					if(this.index==-1){
						this.index=0;
					}
					this.load();
				},
				next: function(){
					this.index++;
					if(this.index==this.total){
						this.index=0;
					}
					this.load();
				},
				play: function(){
					this.inprocess = true;
					this.next();
				},
				stop: function(){
					this.inprocess = false;
				}
			});
		},
		document: function(){
			return new trascender({
				baseurl: "/api/map",
				paramsToGetCollection: function(){
					return {query: JSON.stringify({STORY: self.collection.doc._id}), options: "{}"};
				},
				afterGetCollection: function(){
					if(this.coll.length==0){
						this.new();
						this.newdoc.STORY = self.collection.doc._id;
						self.collection.afterGetMapInfo(null);
					}else if(this.coll.length==1){
						this.edit(this.coll[0]);
						self.collection.afterGetMapInfo(this.doc);
						$scope.$digest(function(){});
					}
				},
				beforeCreate: function(){
					return confirm("Confirme creación");
				},
				beforeUpdate: function(){
					return confirm("Confirme edición");
				},
				afterCreate: function(){
					$('#mdDoc').modal('hide');
				},
				afterUpdate: function(){
					$('#mdDoc').modal('hide');
				},
				setLoc: function(){
					$('#mdDoc').modal('hide');
					$('.leaflet-draw-draw-marker').fadeIn();
				}
			});
		}
	}
	
	for(instance in map_instances){
		this[map_instances[instance]] = new instances[map_instances[instance]]();
	}
	
	var self = this;
	
	setTimeout(function(){$scope.$digest(function(){});}, 500);
});
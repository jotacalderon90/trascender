app.controller("mapCtrl", function(trascender,$scope){
	
	var self = this;
	
	if(typeof user!="undefined"){
		this.user = user;
		this.user.setAdmin(["admin"]);
	}
	
	let i = {
		map: function(){
			return new trascender({
				start: async function(){
					
					await self.user.checkUser();
					
					let lat = -33.59875863395195;
					let lng = -70.7080078125;
					this.map = L.map("map").setView([lat, lng],3);
					let mapLink = '<a href="http://www.esri.com/">Esri</a>';
					let wholink = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';	
					L.tileLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}g").addTo(this.map);	
					
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
					$(".leaflet-control-zoom").css("display","none");
					$(".leaflet-control-layers").css("display","none");
					
				},
				onDragMarker: function(event){
					let layer = event.layer;
					self.document.getDoc().CENTER = this.map.getCenter();
					self.document.getDoc().ZOOM = this.map.getZoom();
					self.document.getDoc().LNG = layer.toGeoJSON().geometry.coordinates[0];
					self.document.getDoc().LAT = layer.toGeoJSON().geometry.coordinates[1];
					$('#mdForm').modal('show');
					$scope.$digest(function(){});
				},
				setMarker: function(doc){
					if(this.marker){
						this.map.removeLayer(this.marker);
					}
					this.marker = L.marker([doc.LAT, doc.LNG]).addTo(this.map);
					this.map.setView([doc.LAT, doc.LNG],3, {animate: true, pan: {duration: 2 }});
				}					
			});
		},
		collection: function(){
			return new trascender({
				increase: true,
				baseurl: "/api/story",
				months:  ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
				start: function(){
					this.query.tag = "";
					this.getTag();
					
					$(document).keydown((e)=>{
						switch(e.keyCode){
							case 67:
								$("#mdCog").modal("show");
								break;
						}
					});
					
				},
				afterGetTag: function(){
					$( "#input_tag" ).autocomplete({source: this.tag, select: ( event, ui )=>{
						this.query.tag = ui.item.value;
					}});
				},
				beforeGetTotal: function(){
					this.index = -1;
					$("#dvTimeline").animate({scrollTop: 0});
					return true;
				},
				afterGetTotal: async function(){
					let d = await this.getRESUME();
					this.coll = await this.service_collection({query:JSON.stringify({tag: this.query.tag}),options:JSON.stringify({sort: {year: 1, month: 1, day: 1, title: 1}})});
					this.coll = this.formatCollectionToClient(this.coll);
					
					let years = [];
					for(let i=d[0].year;i<d[1].year+100;i=i+100){
						let d = {};
						d.label = this.centuryFromYear(i);
						d.data = this.coll.filter((r)=>{return r.epoch == d.label});
						years.push(d);
					}
					this.years = years;
					$.timeliner({});
					
					$("#mdCog").modal("hide");
					$("#dvTimeline").fadeIn();
					
					$scope.$digest(function(){});
					
					$(document).removeAttr("keydown");
					$(document).keydown((e)=>{
						switch(e.keyCode){
							case 37://left
								this.back();
								break;
							case 38://up
								this.back();
								break;
							case 39://right
								this.next();
								break;
							case 40://down
								this.next();
								break;
							case 67:
								$("#mdCog").modal("show");
								break;
							default:
								console.log(e.keyCode);
								break;
						}
					});
					
					this.next();
					
				},
				getRESUME: async function(){
					try{
						let f = await this.service_collection({query:JSON.stringify({tag: this.query.tag}),options:JSON.stringify({sort: {year: 1, month: 1, day: 1, title: 1}, limit: 1, skip: 0})});
						s=-1;
						let l = await this.service_collection({query:JSON.stringify({tag: this.query.tag}),options:JSON.stringify({sort: {year:-1, month:-1, day:-1, title:-1}, limit: 1, skip: 0})});
						return [f[0],l[0]]
					}catch(e){
						alert(e);
						console.log(e);
						return null;
					}
				},
				centuryFromYear: function(year){
					if(year==0){
						return "Año 0";
					}
					let r = null;
					if( isNaN(Number(year)) ){
						r = undefined;
					}else{
						r = Math.floor((year-1)/100) + 1;
						if(r<0){
							r = "Siglo " + this.romanize((r*-1)) + " (ac)";
						}else{
							r = "Siglo" + this.romanize(r);
						}
					}
					return r;
				},
				romanize: function(num) {
					if (!+num)
						return false;
					let digits = String(+num).split(""),
					key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM", "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC","","I","II","III","IV","V","VI","VII","VIII","IX"],
					roman = "",
					i = 3;
					while (i--)
						roman = (key[+digits.pop() + (i * 10)] || "") + roman;
					return Array(+digits.join("") + 1).join("M") + roman;
				},
				formatToClient: function(row){
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
					row.epoch = this.centuryFromYear(row.year);
					return row;
				},
				next: function(){
					this.index++;
					if(this.index - 1 > this.coll.length){
						this.index--;
					}
					this.moveTimeline(this.coll[this.index]);
					self.document.get(this.coll[this.index]._id);
				},
				back: function(){
					this.index--;
					if(this.index < 0){
						this.index = 0;
					}
					this.moveTimeline(this.coll[this.index]);
					self.document.get(this.coll[this.index]._id);
				},
				moveTimeline: function(d){
					console.log(d);
					let o = $($("#" + d._id)[0]);
					let s = o.offset().top;
					
					$("#dvTimeline").animate({scrollTop: s + $("#dvTimeline").scrollTop()}, 1500);
				}
			});
		},
		document: function(){
			return new trascender({
				baseurl: "/api/map",
				get: async function(id){
					try{
						let d = await this.service_collection({query: JSON.stringify({STORY: id}), options: "{}"});
						if(d.length==0){
							this.new();
							this.newdoc.STORY = id;
						}else if(d.length==1){
							this.edit(d[0]);
							$scope.$digest(function(){});
					
							self.map.setMarker(d[0]);
						}
					}catch(e){
						alert(e);
						console.log(e);
					}
				},
				beforeCreate: function(){
					return confirm("Confirme creación");
				},
				beforeUpdate: function(){
					return confirm("Confirme edición");
				},
				afterCreate: function(){
					$('#mdForm').modal('hide');
				},
				afterUpdate: function(){
					$('#mdForm').modal('hide');
				},
				setLoc: function(){
					$('#mdForm').modal('hide');
					$('.leaflet-draw-draw-marker').fadeIn();
				}
			});
		}
	}
	
	for(instance in instances.map){
		this[instances.map[instance]] = new i[instances.map[instance]]();
	}
	
	setTimeout(function(){$scope.$digest(function(){});}, 500);
});
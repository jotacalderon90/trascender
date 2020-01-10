app.controller("jvCtrl", function(trascender,$scope){
	
	self = this;
	
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
	
	this.jv = new trascender({
		increase: true,
		baseurl: "api/document/jv",
		start: async function(){
			let ll = [-33.49829972063037, -70.73596715927125];
			let z = 17;			
			this.lmap = new L.Map('map');
			L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}g").addTo(this.lmap);
			this.lmap.setView(ll,z);
			
			this.new();
			this.getTotal();
		},
		afterGetTotal: function(){
			this.getCollection();
		},
		afterGetCollection: function(){
			if(this.obtained<this.cant){
				this.getCollection();
			}else{
				this.refresh();
			}
		},
		formatToClient: function(doc){
			L.geoJSON(doc.geojson).addTo(this.lmap);
			return doc;
		},
		refresh: async function(){
			
			if(self.user.isAdmin()){
				let drawnItems = L.featureGroup().addTo(this.lmap);
				L.control.layers({}, { 'drawlayer': drawnItems }, { position: 'topleft', collapsed: false }).addTo(this.lmap);
				this.lmap.addControl(new L.Control.Draw({
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
				this.lmap.on(L.Draw.Event.CREATED, function (event) {
					let layer = event.layer;
					self.jv.newdoc.name = prompt("Ingrese nombre de la junta de vecinos");
					self.jv.newdoc.center = self.jv.lmap.getCenter();
					self.jv.newdoc.zoom = self.jv.lmap.getZoom();
					self.jv.newdoc.geojson = layer.toGeoJSON();
					self.jv.create();
				});
				
				$(".leaflet-control-layers-toggle,"+
				".leaflet-draw-draw-polyline,"+
				//".leaflet-draw-draw-polygon,"+
				".leaflet-draw-draw-rectangle,"+
				".leaflet-draw-draw-circle,"+
				".leaflet-draw-draw-marker,"+
				".leaflet-draw-draw-circlemarker,"+
				".leaflet-draw-edit-edit,"+
				".leaflet-draw-edit-remove").css("display","none");
				
			}
			$scope.$apply();
			$("#botonera").fadeIn();
			$("#background,#loading").fadeOut();
		},
		afterCreate: function(success,xhttp){
			if(success){
				alert("Junta de vecinos creada correctamente");
				location.reload();
			}else{
				alert("Error, revise abra la consola y presione aceptar");
				console.log(xhttp);
			}
		}
	});
	
});
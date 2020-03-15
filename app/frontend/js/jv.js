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
		this.user.service_update_ext = this.user.serviceCreate("PUT", "/user/update/ext", true, this.user.headerContentType);
		this.user.updateEXT = async function(){
			try{
				$("#mdProfile").modal('hide');
				$("#background,#loading").fadeIn();
				
				this.doc.public.tag = [];
				for(service in this.doc.services){
					if(this.doc.services[service]){
						this.doc.public.tag.push(service);
					}
				}
				await this.service_update_ext("",JSON.stringify({
					public: this.doc.public,
					jv: this.doc.jv,
					lmap: {
						center: self.user_jv.lmap.getCenter(),
						zoom: self.user_jv.lmap.getZoom()
					}
				}));
				location.reload();
			}catch(e){
				alert(e);
			}
		}
		this.user.updateEXTINTERES = async function(interest){
			try{
				await this.service_update_ext("",JSON.stringify({interest: interest}));
			}catch(e){
				console.log(e);
			}
		}
		this.user.setGeoJson = function(){
			$("#mdProfile").modal('hide');
			$(".leaflet-draw-draw-marker").fadeIn();
		}
		this.user.deleteGeoJson = function(){
			delete this.doc.public.geojson;
			this.updateEXT();
		}
	}
	
	this.jv = new trascender({
		increase: true,
		baseurl: "api/jv",
		start: function(){
			this.options.projection = {name: 1};
			//this.getTotal();
		},
		afterGetTotal: function(){
			this.getCollection();
		},
		afterGetCollection: function(){
			if(this.obtained<this.cant){
				this.getCollection();
			}else{
				$scope.$apply();
			}
		},
		afterRead: function(){
			self.user_jv.start_after_jv(this.doc);
		}
	});
	
	this.user_jv = new trascender({
		increase: true,
		baseurl: "api/user.jv",
		start: async function(){
			let intentos = 0;
			while(self.user.doc==null && intentos<2){
				intentos++;
				await this.wait(500);
			}
			
			this.services = ["Caja Vecina","Negocio","Verdulería","Carnicería","Panadería","Bazar","Ferretería","Farmacia","Informática","Musicales","Artesanía","Deportes","Sociales"];
			this.services.sort();
			self.user.doc.services = {};
			for(let i=0;i<this.services.length;i++){
				self.user.doc.services[this.services[i]] = (self.user.doc.public.tag.indexOf(this.services[i])>-1)?true:false;
			}
			
			this.start_after_jv();
			/*if(!self.user.doc.jv){
				$("#mdJV").modal('show');
			}else{
				self.jv.read(self.user.doc.jv);
			}*/
		},
		start_after_jv: async function(jv){
			this.lmap = new L.Map('map');
			L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}g").addTo(this.lmap);
			ll = [self.user.doc.lmap.center.lat,self.user.doc.lmap.center.lng];
			z = self.user.doc.lmap.zoom;
			this.lmap.setView(ll,z);
			
			//L.geoJSON(jv.geojson).addTo(this.lmap);
			
			await this.getTag();
			
			//ocultar los que no interesan
			if(self.user.doc.interest){
				for(let i=0;i<this.tag.length;i++){	
					if(self.user.doc.interest.indexOf(this.tag[i])==-1){
						this.getByTag(this.tag[i]);
					}
				}
			}
			
			await this.wait(500);
			this.refresh();
			
		},
		refresh: function(){
			
			$("#botonera").fadeIn();
			
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
				self.user.doc.public.geojson = layer.toGeoJSON();
				self.user.updateEXT();
			});
			
			$(".leaflet-control-layers-toggle,"+
			".leaflet-draw-draw-polyline,"+
			".leaflet-draw-draw-polygon,"+
			".leaflet-draw-draw-rectangle,"+
			".leaflet-draw-draw-circle,"+
			".leaflet-draw-draw-marker,"+
			".leaflet-draw-draw-circlemarker,"+
			".leaflet-draw-edit-edit,"+
			".leaflet-draw-edit-remove").css("display","none");
			
			$scope.$apply();
		},
		getTag: async function(){
			try{
				this.tag = await this.service_tag();
				for(let i=0;i<this.tag.length;i++){
					this["collection_" + this.tag[i]] = [];
					this["collection_" + this.tag[i] + "_showing"] = false;
					await this.getByTag(this.tag[i]);
				}
				this.tag = this.tag.sort();
				$("#background,#loading").fadeOut();
				$scope.$apply();
			}catch(e){
				alert(e);
				console.log(e);
			}
		},
		getByTag: async function(tag,update){
			try{
				if(this["collection_" + tag].length>0){
					let s = this["collection_" + tag + "_showing"];
					for(let i=0;i<this["collection_" + tag].length;i++){
						let d = this["collection_" + tag][i];
						if(d.marker){
							if(s){
								this.lmap.removeLayer(d.marker);
							}else{
								d.marker.addTo(this.lmap);//.on("click", this.onMarker(d));
							}
						}						
					}
					this["collection_" + tag + "_showing"] = !s;
					
					//get interest to show for save
					if(update){
						let t = []; 
						for(let i=0;i<this.tag.length;i++){
							if(this["collection_" + this.tag[i] + "_showing"]){
								t.push(this.tag[i]);
							}
						}
						self.user.updateEXTINTERES(t);
					}
				}else{
					this.tag_in_curso = tag;
					this.query = {"public.tag": {$in: [tag]}};
					this.coll = [];
					this.obtained = 0;
					this["collection_" + tag + "_showing"] = true;
					
					//obtengo coleccion
					this.cant = await this.service_total(this.paramsToGetTotal());
					while(this.obtained<this.cant){
						let c = await this.service_collection(this.paramsToGetCollection());
						this.obtained += c.length;
						this.options.skip = this.obtained;
						this.coll = this.coll.concat(c);
					}
					//proceso coleccion
					for(let i=0;i<this.coll.length;i++){
						if(this.coll[i].public.geojson){
							this.coll[i].marker = L.geoJSON(this.coll[i].public.geojson);
							this.coll[i].marker.addTo(this.lmap).on("click", this.onMarker(this.coll[i]));
						}
						this["collection_" + tag].push(this.coll[i]);
					}
				}
			}catch(e){
				console.log(e);
				alert(e);
			}
		},
		onMarker: function(doc){
			return function(e){
				self.user_jv.select(doc);
				$('#mdPublic').modal('show');
				$scope.$apply();
			}
		}
	});
	
	$('#mdALL').on('shown.bs.modal', function (e) {
		$scope.$apply();
	});
});
app.controller("twitterCtrl", function(trascender,$scope){
	//db.twitter.createIndex( { "geojson.geometry": "2dsphere" } )
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
		this.user.updateLMAP = async function(){			
			try{
				$("#background,#loading").fadeIn();
				let body = {};
				body.lmap = {};
				body.lmap.center = self.map.lmap.getCenter();
				body.lmap.zoom = self.map.lmap.getZoom();
				if(this.doc==null){
					localStorage.setItem("lmap",JSON.stringify(body));
				}else{
					await this.service_update_ext("",JSON.stringify(body));
				}
			}catch(e){
				alert(e);
			}
			location.reload();
		}
		this.user.updateTWITTER = async function(tag){			
			try{
				if(this.doc==null){
					localStorage.setItem("twitter",JSON.stringify(tag));
				}else{
					await this.service_update_ext("",JSON.stringify({twitter: tag}));
				}
			}catch(e){
				alert(e);
			}
			location.reload();
		}
	}
	
	this.ip = new trascender({
		service: {
			read: ["GET","/api/client/geoip"]
		},
		start: function(){
			this.read();
		},
		afterRead: function(){
			self.map.start_byIP(this.doc)
		}
	});
	
	this.map = new trascender({
		increase: true,
		baseurl: "api/twitter",
		start_byIP: async function(doc){
		
			let ll = [-33.44287893807368,-70.65392374992372];
			let z = 18;
			if(doc!=null){
				ll = doc.ll;
				z = 18;
			}
			if(self.user.doc!=null && self.user.doc.lmap){
				ll = [self.user.doc.lmap.center.lat,self.user.doc.lmap.center.lng];
				z = self.user.doc.lmap.zoom;
			}else if(localStorage.getItem("lmap")!=null){
				let ls = JSON.parse(localStorage.getItem("lmap"));
				ll = [ls.lmap.center.lat,ls.lmap.center.lng];
				z = ls.lmap.zoom;
			}
			
			this.lmap = new L.Map('map');
			L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}g").addTo(this.lmap);
			this.lmap.setView(ll,z);
			
			this.lmap.on('zoomend', ()=>{this.onMapMove();});

			this.lmap.on('dragend', ()=>{this.onMapMove();});
			
			delete this.options.skip;
			delete this.options.limit;

			this.setTopoJson();

			await this.getTag();
			
			for(let i=0;i<this.tag.length;i++){
				if(self.user.doc!=null && self.user.doc.twitter){
					if(self.user.doc.twitter.indexOf(this.tag[i])>-1){
						this["collection_" + this.tag[i] + "_showing"] = true;
					}else{
						this["collection_" + this.tag[i] + "_showing"] = false;
					}
				}else if(localStorage.getItem("twitter")!=null){
					let ls = JSON.parse(localStorage.getItem("twitter"));
					if(ls.indexOf(this.tag[i])>-1){
						this["collection_" + this.tag[i] + "_showing"] = true;
					}else{
						this["collection_" + this.tag[i] + "_showing"] = false;
					}
				}else{
					this["collection_" + this.tag[i] + "_showing"] = true;
				}
			}
			
			this.onMapMove();
			
			await this.wait(500);
			this.refresh();
			
		},
		setTopoJson: function(){
			L.TopoJSON = L.GeoJSON.extend({
				addData: function (data) {
					var geojson, key;
					if (data.type === "Topology") {
						for (key in data.objects) {
							if (data.objects.hasOwnProperty(key)) {
								geojson = topojson.feature(data, data.objects[key]);
								L.GeoJSON.prototype.addData.call(this, geojson);
							}
						}
						return this;
					}
					L.GeoJSON.prototype.addData.call(this, data);
					return this;
				}
			});
			L.topoJson = function (data, options) {
				return new L.TopoJSON(data, options);
			};
			//create an empty geojson layer
			//with a style and a popup on click
			this.geojson = L.topoJson(null, {
				style: function(feature){
					return {
						color: "#000",
						opacity: 1,
						weight: 1,
						fillColor: '#35495d',
						fillOpacity: 0.8
					}
				},
				onEachFeature: function(feature, layer) {
					//console.log(feature.properties);
					//layer.bindPopup("<p>" + feature.properties.COD_REGI + "° " + feature.properties.NOM_REG + "</p>");
				}
			}).addTo(this.lmap);
			
			var icon = function(url){
				return L.icon({
					iconUrl: url,
					iconSize: [25, 41],
					iconAnchor: [12, 41],
					popupAnchor: [1, -34]
				});
			}
			
			//markers
			this.redIcon = icon('/media/img/location/red.png');
			this.yellowIcon = icon('/media/img/location/yellow.png');
			this.greenIcon = icon('/media/img/location/green.png');
		},
		getTag: async function(){
			try{
				this.tag = await this.service_tag();
				for(let i=0;i<this.tag.length;i++){
					this["collection_" + this.tag[i]] = [];
				}
				$("#background,#loading").fadeOut();
			}catch(e){
				alert(e);
				console.log(e);
			}
		},
		refresh: async function(){
			$("#botonera").fadeIn();
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
					console.log(layer);
					self.map.INFOGJ = layer.toGeoJSON();
					drawnItems.addLayer(layer);
				});
			}
			$scope.$apply();
		},
		onMapMove: async function(){
			try{
				
				this.query = {tag: {$in: this.getSelectedTags()},"geojson.geometry":{ $near:{$geometry: { type: "Point",  coordinates: [ this.lmap.getCenter().lng, this.lmap.getCenter().lat ] },$minDistance: 0,$maxDistance: this.getKM(this.lmap.getZoom())}}};
				
				let coll = await this.service_collection(this.paramsToGetCollection());
				for(let i=0;i<coll.length;i++){
					let d = this.coll.filter(function(r){
						return r._id == coll[i]._id;
					});
					if(d.length==0){
						coll[i].marker = L.geoJSON(coll[i].geojson).addTo(this.lmap).on("click", ()=>{this.onMarker(coll[i])});
						this.coll.push(coll[i]);
					}
				}
			}catch(e){
				alert(e);
			}
		},
		getSelectedTags: function(){
			let r = [];
			for(let i=0;i<this.tag.length;i++){
				if(this["collection_" + this.tag[i] + "_showing"]){
					r.push(this.tag[i]);
				}
			}
			return r;
		},		
		getKM: function(zoom){
			switch(zoom){
				case 18 : return 750/2; break;
				case 17 : return 1500/2; break;
				case 16 : return 3000/2; break;
				case 15 : return 6000/2; break;
				case 14 : return 12000/2; break;
				case 13 : return 24000/2; break;
				case 12 : return 48000/2; break;
				case 11 : return 96000; break;
				case 10 : return 192000; break;
				case 9  : return 384000; break;
				case 8  : return 768000; break;
				case 7  : return 1536000; break;
				case 6  : return 3072000; break;
				case 5  : return 6144000; break;
				case 4  : return 12288000; break;
				case 3  : return 24756000; break;
				case 2  : return 49152000; break;
				case 1  : return 98304000; break;
				case 0	: return 196608000; break;
			}
		},
		onMarker: function(doc){
			this.select(doc);
			if(doc.twitter!=undefined && doc.twitter.trim()!=""){
				self.twitter.read({name: doc.twitter});
			}else{
				alert("Este registro no tiene twitter asignado");
				self.twitter.coll = [];
			}
		},
		getByTag: function(tag){
			this["collection_" + tag + "_showing"] = !this["collection_" + tag + "_showing"];
			self.user.updateTWITTER(this.getSelectedTags());
			//this.onMapMove();
		},
		
		
		
		region: async function(){
			$("#background,#loading").fadeIn();
			this.showRegion = true;
			await this.wait(500);
			let response = await fetch('/media/json/regiones.json');
			let data = await response.json();
			this.geojson.addData(data);
			$("#background,#loading").fadeOut();
		},
		updateStatus: async function(){
			$("#background,#loading").fadeIn();
			let d = new Date();
			d = d.setDate(d.getDate() - 1);
			for(let i=0;i<this.coll.length;i++){
				try{
					console.log(i + "/" + this.coll.length);
					if(this.coll[i].twitter==undefined || this.coll[i].twitter.trim()==""){
						await this.service_update({id: this.coll[i]._id},JSON.stringify({$set: {status: 4}}));
						console.log(this.coll[i].name + " = desinformación");
					}else{
						self.twitter.doc = await self.twitter.service_read({name: this.coll[i].twitter});
						let c = self.twitter.format();
						if(c.length==0){
							await this.service_update({id: this.coll[i]._id},JSON.stringify({$set: {status: 4}}));
							console.log(this.coll[i].name + " = desinformación");
						}else{
							c = c[0];
							if(new Date(c.created) < d){
								await this.service_update({id: this.coll[i]._id},JSON.stringify({$set: {status: 4}}));
								console.log(this.coll[i].name + " = desinformación");
							}else{
								await this.service_update({id: this.coll[i]._id},JSON.stringify({$set: {status: 0}}));
							}
						}
					}
				}catch(e){
					console.log(e);
				}
			}
			$("#background,#loading").fadeOut();
		},
		openInfo: function(){
			$('#mdTweets,#mdComment').modal('hide');
			$('#mdMap').modal('show');
		},
		openTweet: function(){
			$('#mdMap,#mdComment').modal('hide');
			$('#mdTweets').modal('show');
		},
		openComment: function(){
			$('#mdMap,#mdTweets').modal('hide');
			$('#mdComment').modal('show');
		},
		afterChangeMode: function(){
			if(this.action=="new"){
				this.newdoc.geojson = this.INFOGJ;
			}
		},
		formatToServer: function(doc){
			delete doc.marker;
			return doc;
		},
		afterCreate: function(doc){
			location.reload();
		},
		beforeUpdate: function(){
			return confirm("Confirme actualización del registro");
		},
		afterUpdate: function(){
			$scope.$apply();
			$('#mdMap').modal('hide');
		},
		beforeDelete: function(){
			return confirm("Confirme eliminación del registro");
		},
		afterDelete: function(){
			location.reload();
		}
	});
	
	this.twitter = new trascender({
		service: {
			read: ["GET","/api/tweet/:name"]
		},
		beforeRead: function(){
			$("#background,#loading").fadeIn();
			return true;
		},
		afterRead: function(a){
			$("#background,#loading").fadeOut();
			this.coll = this.format();
			$scope.$apply();
			$("[data-html]").each(function(){
				this.innerHTML = this.getAttribute("data-html");
			});
			$('#mdTweets').modal('show');
		},
		format: function(){
			let content = $(this.doc);
			let items = content.find(".timeline-TweetList-tweet");
			let c = [];
			for(var i = 0; i < items.length; i++){
				//console.log();
				let id = ($(items[i]).find("[data-rendered-tweet-id]").attr("data-rendered-tweet-id"));
				let p = ($(items[i]).find(".timeline-Tweet-text").html());
				let d = ($(items[i]).find("time").attr("datetime"));
				
				let CroppedImage = $(items[i]).find(".CroppedImage-image");
				let images = [];
				for(let x=0;x<CroppedImage.length;x++){
					images.push(CroppedImage[x].getAttribute("data-image") + "?format=" + CroppedImage[x].getAttribute("data-image-format"));
				}
				
				let NaturalImage = $(items[i]).find(".NaturalImage-image");
				for(let x=0;x<NaturalImage.length;x++){
					if(NaturalImage[x].getAttribute("data-image-format")!=null){
						images.push(NaturalImage[x].getAttribute("data-image") + "?format=" + NaturalImage[x].getAttribute("data-image-format"));
					}
				}
				
				if(images.length==0){
					images.push("https://images-na.ssl-images-amazon.com/images/I/31KluT5nBkL.png");
				}
				
				c.push({
					key:id,
					full: items[i].innerHTML,
					content:p,
					created:d,
					datefromnow: moment(new Date(d), "YYYYMMDD, h:mm:ss").fromNow(),
					datetitle: moment(new Date(d)).format("dddd, DD MMMM YYYY, h:mm:ss"),
					images: images,
					image: 0
				});
			}
			return c;
		},
		changeImage: function(row){
			let n = row.image+1;
			if(n >= row.images.length){
				n = 0;
			}
			row.image = n;
		}
	});
	
	$('#mdTweets').on('shown.bs.modal', function (e) {
		$('#mdTweets .modal-body').animate({ scrollTop: 0 }, "fast");
	});
	
});
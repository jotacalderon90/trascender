app.controller("logCtrl", function(trascender,$scope){
	
	var self = this;
	
	if(typeof user!="undefined"){
		this.user = user;
		this.user.isAdmin = function(){
			if(this.doc && this.doc.roles && (this.doc.roles.indexOf("admin")>-1 || this.doc.roles.indexOf("ADM_FileDirectory")>-1)){
		return true;
			}else{
		return false;
			}
		}
	}
	
	this.log = new trascender({
		start: function(){
			this.coll = this.formatCollectionToClient(_document.split("\n"));
			this.coll = this.coll.filter((r)=>{return r!=null;});
			this.chart1(this.getResume());
		},
		formatToClient: function(line){
			if(line!=""){
				line = line.split(";");
				let doc = {
					created:  new Date(line[0]),
					ip: line[1],
					author: line[2],
					url: line[3],
					method: line[4],
					data: line[5]
				};
				doc.create_date = doc.created.toDateString();
				doc.x = doc.created;
				doc.y = 1;
				return doc;
			}else{
				return null;
			}
		},
		getResume: function(){
			let days = [];
			let resume = [];
			for(let i=0;i<this.coll.length;i++){
				if(days.indexOf(this.coll[i].create_date)==-1){
					days.push(this.coll[i].create_date);
					resume.push({x: this.coll[i].create_date, y: 1});
				}else{
					resume[days.indexOf(this.coll[i].create_date)].y++;
				}
			}
			resume = resume.map((r)=>{
				r.x = new Date(r.x);
				return r;
			});
			return resume;
		},
		chart1: function(coll){
			new CanvasJS.Chart("chart1", {
				animationEnabled: true,
				title:{
					text: "Trafico de Backend"
				},
				axisX:{
					valueFormatString: "DD MMM"
				},
				axisY: {
					title: "Número de llamadas",
					includeZero: false,
					scaleBreaks: {
				autoCalculate: true
					}
				},
				data: [{
					click: this.chart1OnClick,
					type: "line",
					xValueFormatString: "DD MMM",
					color: "#F08080",
					dataPoints: coll
				}]
			}).render();
		},
		chart1OnClick: function(e){
			
			/*
			//individualizar ips
			let c = self.log.coll.filter((r)=>{
				return r.create_date == e.dataPoint.x.toDateString();
			});
			c = c.map((r)=>{return r.ip});
			c = self.log.distinct(c);
			console.log(c);
			*/
			
			//obtener mayores urls
			let c = self.log.coll.filter((r)=>{
				return r.create_date == e.dataPoint.x.toDateString();
			});
			
			let url = c.map((r)=>{return r.url});
			url = self.log.distinct(url);
			
			let r2 = [];
			for(let i=0;i<url.length;i++){
				let data = c.filter((r)=>{return r.url == url[i]});
				r2.push({
					label: url[i],
					y: data.length,
					datax: data
				});
			}
			
			r2 = self.log.SOABF(r2,"y");
			r2 = r2.reverse();
			r2 = r2.slice(0,10);
			
			new CanvasJS.Chart("chart2", {
				animationEnabled: true,
				exportEnabled: true,
				theme: "light1",
				axisX:{
					interval: 1
				},
				axisY2:{
					interlacedColor: "rgba(1,77,101,.2)",
					gridColor: "rgba(1,77,101,.1)",
					title: "URLS"
				},
				title:{
					text: "Trafico del día " + e.dataPoint.x.toDateString()
				},
				data: [{
					type: "bar", 
					name: "companies",
					axisYType: "secondary",
					color: "#014D65",
					dataPoints: r2,
					click: function(e){
						self.map.getInfoIPS(self.log.distinct(e.dataPoint.datax.map((r)=>{return r.ip})));
					}
				}]
			}).render();
		},
	});
	
	self.map = new trascender({
		start: function(){
			this.serviceip = this.serviceCreate("GET","/api/client/geoip/:ip");
			this.marker = [];
		},
		getInfoIPS: async function(ips){
			let data = [];
			for(let i=0;i<ips.length;i++){
				let info = await this.getInfoIP(ips[i]);
				data.push(info);
			}
			this.loadMap(data);
		},
		getInfoIP: async function(ip){
			try{
				let info = await this.serviceip({ip: ip});
				return info;
			}catch(e){
				return null;
			}
		},
		loadMap: function(data){
			try{
				let lat = -33.59875863395195;
				let lng = -70.7080078125;
				this.map = L.map("map").setView([lat, lng],3);
						
				let mapLink = '<a href="http://www.esri.com/">Esri</a>';
				let wholink = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';	
				L.tileLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}g").addTo(this.map);
			}catch(e){
				console.log(e);
			}
			
			for(let i=0;i<this.marker.length;i++){
				this.map.removeLayer(this.marker[i]);
			}
			
			for(let i=0;i<data.length;i++){
				this.marker.push(L.marker(data[i].ll).addTo(this.map));
			}
		}
	});
});
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
			
			//obtener mayores urls
			let c = self.log.coll.filter((r)=>{
				return r.create_date == e.dataPoint.x.toDateString();
			});
			c = c.map((r)=>{return r.url});
			c = self.log.distinct(c);
			
			let r2 = [];
			for(let i=0;i<c.length;i++){
				r2.push({
					x: c[i],
					y: self.log.coll.filter((r)=>{
							return r.url == c[i]
						}).length
				});
			}
			
			
			//individualizar ips
			/*let c = self.log.coll.filter((r)=>{
				return r.create_date == e.dataPoint.x.toDateString();
			});
			c = c.map((r)=>{return r.ip});
			c = self.log.distinct(c);
			console.log(c);*/
			
			
			
			new CanvasJS.Chart("chart2", {
				animationEnabled: true,
				exportEnabled: true,
				theme: "light1", // "light1", "light2", "dark1", "dark2"
				title:{
					text: "Trafico del día " + e.dataPoint.x.toDateString()
				},
				axisY: {
					title: "Número de llamadas",
					includeZero: false,
					scaleBreaks: {
						autoCalculate: true
					}
				},
				data: [{
					type: "column", 
					indexLabelFontColor: "#5A5757",
					indexLabelFontSize: 16,
					indexLabelPlacement: "outside",
					dataPoints: r2
				}]
			}).render();
		}
	});
});
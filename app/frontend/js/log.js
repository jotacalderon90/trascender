app.controller("logCtrl", function(trascender,$scope){
	
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
	let i = {
		start: function(){
			return new trascender({
				start: function(){
					let c = _document.split("\n");
					let coll = [];
					for(let i=0;i<c.length;i++){
						if(c[i]!=""){
							this.coll.push(this.format(c[i]));
						}
					}
					let days = [];
					let days_to_chart = [];
					for(let i=0;i<this.coll.length;i++){
						let d = new Date(this.coll[i].created).toDateString();
						if(days.indexOf(d)==-1){
							days.push(d);
							days_to_chart.push({x: d, y: 1});
						}else{
							days_to_chart[days.indexOf(d)].y++;
						}
					}
					days_to_chart = days_to_chart.map((r)=>{
						r.x = new Date(r.x);
						r.y = r.y;
						return r;
					});
					this.chart(days_to_chart);
					console.log(days_to_chart);
					//localStorage.setItem("log",JSON.stringify(this.coll));
					//localStorage.setItem("days","");
					
					
				},
				format: function(line){
					line = line.split(";");
					let doc = {
						created: line[0],
						ip: line[1],
						author: line[2],
						url: line[3],
						method: line[4],
						data: line[5],
						x: new Date(line[0]).toDateString(),
						y: 1
					};
					return doc;
				},
				getDays: function(){
					let days = [];
					for(let i=0;i<this.coll.length;i++){
						let d = new Date(this.coll[i].created).toDateString();
						if(days.indexOf(d)==-1){
							days.push(d);
						}
					}
					localStorage.setItem("days",JSON.stringify(days));
					location.href = "/log/days";
				},
				chart: function(coll){
					new CanvasJS.Chart("chartContainer", {
						animationEnabled: true,
						title:{
							text: "Website Traffic"
						},
						axisX:{
							valueFormatString: "DD MMM"
						},
						axisY: {
							title: "Number of Visitors",
							includeZero: false,
							scaleBreaks: {
								autoCalculate: true
							}
						},
						data: [{
							type: "line",
							xValueFormatString: "DD MMM",
							color: "#F08080",
							dataPoints: coll
						}]
					}).render();
				}
			});
		},
		days: function(){
			return new trascender({
				start: function(){
					console.log(JSON.parse(localStorage.getItem("days")));
				}
			});
		}
	}
	
	for(instance in instances.log){
		this[instances.log[instance]] = new i[instances.log[instance]]();
	}
});
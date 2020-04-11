app.controller("mapCtrl", function(trascender,$scope){
	
	var self = this;
	
	if(typeof user!="undefined"){
		this.user = user;
		this.user.setAdmin(["admin"]);
	}
	
	$("#background,#loading").fadeIn();
	
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
					this.map.setView([doc.LAT, doc.LNG],2, {animate: true, pan: {duration: 2 }});
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
					this.INDEXTODOC = 0;
					this.listTAG = [];
					this.started = false;
					$(document).keydown((e)=>{
						switch(e.keyCode){
							case 67:
								$("#mdCog").modal("toggle");
								break;
							case 71:
								$("#mdGo").modal("toggle");
								break;
							case 77:
								$("#mdMap").modal("toggle");
								break;
							/*case 123:
								alert("nos vemos de otra forma ;)");
								break;*/
							default:
								console.log(e.keyCode);
						}
					});
					let u = new URL(location.href);
					let t = u.searchParams.get("tag");
					if(t){
						this.query.tag = t;
						this.getTotal();
					}else{
						$("#background,#loading").fadeOut();
					}
					
					$('#mdCog').on('show.bs.modal', (e)=>{$('#dvTimeline').fadeOut();});
					$('#mdCog').on('hide.bs.modal', (e)=>{if(this.started){$('#dvTimeline').fadeIn();}});
					
					$('#mdMap').on('show.bs.modal', (e)=>{$('#dvTimeline').fadeOut();});
					$('#mdMap').on('hide.bs.modal', (e)=>{if(this.started){$('#dvTimeline').fadeIn();}});
					
					$('#mdGo').on('show.bs.modal', (e)=>{$('#dvTimeline').fadeOut();});
					$('#mdGo').on('hide.bs.modal', (e)=>{if(this.started){$('#dvTimeline').fadeIn();}});
					
					$('#mdMap').delegate('textarea', 'keydown', function(e) {
						var keyCode = e.keyCode || e.which;
						if (keyCode == 9) {
							e.preventDefault();
							var start = this.selectionStart;
							var end = this.selectionEnd;
							// set textarea value to: text before caret + tab + text after caret
							$(this).val($(this).val().substring(0, start) + "\t" + $(this).val().substring(end));
							// put caret at right position again
							this.selectionStart =
							this.selectionEnd = start + 1;
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
					$("#mdCog").modal("hide");
					$("#background,#loading").fadeIn();
					this.started = true;
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
					$("#dvTimeline").animate({scrollTop: 0});
					this.years = years;
					$.timeliner({});
					
					$("#dvTimeline").fadeIn(()=>{
						$("#background,#loading").fadeOut();
					});
					
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
							default:
								console.log(e.keyCode);
								break;
						}
					});
					
					this.next();
					
					console.log(this.listTAG);
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
					
					for(let i=0;i<row.tag.length;i++){
						if(this.listTAG.indexOf(row.tag[i])==-1){
							this.listTAG.push(row.tag[i]);
						}
					}
					
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
					row.INDEX = this.INDEXTODOC;
					this.INDEXTODOC++;
					return row;
				},
				next: function(){
					this.index++;
					if(this.index - 1 > this.coll.length){
						this.index--;
					}
					this.refresh();
				},
				back: function(){
					this.index--;
					if(this.index < 0){
						this.index = 0;
					}
					this.refresh();
				},
				setDOC: function(r){
					this.index = r.INDEX;
					this.refresh();
				},
				refresh: function(){
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
		},
		go: function(){
			return new trascender({
				start: function(){
					$('#mdGo').on('shown.bs.modal', (e)=>{this.myDiagram.commandHandler.zoomToFit();});
					this.init(this.getDATA());
				},
				getDATA: function(){
					let r = [];
					let c = $("#txt_data").html();
					c = c.split("\n");
					let parent;
					
					for(let i=0;i<c.length;i++){
						let d = {};
						d.key = i;
						d.name = c[i].trim();
						d.name = (d.name.indexOf(",")==-1)?d.name:d.name.split(",").join("\n");
						
						if(i==0){
							parent = 0;
						}else{
							d.parent = null;
							let p = 1;
							while(d.parent==null){
								let ct = c[i].split("\t").length-1;
								let ct2 = c[i-p].split("\t").length-1;
								let anterior = r[r.length-p];
								if(ct>ct2){
									d.parent = anterior.key;
								}else{
									p++;
								}
							}
						}
						r.push(d);
					}
					return r;
				},
				init: function(DATA) {
					var $ = go.GraphObject.make; // for conciseness in defining templates
					this.myDiagram =
					$(go.Diagram, "myDiagramDiv", // must be the ID or reference to div
							{
								"toolManager.hoverDelay": 100, // 100 milliseconds instead of the default 850
								allowCopy: false,
								layout: // create a TreeLayout for the family tree
									$(go.TreeLayout, {
										angle: 90,
										nodeSpacing: 10,
										layerSpacing: 40,
										layerStyle: go.TreeLayout.LayerUniform
									})
							});
							
					// replace the default Node template in the nodeTemplateMap
					this.myDiagram.nodeTemplate =
						$(go.Node, "Auto", {
								deletable: false
							},
							new go.Binding("text", "name"),
							$(go.Shape, "Rectangle", {
									fill: "lightgray",
									stroke: null,
									strokeWidth: 0,
									stretch: go.GraphObject.Fill,
									alignment: go.Spot.Center
								},
								new go.Binding("fill", "gender", '#90CAF9')),
							$(go.TextBlock, {
									font: "700 12px Droid Serif, sans-serif",
									textAlign: "center",
									margin: 10,
									maxSize: new go.Size(80, NaN)
								},
								new go.Binding("text", "name"))
						);
					// define the Link template
					this.myDiagram.linkTemplate =
						$(go.Link, // the whole link panel
							{
								routing: go.Link.Orthogonal,
								corner: 5,
								selectable: false
							},
							$(go.Shape, {
								strokeWidth: 3,
								stroke: '#424242'
							})); // the gray link shape
					// here's the family data
					var nodeDataArray = DATA;
					// create the model for the family tree
					this.myDiagram.model = new go.TreeModel(nodeDataArray);
				}
			});
		}
	}
	
	for(instance in instances.map){
		this[instances.map[instance]] = new i[instances.map[instance]]();
	}
	
	setTimeout(function(){$scope.$digest(function(){});}, 500);
});
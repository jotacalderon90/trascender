app.controller("blogCtrl", function(trascender,$scope){
	
	const self = this;

	if(typeof user!="undefined"){
		this.user = user;
		this.user.setAdmin(["admin","BLOGUER"]);
	}
	if(typeof wall!="undefined"){
		this.wall = wall;
		this.wall.setDoc = function(doc,action){
			switch(action){
				case 1:
					this.newdoc = {
						content: "<p>Creó una nueva publicación en el Blog: <small>" + doc.title + "</small></p>",
						url: "/blog/" + doc.uri,
						tag: (typeof doc.tag=="string")?doc.tag.split(","):doc.tag,
						author: user.doc._id,
						created: new Date()
					};
				break;
				case 2:
					this.newdoc = {
						content: "<p>Actualizó una publicación del Blog: <small>" + doc.title + "</small></p>",
						url: "/blog/" + doc.uri,
						tag: (typeof doc.tag=="string")?doc.tag.split(","):doc.tag,
						author: user.doc._id,
						created: new Date()
					};
				break;
				case 3:
					this.newdoc = {
						content: "<p>Eliminó una publicación del Blog: <small>" + doc.title + "</small></p>",
						tag: ["Blog"],
						author: user.doc._id,
						created: new Date()
					};
				break;
			}
			console.log(this);
		}
	}

	var instances = {
		collection: function(){
			return new trascender({
				increase: true,
				baseurl: "api/blog",
				start: function(){
					window.title = document.getElementsByTagName("title")[0].innerHTML.trim();
					this.coll = _collection;
					this.obtained = _collection.length;
					this.query = (window.title!="Blog")?{tag: window.title}:{};
					this.getTag();
					this.getTotal();
					$(window).scroll(this.scrolling(this));	
				},
				restart: function(){
					this.coll = [];
					this.obtained = 0;
					this.getTotal();
					this.getCollection();
				},
				beforeGetCollection: function(){
					this.options = {skip: this.obtained, limit: this.rowsByPage, sort: {created: -1}, fields: {uri: 1, thumb: 1, resume: 1, title: 1}};
					this.collectionLog = this.addLog(this.message.collection.on);
					return true;
				},
				afterGetCollection: function(){
					$scope.$digest(function(){});
				},
				scrolling: function(me){
					return function(){
						if(Math.round($(window).scrollTop() + $(window).height()) == Math.round($(document).height())) {
							if(me.obtained < me.cant){
								me.getCollection();
							}
						}
					}
				}
			});
		},
		document: function(){
			return new trascender({
				baseurl: "api/blog",
				start: function(){
					CKEDITOR.replace("input_content");
					if(typeof _document != "undefined"){
						this.select(_document);
					}
				},
				afterChangeMode: function(action,doc){
					switch(action){
						case "new":
							CKEDITOR.instances['input_content'].setReadOnly(false);
							CKEDITOR.instances["input_content"].setData("");
							break;
						case "edit":
							CKEDITOR.instances['input_content'].setReadOnly(false);
							break;
						case "read":
							$(".asDate").html( moment(new Date(this.doc.created), "YYYYMMDD, h:mm:ss").fromNow() );
							$(".asDate").attr("title", moment(new Date(this.doc.created)).format("dddd, DD MMMM YYYY, h:mm:ss") );													
							//utilizado por comment.js
							//var type = "blog";
							//var id = "{{data:doc.row._id}}";
					}
				},
				beforeCreate: function(doc){
					if(confirm("Confirme creación del documento")){
						self.wall.setDoc(doc,1);
						return true;
					}
				},
				afterCreate: function(s){
					if(s){
						self.wall.create();
					}
					$scope.$digest(function(){});
				},
				afterRead: function(){
					this.openModal();
					$scope.$digest(function(){});
				},
				openModal: function(){
					$("#mdAdmin").modal("show");
					CKEDITOR.instances['input_content'].setReadOnly(true);
					CKEDITOR.instances["input_content"].setData(this.doc.content);
				},
				beforeUpdate: function(doc){
					if(confirm("Confirme actualización del documento")){
						self.wall.setDoc(doc,2);
						return true;
					}
				},
				afterUpdate: function(s){
					if(s){
						self.wall.create();
					}
					$scope.$digest(function(){});
				},
				beforeDelete: function(){
					if(confirm("Confirme eliminación del documento")){
						self.wall.setDoc(this.doc,3);
						return true;
					}
				},
				afterDelete: function(s){
					if(s){
						self.wall.create();
					}
					$scope.$digest(function(){});
				},
				formatToServer: function(doc){
					doc.content = CKEDITOR.instances["input_content"].getData();
					doc.tag = (typeof doc.tag=="string")?doc.tag.split(","):doc.tag;
					doc.user = self.user.doc._id;
					if(this.action=="new"){
						doc.created = new Date();
					}else{
						doc.updated = new Date();
					}
					return doc;
				},
				titleOnBlur: function(){
					if(this.action=="new"){
						this.newdoc.uri = this.cleaner(this.newdoc.title);
					}else{
						this.doc.uri = this.cleaner(this.doc.title);
					}
				}
			});
		},
		resume: function(){
			return new trascender({
				baseurl: "api/blog",
				rowsByPage: 3,
				start: function(){
					this.options.sort = {created: -1};
					this.getCollection();
				},
				formatToClient: function(row){
					row.datefromnow = moment(new Date(row.created), "YYYYMMDD, h:mm:ss").fromNow();
					row.datetitle = moment(new Date(row.created)).format("dddd, DD MMMM YYYY, h:mm:ss");
					return row;
				},
				afterGetCollection: function(success, xhttp){
					$scope.$digest(function(){});
				}
			});
		},
		relation: function(){
			return new trascender({
				baseurl: "api/blog",
				start: function(){
					this.getCollection();
				},
				beforeGetCollection: function(){
					this.query = {tag: {$in: [_document.tag_main]}, title: {$ne: _document.title}};
					this.options = {skip: this.obtained, limit: this.rowsByPage, sort: {created: -1}, fields: {uri: 1, thumb: 1, title: 1}};
					this.collectionLog = this.addLog(this.message.collection.on);
					return true;
				},
				afterGetCollection: function(){
					this.coll = this.randomArray(this.coll).slice(0,3);
					$scope.$digest(function(){});
				},
				randomArray: function(array){
					let new_array = [];
					let used = [];
					for(let i=0;i<array.length;i++){
						let r = Math.round(Math.random() * (array.length-1));
						while(used.indexOf(r)>-1){
							r = Math.round(Math.random() * (array.length-1));
						}
						used.push(r);
						new_array.push(array[r]);
					}
					return new_array;
				}
			});
		}
	}
	
	for(instance in blog_instances){
		this[blog_instances[instance]] = new instances[blog_instances[instance]]();
	}
});
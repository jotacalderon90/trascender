app.controller("blogCtrl", function(trascender,$scope){
	
	if(typeof user!="undefined"){
		this.user = user;
		this.user.setAdmin(["admin","BLOGUER"]);
	}
	
	trascender.prototype.formatToClient = function(row){
		row.datefromnow = moment(new Date(row.created), "YYYYMMDD, h:mm:ss").fromNow();
		row.datetitle = moment(new Date(row.created)).format("dddd, DD MMMM YYYY, h:mm:ss");
		return row;
	}
	
	let i = {
		collection: function(){
			return new trascender({
				increase: true,
				baseurl: "api/blog",
				start: function(){
					window.title = document.getElementsByTagName("title")[0].innerHTML.trim().toLowerCase();
					this.coll = this.formatCollectionToClient(_collection);
					this.obtained = _collection.length;
					this.query = (window.title!="blog")?{tag: window.title}:{};
					this.getTag();
					this.getTotal();
					this.isLoading = false;
					$(window).scroll(()=>{this.scrolling()});	
				},
				restart: function(){
					this.coll = [];
					this.obtained = 0;
					this.getTotal();
					this.getCollection();
				},
				beforeGetCollection: function(){
					this.options = {skip: this.obtained, limit: this.rowsByPage, sort: {created: -1}, projection: {uri: 1, thumb: 1, resume: 1, title: 1, created: 1}};
					this.collectionLog = this.addLog(this.message.collection.on);
					this.isLoading = true;
					return true;
				},
				afterGetCollection: function(){
					this.isLoading = false;
					$scope.$digest(function(){});
				},
				scrolling: function(){
					if(Math.round($(window).scrollTop() + $(window).height()) == Math.round($(document).height())) {
						if(!this.isLoading && this.obtained < this.cant){
							this.getCollection();
						}
					}
				}
			});
		},
		document: function(){
			return new trascender({
				baseurl: "api/blog",
				default: function(){
					return {tag: ["Blog"]};
				},
				start: function(){
					CKEDITOR.replace("input_content");
					if(typeof _document != "undefined"){
						this.select(_document);
					}else{
						this.new();
					}
					this.getTag();
				},
				afterChangeMode: function(action,doc){
					switch(action){
						case "edit":
							CKEDITOR.instances['input_content'].setReadOnly(false);
							break;
						case "read":
							//CKEDITOR.instances['input_content'].setReadOnly(true);
							$(".asDate").html( moment(new Date(this.doc.created), "YYYYMMDD, h:mm:ss").fromNow() );
							$(".asDate").attr("title", moment(new Date(this.doc.created)).format("dddd, DD MMMM YYYY, h:mm:ss") );	
							CKEDITOR.instances["input_content"].setData(this.doc.content);
							break;
					}
				},
				beforeCreate: function(doc){
					return confirm("Confirme creación del documento");
				},
				afterCreate: function(s){
					if(s){
						location.href = "/blog";
					}else{
						$scope.$digest(function(){});
					}
				},
				beforeUpdate: function(doc){
					return confirm("Confirme actualización del documento");
				},
				afterUpdate: function(s){
					if(s){
						location.reload();
					}else{
						$scope.$digest(function(){});
					}
				},
				beforeDelete: function(){
					return confirm("Confirme eliminación del documento");
				},
				afterDelete: function(s){
					if(s){
						location.href = "/blog";
					}else{
						$scope.$digest(function(){});
					}
				},
				formatToServer: function(doc){
					delete doc.tagbk;
					doc.content = CKEDITOR.instances["input_content"].getData();
					return doc;
				},
				titleOnBlur: function(){
					if(this.action=="new"){
						this.newdoc.uri = this.cleaner(this.newdoc.title);
					}else{
						this.doc.uri = this.cleaner(this.doc.title);
					}
				},
				addTag: function(event){
					if(event.which === 13) {
						if(this.getDoc().tag.indexOf(this.getDoc().tagbk)==-1){
							this.getDoc().tag.push(this.getDoc().tagbk);
							this.getDoc().tagbk = "";
						}
					}
				},
				removeTag: function(i){
					this.getDoc().tag.splice(i,1);
				},
				afterGetTag: function(){
					$(".input_tag").autocomplete({source: this.tag, select: ( event, ui )=>{
						this.getDoc().tagbk = ui.item.value;
					}});
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
					this.options = {skip: this.obtained, limit: this.rowsByPage, sort: {created: -1}, projection: {uri: 1, thumb: 1, title: 1, created: 1}};
					this.collectionLog = this.addLog(this.message.collection.on);
					return true;
				},
				afterGetCollection: function(){
					this.coll = this.randomArray(this.coll).slice(0,3);
					$scope.$digest(function(){});
				}
			});
		}
	}
	
	for(instance in instances.blog){
		this[instances.blog[instance]] = new i[instances.blog[instance]]();
	}
});
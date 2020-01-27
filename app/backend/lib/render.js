const fs = require("fs");

var self = function(a){
	this.config = a.config;
	this.path = "./" + a.config.properties.views;
	a.express.engine("html", this.engine(this));
	a.express.set("views", "./" + this.path);
	a.express.set("view engine", "html");
}

self.prototype.engine = function(a){
	return function(filePath,data,callback){
		try{
			return callback(null, a.processTemplate(fs.readFileSync(filePath,"utf8").toString(),data));
		}catch(e){
			return callback(new Error(e));
		}
	}
}

self.prototype.processTemplateByPath = function(templatename, doc){
	let template = fs.readFileSync(templatename,'utf8');
	return this.processTemplate(template,doc);
}

self.prototype.processTemplate = function(template,doc){
	try{
		Object.assign(doc, {config: this.config});
		var process_template = template;
		var next = true;
		if(template.indexOf("<!--use:")>-1){
			var masterName = this.extractIn(template,"<!--use:","-->");
			var masterContent = this.getMasterContent(masterName);
			if(masterContent==undefined){
				process_template = "Error to get content of master template " + this.error;
				next = false;
			}else{
				var definitions = this.getMasterDefinitions(masterContent);
				if(definitions==undefined){
					process_template = "Error to get definitions of master template " + this.error;
					next = false;
				}else{
					process_template = masterContent;
					for(var i=0;i<definitions.length;i++){
						var def = definitions[i];
						var from = "<!--define:"+def+"-->";
						var to = this.extractIn(template,"<!--define:"+def+"-->", "<!--/define:"+def+"-->");
						process_template = process_template.replace(from,to);
					}
				}
			}
		}
		if(next){
			this.toDo = "";
			while(!this.isProcessTemplate(process_template)){
				switch(this.toDo){
			case "include":
				process_template = this.processInclude(process_template,doc);
				break;
			case "repeat":
				process_template = this.processRepeat(process_template,doc);
				break;
			case "if":
				process_template = this.processIf(process_template,doc);
				break;
			case "data":
				process_template = this.processData(process_template,doc);
				break;
				}
			}
		}
	}catch(e){
		process_template = e.toString();
	}
	return process_template;
}

self.prototype.extractIn = function(content,from,to){
	var index1 = content.indexOf(from) + from.length;
	content = content.substring(index1);
	var index2 = content.indexOf(to);
	return content.substring(0,index2);
}

self.prototype.getMasterContent = function(masterName){
	try{
		return fs.readFileSync(this.path + masterName + ".html",'utf8');
	}catch(e){
		this.error = e;
		return undefined;
	}
}

self.prototype.getMasterDefinitions = function(masterContent){
	try{
		var tagDefinition = "<!--define:";
		var definitions = [];
		while(masterContent.indexOf(tagDefinition)>-1){
			var definition = this.extractIn(masterContent,tagDefinition,"-->");
			masterContent = masterContent.replace("<!--define:"+definition+"-->", "");
			definitions.push(definition);
		}
		return definitions;
	}catch(e){
		this.error = e;
		return undefined;
	}
}

self.prototype.isProcessTemplate = function(template){
	if(template.indexOf("<!--include:")>-1){
		this.toDo = "include";
		return false;
	}
	if(template.indexOf("<!--repeat:")>-1){
		this.toDo = "repeat";
		return false;
	}
	if(template.indexOf("<!--if:")>-1){
		this.toDo = "if";
		return false;
	}
	if(template.indexOf("{{data:")>-1){
		this.toDo = "data";
		return false;
	}
	return true;
}

self.prototype.processInclude = function(process_template){
	var tag = "<!--include:";		
	var includeName = this.extractIn(process_template,tag,"-->");
	var includeTemplate = "";
	try{
		includeTemplate = fs.readFileSync(this.path  + includeName + ".html",'utf8');
	}catch(e){
		includeTemplate = "template not found " + includeName;
	}		
	process_template = process_template.replace(tag+includeName+"-->", includeTemplate);		
	return process_template;
}

self.prototype.processRepeat = function(content,doc){
	var html_repeat = "";
	var objectRepeat = this.extractIn(content,"<!--repeat:","-->");		
	try{
		var length = (eval(objectRepeat)).length;
	}catch(e){
		console.log(e);
		var length = 0;
	}		
	var repeat_content = this.extractIn(content,"<!--repeat:" + objectRepeat + "-->", "<!--/repeat:" + objectRepeat + "-->");		
	for(var i=0;i<length;i++){			
		var new_html_repeat = "";
		new_html_repeat = this.processIf(repeat_content,doc,i);			
		if(new_html_repeat.indexOf("<!--subrepeat:")>-1){
			new_html_repeat = this.processSubrepeat(new_html_repeat,doc,i);
		}			
		new_html_repeat = this.processData(new_html_repeat,doc,i);
		html_repeat += new_html_repeat;
	}
	content = content.replace("<!--repeat:" + objectRepeat + "-->" + repeat_content + "<!--/repeat:" + objectRepeat + "-->", html_repeat);
	return content;
}

self.prototype.processIf = function(content,doc,index){
	var tag = "<!--if:";
	while(content.indexOf(tag)>-1){
		var objectIf = this.extractIn(content,tag,"-->");
		var if_content = this.extractIn(content,tag+objectIf+"-->","<!--/if-->");
		var if_all = tag + objectIf + "-->" + if_content + "<!--/if-->";
		try{
			if(eval(objectIf)){
				content = content.replace(if_all,if_content);
			}else{
				content = content.replace(if_all,"");
			}
		}catch(e){
			content = content.replace(if_all,"");
		}
	}
	return content;
}

self.prototype.processData = function(content,doc,index,index2){
	var tag = "{{data:";		
	while(content.indexOf(tag)>-1){
		var objectData = this.extractIn(content,tag,"}}");
		try{
			content = content.replace(tag+objectData+"}}",eval(objectData));
		}catch(e){
			content = content.replace(tag+objectData+"}}","");
		}
	}
	content = content.replace(tag,"");
	return content;
}

self.prototype.processSubrepeat = function(content,doc,index){
	var html_repeat = "";
	var objectRepeat = this.extractIn(content,"<!--subrepeat:","-->");		
	try{
		var length = (eval(objectRepeat)).length;
	}catch(e){
		console.log(e);
		var length = 0;
	}		
	var repeat_content = this.extractIn(content,"<!--subrepeat:" + objectRepeat + "-->", "<!--/subrepeat:" + objectRepeat + "-->");		
	for(var i=0;i<length;i++){
		var new_html_repeat = this.processData(repeat_content,doc,index,i);
		html_repeat += new_html_repeat;
	}
	content = content.replace("<!--subrepeat:" + objectRepeat + "-->" + repeat_content + "<!--/subrepeat:" + objectRepeat + "-->", html_repeat);
	return content;
}

module.exports = self;
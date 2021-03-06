"use strict";

let self = function(application,params){
	
}



//@route('/manifest.json')
//@method(['get'])
self.prototype.manifest = async function(req,res){
	res.set('Content-Type','text/json');
	res.send({ 
		"name": "PWA - Trascender",
		"short_name": "PWA - Trascender",
		"start_url": "/index",
		"display": "standalone",
		"orientation": "portrait",
		"background-color": "#ccc",
		"theme-color": "#5FAAES",
		"icons": [{
			"src": "/media/img/icons/144x144.png",
			"sizes": "144x144",
			"type": "image/png"
		}, {
			"src": "/media/img/logo.png",
			"sizes": "100x100",
			"type": "image/png"
		}]
	});
}



//@route('/loader.js')
//@method(['get'])
self.prototype.loader = async function(req,res){
	res.set('Content-Type','application/javascript');
	res.send(""+
		"if ('serviceWorker' in navigator) {\n"+
		" 	try{\n"+
		" 		navigator.serviceWorker.register('/sw.js?id=index');\n"+
		" 		console.log('SW registered');\n"+
		"	}catch(err){\n"+
		" 		console.log(err);\n"+
		" 	}\n"+
		"}\n"
	);
}



//@route('/sw.js')
//@method(['get'])
self.prototype.sw = async function(req,res){
	res.set('Content-Type','application/javascript');
	res.send("console.log('sw');");
}

module.exports = self;
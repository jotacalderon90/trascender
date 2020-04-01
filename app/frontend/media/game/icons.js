ICONS = {};
ICONS_CANT = 0;
ICONS_LOADED = 0;
var icons = function(callback){
	this.src = {
		LLANO: "icon/board_llano.png",
		MOUNTAIN: "icon/board_mountain.png",
		FOREST: "icon/board_forest.png",
		METEORITE: "icon/board_meteorite.png",
		//BUILDER: "icon/board_icon03.png",
		//HOUSE: "icon/board_icon04.png",
		MAINBASE_PLAYER1: "icon/building_baseprincipalP1.png",
		MAINBASE_PLAYER2: "icon/building_baseprincipalP2.png",
		BARRACK_PLAYER1: "icon/building_barrackP1.png",
		BARRACK_PLAYER2: "icon/building_barrackP2.png",
		WHILE_PLAYER1: "icon/building_whileP1.png",
		WHILE_PLAYER2: "icon/building_whileP2.png",
		FACTORY_PLAYER1: "icon/building_factoryP1.png",
		FACTORY_PLAYER2: "icon/building_factoryP2.png",
		OFFICES_PLAYER1: "icon/building_officesP1.png",
		OFFICES_PLAYER2: "icon/building_officesP2.png",
		STRATEGICR_PLAYER1: "icon/building_srP1.png",
		STRATEGICR_PLAYER2: "icon/building_srP2.png",
		WORKER_PLAYER1: "icon/unit_workerP1.png",
		WORKER_PLAYER2: "icon/unit_workerP2.png",
		//UNIT_PLAYER1: "icon/unit_fusilP1.png",
		//UNIT_PLAYER2: "icon/unit_workerP1.png",
		STEP: "icon/board_step.png",
		TEMPO1: "icon/tempo1.png",
		TEMPO2: "icon/tempo2.png",
		TEMPO3: "icon/tempo3.png",
		TEMPO4: "icon/tempo4.png",
		WORKER_PLAYER1_WAIT: "icon/unitUsed_workerP1.png",
		WORKER_PLAYER2_WAIT: "icon/unitUsed_workerP2.png"
	};
	for(img in this.src){
		ICONS_CANT++;
	}
	for(img in this.src){
		let image = new Image();
		image.onload = this.onload(image,img,callback);
		image.src = this.src[img];

	}
}
icons.prototype.onload = function(img,type,callback){
	return function(){
		ICONS[type] = img;
		ICONS_LOADED++;
		if(ICONS_LOADED==ICONS_CANT){
			callback();
		}
	}
}
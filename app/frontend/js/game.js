app.controller("gameCtrl", function(trascender,$scope){
	
	/****************/
	/*MAP CONTROLLER*/
	/****************/
	const mapCtrl = function(){
		this.map = L.map('map', {
			center: [-33.44287893807368,-70.65392374992372],
			zoom: 10
		});
		L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(this.map);
		
		this.map.on('zoomend', ()=>{this.onMapMove();});
		
		this.map.on('dragend', ()=>{this.onMapMove();});
	}
	mapCtrl.prototype.onMapMove = async function(){
		try{
			console.log(this.map.getCenter());
			console.log(this.map.getZoom());	
		}catch(e){
			alert(e);
		}
	}
	
	/****************/
	/*TYPER CONTROLLER*/
	/****************/
	const typeCtrl = function(){
		this.Omessage = document.getElementsByTagName("h1")[0];
		this.fingers = [];
		for(let i=0;i<10;i++){
			this.fingers.push(new Audio('./media/audio/game/keypress.mp3'));
		}
	}
	typeCtrl.prototype.type = async function(message,reload){
		let process = this.think(message);
		if(reload){
			this.Omessage.innerHTML = "";
		}
		for(let i=0;i<process.length;i++){
			await this.write(process[i]);
		}
	}
	typeCtrl.prototype.newLine = function(){
		this.Omessage.innerHTML = this.Omessage.innerHTML + "<br>";
	}
	typeCtrl.prototype.think = function(message){
		let len = message.length;
		let finger = 0;
		let process = [];
		for(let i=0;i<len;i++){
			process.push({
				letter:message[i],
				finger:finger,
				time:this.range(),
				volu:Math.random()
			});
			finger = (finger==9)?0:finger+1;
		}
		return process;
	}
	typeCtrl.prototype.range = function(){
		return (Math.floor(Math.random() * 100))*2;// + 40;
	}
	typeCtrl.prototype.write = async function(process){
		return new Promise((resolve, reject)=>{
			setTimeout(()=>{
				this.fingers[process.finger].volume = process.volu;;
				this.fingers[process.finger].play();
				this.Omessage.innerHTML = this.Omessage.innerHTML + process.letter;
				resolve();
			},process.time);
		});
	}
	typeCtrl.prototype.wait = function(TIME){
		return new Promise(function(resolve, reject) {
			setTimeout(function(){
				resolve();
			}, TIME);
		});
	}
	/*****************/
	/*GAME CONTROLLER*/
	/*****************/
	const game = function(){
		let audio = new Audio('./media/audio/background.mp3');
		audio.volume = 0.2; 
		audio.loop = true; 
		audio.play();
		
		this.map = new mapCtrl();
		this.typer = new typeCtrl();
		
		$("#loading").fadeOut();
		this.start();
	}
	game.prototype.start = async function(){
		$("#message").fadeIn();
		await this.typer.type("Hola"); 
		await this.typer.wait(500);
		await this.typer.type(", estas a punto de entrar a mi juego");
		await this.typer.wait(1000);
		await this.typer.type("haz click para continuar...",true);
		this.callback = this.userAccept;
		
		$(document).on('keypress',(e)=>{
			if(e.which == 13) {
				this.callback();
			}
		});
		$(document).on('click',(e)=>{
			this.callback();
		});
	}
	game.prototype.userAccept = async function(){
		this.callback = this.nothingToDo;
		await this.typer.type("ups!",true);
		await this.typer.wait(500);
		await this.typer.type(" falta desarrollo!");
		await this.typer.wait(1000);
		await this.typer.newLine();
		await this.typer.type(" :P");
		await this.typer.wait(1000);
		$(".danger").fadeIn();
		$("#message").fadeOut();
		let audio = new Audio('./media/audio/game/error.mp3');
		audio.loop = true; 
		audio.play();
	}
	game.prototype.nothingToDo = async function(){
		
	}
	
	/**********/
	/*STAR APP*/
	/**********/
	new game();
	
});
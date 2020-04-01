var ctx;

var insertIMG = function(y,x,type){
	ctx.drawImage(ICONS[type], y, x, 50, 50);
}
  
var variables = {
    LLANO: {
        RESISTENCIA: 0
    },
    FOREST: {
        RESISTENCIA: 1
    },
    MOUNTAIN: {
        RESISTENCIA: 2
    },
    WORKER_PLAYER1: {
        STEP: 2,
        COSTO: 1,
        ACTIONS: {
            BUILD: "",
            AWAIT: ""
        }
    },
    WORKER_PLAYER2: {
        STEP: 2,
        COSTO: 1,
        ACTIONS: {
            BUILD: "",
            AWAIT: ""
        }
    },
    BARRACK_PLAYER1: {
        RESISTENCIA: 0,
        TURN: 2,
        MONEY: 1,
        COSTO: 2,
        ACTIONS: {
            CREATE_UNIT: ""
        }
    },
    BARRACK_PLAYER2: {
        RESISTENCIA: 0,
        TURN: 2,
        MONEY: 1,
        COSTO: 2,
        ACTIONS: {
            CREATE_UNIT: ""
        }
    },
    WHILE_PLAYER1: {
        CURRENT: 0
    },
    WHILE_PLAYER2: {
        CURRENT: 0
    },
    MAINBASE_PLAYER1: {
        MONEY: 2
    },
    MAINBASE_PLAYER2: {
        MONEY: 2
    },
	WORKER_PLAYER1_WAIT: {},
	WORKER_PLAYER2_WAIT: {}
};
  
var element = function(type, y, x, player) {
    this.type = type;
	this.player = player;
	for (variable in variables[type]) {
		this[variable] = variables[type][variable];
	}
	insertIMG(y,x,type)
}

var game = function(){
	this.rows = 9;
    this.cols = 15;
    this.square = 50;
    this.canvas = document.getElementById("cv");
    ctx = this.canvas.getContext("2d");
};

game.prototype.load = function(){
	this.canvas.width = (this.cols) * this.square;
    this.canvas.height = (this.rows) * this.square;
	this.printBoard();
	this.printMainBase();
	this.printMeteorite();
	this.printForest();
	this.printMountains();
	this.printUnits();
	this.printMirror();
	this.printMiddle();

    this.currentPlayer = 1;

    this.moneyPlayer1 = 0;
    this.moneyPlayer2 = 0;

	this.setClickeables();
	this.cleanStep();
    this.economy();

    //$("button").hide();
    this.btnHide();
    $("#BTN_FINISH").show();
    
    this.indexBoardSelected;
    this.waitForAction = false;

    this.refreshInfo();
};

game.prototype.getNine = function(x, i) {
	let nine = [];
    x--;
	i--;
	for (let z = x; z < (x + 3); z++) {
		for (let y = i; y < (i + 3); y++) {
			if (z == (x + 1) && y == (i + 1)) {
				
			} else {
				nine.push([z, y]);
			}
		}
	}
	return nine;
}

game.prototype.getCross = function(x, y, step) {
    let steps = [];
    let U, D, L, R;
    U = [x - step, y]
    steps.push(U);
    R = [x, y + step];
    steps.push(R);
	D = [x + step, y];
    steps.push(D);
	L = [x, y - step];
    steps.push(L);
    return steps;
}

game.prototype.getDiamond = function(cross) {
    let r = [];
    let TRAZO = [cross[0][0],cross[0][1]];
    let U = cross[0];
    let R = cross[1];
    let D = cross[2];
    let L = cross[3];

    //DIAGONAL U-R
    while (TRAZO[0] != R[0] && TRAZO[1] != R[1]) {
        TRAZO[0] = TRAZO[0] + 1;
        TRAZO[1] = TRAZO[1] + 1
        r.push([TRAZO[0], TRAZO[1]]);
    }
    r.splice(r.length - 1, 1);

    //DIAGONAL R-D
    while (TRAZO[0] != D[0] && TRAZO[1] != D[1]) {
        TRAZO[0] = TRAZO[0] + 1;
        TRAZO[1] = TRAZO[1] - 1
        r.push([TRAZO[0], TRAZO[1]]);
    }
    r.splice(r.length - 1, 1);
    

    //DIAGONAL D-L
    while (TRAZO[0] != L[0] && TRAZO[1] != L[1]) {
        TRAZO[0] = TRAZO[0] - 1;
        TRAZO[1] = TRAZO[1] - 1;
        r.push([TRAZO[0], TRAZO[1]]);
    }
    r.splice(r.length - 1, 1);

    //DIAGONAL L-U
    while(TRAZO[0]!=U[0] && TRAZO[1]!=U[1]){
    	TRAZO[0] = TRAZO[0]-1;
    	TRAZO[1] = TRAZO[1]+1;
    	r.push([TRAZO[0],TRAZO[1]]);
    }
    r.splice(r.length - 1, 1);

    return r;
}

game.prototype.getResistence = function(obj){
    let r = 0;
    for(let i=0;i<obj.elementos.length;i++){
        if(obj.elementos[i].RESISTENCIA){
            r += obj.elementos[i].RESISTENCIA;
        }
    }
    return r;
}

game.prototype.hasElement = function(obj, element){
    for(let i=0;i<obj.elementos.length;i++){
        if(obj.elementos[i].type==element){
            return true;
        }
    }
    return false;
}

game.prototype.printBoard = function(){
	this.board = new Array(this.rows);
    for (let x = 0; x < this.board.length; x++) {
        this.board[x] = new Array(this.cols);
        for (let y = 0; y < this.board[x].length; y++) {
            this.board[x][y] = {
                x: (x * this.square),
                y: (y * this.square),
                coordenada: [x, y],
                elementos: [new element("LLANO", (y * this.square), (x * this.square))]
			};
        }
    }
}

game.prototype.printMainBase = function(){
	let r = (Math.floor(Math.random() * 3));
    r = (r == 0) ? 0 : (r == 1) ? 4 : (r == 2) ? 8 : r;
	this.board[r][0].elementos.push(new element("MAINBASE_PLAYER1", this.board[r][0].y, this.board[r][0].x, 1));
	this.MainBase_position = r;

    if (r == 0) {
        this.board[2][2].elementos.push(new element("BARRACK_PLAYER1", this.board[r+2][2].y, this.board[r+2][2].x, 1));
    }
    else if (r == 4) {
        this.board[r][2].elementos.push(new element("BARRACK_PLAYER1", this.board[r][2].y, this.board[r][2].x, 1));
    }
    else if (r == 8){
        this.board[6][2].elementos.push(new element("BARRACK_PLAYER1", this.board[r-2][2].y, this.board[r-2][2].x, 1));
    }
}

game.prototype.printMeteorite = function(){
	let meteorites = [];
    for (let x = 0; x < this.rows; x++) {
        for (let i = 0; i <= 6; i++) {
            if (this.board[x][i].elementos.length == 1) {
                let n = (this.getNine(x, i));
                let hasSome = false;
                for (let z = 0; z < n.length; z++) {
                    if (n[z][0] >= 0 && n[z][1] >= 0 && this.board[n[z][0]] && this.board[n[z][0]][n[z][1]]) {
                        if (this.board[n[z][0]][n[z][1]].elementos.length != 1) {
                            hasSome = true;
                        }
                    }
                }
                if (!hasSome) {
                    meteorites.push([x, i]);
                }
            }
        }
    }
    let selected = [];
    while (selected.length != 1) {
        let aux = (Math.floor(Math.random() * (meteorites.length)));
        if (selected.indexOf(aux) == -1) {
            selected.push(aux);
        }
    }
    for (let i = 0; i < selected.length; i++) {
        let obj = this.board[meteorites[selected[i]][0]][meteorites[selected[i]][1]];
        obj.elementos.push(new element("METEORITE", obj.y, obj.x));
    }
}

game.prototype.printForest = function(){
	let spaces = [];
    for (let x = 0; x < this.rows; x++) {
        for (let i = 0; i <= 6; i++) {
            if (this.board[x][i].elementos.length == 1) {
                spaces.push([x, i]);
            }
        }
    }
    let forest = Math.floor(((this.rows * (Math.floor(this.cols / 2))) * 25) / 100);
    selected = [];
    while (selected.length != forest) {
        let aux = (Math.floor(Math.random() * (spaces.length)));
        if (selected.indexOf(aux) == -1) {
            selected.push(aux);
        }
    }
    for (let i = 0; i < selected.length; i++) {
        let obj = this.board[spaces[selected[i]][0]][spaces[selected[i]][1]];
        obj.elementos.push(new element("FOREST", obj.y, obj.x));
    }
}

game.prototype.printMountains = function(){
	spaces = [];
    for (let x = 0; x < this.rows; x++) {
        for (let i = 0; i < 6; i++) {
            if (this.board[x][i].elementos.length == 1) {
                spaces.push([x, i]);
            }
        }
    }
    let mountain = Math.floor(((this.rows * Math.floor(this.cols / 2)) * 15) / 100);
    selected = [];
    while (selected.length != mountain) {
        let aux = (Math.floor(Math.random() * (spaces.length)));
        if (selected.indexOf(aux) == -1) {
            selected.push(aux);
        }
    }
    for (let i = 0; i < selected.length; i++) {
        let obj = this.board[spaces[selected[i]][0]][spaces[selected[i]][1]];
        obj.elementos.push(new element("MOUNTAIN", obj.y, obj.x));
    }
}

game.prototype.printUnits = function(){
    let unit = [];
    switch (this.MainBase_position) {
        case 0:
            unit = [
                [0, 2],
                [1, 1],
                [1, 2],
                [2, 0],
                [2, 1],
                [2, 2]
            ];
            break;
        case 4:
            unit = [
                [3, 1],
                [3, 2],
                [4, 2],
                [5, 1],
                [5, 2]
            ];
            break;
        case 8:
            unit = [
                [6, 0],
                [6, 1],
                [6, 2],
                [7, 1],
                [7, 2],
                [8, 2]
            ];
            break;
    }

    selected = [];
    while (selected.length != 3) {
        let aux = (Math.floor(Math.random() * (unit.length)));
        if (selected.indexOf(aux) == -1) {
            selected.push(aux);
        }
    }
    for (let i = 0; i < selected.length; i++) {
        let obj = this.board[unit[selected[i]][0]][unit[selected[i]][1]];
        obj.elementos.push(new element("WORKER_PLAYER1", obj.y, obj.x, 1));
    }

    this.board[4][6].elementos.push(new element("WORKER_PLAYER1", this.board[4][6].y, this.board[4][6].x, 1)); 
}

game.prototype.printMirror = function(){
	//var cont = 0;
    for (let x = 0; x < this.rows; x++) {
        for (let i = 0; i <= 6; i++) {
            if (this.board[x][i].elementos.length > 1) {
                let obj = this.board[(this.rows - x) - 1][(this.cols - i) - 1];
                for (let z = 1; z < this.board[x][i].elementos.length; z++) {
                    let aux = this.board[x][i].elementos[z];
                    if (aux.player == 1) {
                        obj.elementos.push(new element(aux.type.replace("1", "2"), obj.y, obj.x, 2));
                    } else {
                        obj.elementos.push(new element(aux.type, obj.y, obj.x));
                    }
                }
            }
        }
    }
}

game.prototype.printMiddle = function(){
    let mf = Math.floor(this.rows / 2);
    let mc = Math.floor(this.cols / 2);
    //board[mf-1][mc].elementos.push(new element("HOUSE",board[mf-1][mc].y,board[mf-1][mc].x));
    //board[mf+1][mc].elementos.push(new element("HOUSE",board[mf+1][mc].y,board[mf+1][mc].x));
    this.board[mf][mc].elementos.push(new element("METEORITE", this.board[mf][mc].y, this.board[mf][mc].x));

    //testeo
    let mid = [];
    mid = [ [0,mc],[1,mc],[2,mc],[3,mc] ];
    
    selected = [];
    while (selected.length != 2) {
        let aux = (Math.floor(Math.random() * (mid.length)));
        if (selected.indexOf(aux) == -1) {
            selected.push(aux);
        }
    }
    for (let i = 0; i < selected.length; i++) {
        let obj = this.board[mid[selected[i]][0]][mid[selected[i]][1]];
        obj.elementos.push(new element("FOREST", obj.y, obj.x));
    }
    
    for (let x = 0; x <= 3; x++) {
            if (this.board[x][mc].elementos.length > 1) {
                let obj = this.board[(this.rows - x)-1][mc];
                for (let z = 1; z < this.board[x][mc].elementos.length; z++) {
                    let aux = this.board[x][mc].elementos[z];
                    obj.elementos.push(new element(aux.type, obj.y, obj.x));
                    
                }
            }
    }
}

game.prototype.repint = function(obj){
    for (let x = 0; x < obj.elementos.length; x++) {
        insertIMG(obj.y, obj.x, obj.elementos[x].type);
    }
}

game.prototype.setClickeables = function(player){
	this.clickeables = [];
	for (f in this.board) {
        for (c in this.board[f]) {
            let hasClick = false;
            for (let i = 0; i < this.board[f][c].elementos.length; i++) {
                if (this.board[f][c].elementos[i].player == this.currentPlayer) {
                    hasClick = true;
                }
            }
            if (hasClick) {
                this.clickeables.push(this.board[f][c]);
            }
        }
    }
}

game.prototype.setClicked = function(x,y){
	this.indexSelected = -1;
	this.clicked = null;
    this.clickeables.forEach((obj)=>{
        this.indexSelected++;
        if (y >= (obj.y) && y <= (obj.y + this.square) && x >= obj.x && x <= (obj.x + this.square)) {
			this.indexBoardSelected = this.indexSelected;
			this.clicked = obj;
			console.log(obj);
		}
	});
}

game.prototype.cleanStep = function() {
	if(this.steps){
		for (let i = 0; i < this.steps.length; i++) {
			let c = this.steps[i];
			let b = this.board[c[0]][c[1]];
			b.elementos.splice(b.elementos.length - 1, 1);
            this.repint(b);
		}
	}	
	this.steps = [];
}

game.prototype.getSteps = function(obj,step){
    let boardToStep = [];
    let stepB = new Number(step)
    let cross = this.getCross(obj.coordenada[0], obj.coordenada[1], 1);
    for(let i=0;i<cross.length;i++){
        if (this.board[cross[i][0]]) {
            if (this.board[cross[i][0]][cross[i][1]]) {
                let c = this.board[cross[i][0]][cross[i][1]];
                let r = this.getResistence(c);
                if(step > r){
                    boardToStep.push(c);
                    step--;
                    if(step - r > 0){
                        boardToStep = boardToStep.concat(this.getSteps(c,step))
                    }
                }
            }
        }
        step = stepB;
    }
    return boardToStep;
}

game.prototype.setSteps = function(obj,unit){
    let boardToStep = this.getSteps(obj,unit.STEP);
	boardToStep = boardToStep.concat(obj);
	let boardToStepUnique = [];
    for(let i=0; i<boardToStep.length;i++){
		let c = boardToStep[i];
        if(!this.hasElement(c,"STEP") && !this.hasElement(c,"WORKER_PLAYER" +  + this.currentPlayer)){
			this.steps.push(c.coordenada);
			c.elementos.push(new element("STEP", c.y, c.x));
			boardToStepUnique.push(c);
		}
	}
	//agregar unidad seleccionada
	obj.elementos.push(new element("STEP", obj.y, obj.x));
	this.steps.push(obj.coordenada);
	boardToStepUnique = boardToStepUnique.concat(obj);
	this.stepClickeable = boardToStepUnique;
	this.boardSelected = obj;
}

game.prototype.indexElement = function(obj,type){
    let index = -1;
    for(let i=0;i<obj.elementos.length;i++){
        if(obj.elementos[i].type==type){
            index = i;
        }
    }
    return index;
}

game.prototype.economy = function(){
    for(let i=0;i<this.clickeables.length;i++){
        let c = this.clickeables[i];
        for(let x=0;x<c.elementos.length;x++){
            let e = c.elementos[x];
            if(e.MONEY!=null && e.MONEY!=undefined){
                this["moneyPlayer" + this.currentPlayer] += e.MONEY;
            }
        }
    }
}

game.prototype.update = function(){
    for(let i=0;i<this.clickeables.length;i++){
        let c = this.clickeables[i];
        for(let x=0;x<c.elementos.length;x++){
            let e = c.elementos[x];
            if(e.CURRENT!=null && e.CURRENT!=undefined){
                e.CURRENT++;
				if(e.CURRENT == variables[e.BUILD].TURN){
                    let iw = this.indexElement(c,"WHILE_PLAYER" + this.currentPlayer);
                    c.elementos[iw] = new element(e.BUILD, c.y, c.x,this.currentPlayer);
					
					let it = this.indexElement(c,"TEMPO1");
					c.elementos.splice(it,1);
					
                    this.repint(c);
                }
            }
        }
    }
}

game.prototype.printTEMPO = function(c){
	if(c){
		for(let x=0;x<c.elementos.length;x++){
			let e = c.elementos[x];
			if(e.CURRENT!=null && e.CURRENT!=undefined){
				let t = variables[e.BUILD].TURN - e.CURRENT;
				c.elementos.push(new element("TEMPO" + t, c.y, c.x,this.currentPlayer));
			}
		}
	}else{
		for(let i=0;i<this.clickeables.length;i++){
			c = this.clickeables[i];
			for(let x=0;x<c.elementos.length;x++){
				let e = c.elementos[x];
				if(e.CURRENT!=null && e.CURRENT!=undefined){
					let t = variables[e.BUILD].TURN - e.CURRENT;
					
					let it = this.indexElement(c,"TEMPO" + (t + 1));
					c.elementos.splice(it,1);
					c.elementos.push(new element("TEMPO" + t, c.y, c.x,this.currentPlayer));
					
				}
			}
		}
	}	
}

game.prototype.move = function(x,y){
    let selectOk = false;
    this.stepClickeable.forEach((obj)=>{
        if (y >= (obj.y) && y <= (obj.y + this.square) && x >= obj.x && x <= (obj.x + this.square)) {

            selectOk = true;

            //rescatar unidad
            let unit = this.boardSelected.elementos[this.boardSelected.elementos.length-1];

            //eliminar elemento del objeto
            this.boardSelected.elementos.splice(this.boardSelected.elementos.length - 1, 1);
			this.repint(this.boardSelected);
            
            //eliminar de los clickeables si no tiene barraca
            let ib = this.indexElement(this.boardSelected,"BARRACK_PLAYER" + this.currentPlayer);
            if(ib==-1){
				this.backuprmclicked = true;
                this.clickeables.splice(this.indexBoardSelected,1);
            }else{
				this.backuprmclicked = false;
			}
			
			//agregar backup para cancelar accion
			this.backup = this.boardSelected;

            //agregar el objeto
            obj.elementos.push(unit);
            insertIMG(obj.y, obj.x, unit.type);
			
            //activar botones
            for(action in unit.ACTIONS){
                $("#BTN_" + action).removeAttr("disabled");
            }
			
            this.boardSelected = false;
            this.waitForAction = true;
            this.current = obj;
        } 
    });

    if(!selectOk){
        this.boardSelected = false;
    }
}

game.prototype.canvasClick = function(event){
    if(!this.waitForAction){
        let x = event.pageY;
        let y = event.pageX;
        this.cleanStep();
        if(!this.boardSelected){
			this.setClicked(x,y);
			if(this.clicked!=null){
				let unit = this.clicked.elementos.filter((row)=>{
					return row.type === "WORKER_PLAYER" + this.currentPlayer;
				})[0];
				if(unit){
					//selecciono unidad
					this.setSteps(this.clicked,unit);
				}else{
					//selecciono edificio
					let b = this.clicked.elementos[this.clicked.elementos.length-1];
					//activar botones
					for(action in b.ACTIONS){
						$("#BTN_" + action).removeAttr("disabled");
					}
					this.boardSelected = false;
					this.waitForAction = true;
					this.current = this.clicked;
				}
			}
        }else{
            this.move(x,y);
        }
    }else{
        alert("ESPERANDO POR ACCION DE LA UNIDAD");
    }
}

game.prototype.canvasClick2 = function(event){
	event.preventDefault();
	if(this.waitForAction){
		if(confirm("¿Esta seguro de cancelar la acción?")){
			
            //rescatar unidad
            let unit = this.current.elementos[this.current.elementos.length-1];
			
			//eliminar nueva posicion
			this.current.elementos.splice(this.current.elementos.length - 1, 1);
			this.repint(this.current);
			
			//restaurar en posicion previa
			this.backup.elementos.push(unit);
			insertIMG(this.backup.y, this.backup.x, unit.type);
			
			if(this.backuprmclicked){
				this.clickeables.push(this.backup);
			}
			
			this.boardSelected = false;
            this.waitForAction = false;
		}
	}
}

game.prototype.btnWait = function(){
    insertIMG(this.current.y, this.current.x, "WORKER_PLAYER" + this.currentPlayer + "_WAIT");
	this.waitForAction = false;
    this.btnHide();
}

game.prototype.btnBuild = function(){
    //abrir menu de seleccion
    this.waitForAction = false;
    if(this.current.elementos.length!=2){
        console.log("no se puede");
    }else if(this["moneyPlayer" + this.currentPlayer] >= variables["BARRACK_PLAYER" + this.currentPlayer].COSTO){
        this.current.elementos.splice(this.current.elementos.length-1,1);
        
        this.repint(this.current);
        this.current.elementos.push (new element("WHILE_PLAYER" + this.currentPlayer, this.current.y, this.current.x,this.currentPlayer));
        this.current.elementos[this.current.elementos.length-1].BUILD = "BARRACK_PLAYER" + this.currentPlayer;
        this.btnHide();
		
		this.printTEMPO(this.current);
        
		//actualiza monedas
        this["moneyPlayer" + this.currentPlayer] -= variables["BARRACK_PLAYER" + this.currentPlayer].COSTO;
    }else{
        console.log("no hay money");
    }
    console.log(this["moneyPlayer" + this.currentPlayer]);
    this.refreshInfo();
}

game.prototype.btnCreateUnit = function(){
    //abrir menu de seleccion
    if(this["moneyPlayer" + this.currentPlayer] >= variables["WORKER_PLAYER" + this.currentPlayer].COSTO){
        this.current.elementos.push (new element("WORKER_PLAYER" + this.currentPlayer, this.current.y, this.current.x,this.currentPlayer));
        insertIMG(this.current.y, this.current.x, "WORKER_PLAYER" + this.currentPlayer + "_WAIT");
        this.clickeables.splice(this.indexBoardSelected,1);
        this.waitForAction = false;
        this.btnHide();

        this["moneyPlayer" + this.currentPlayer] = this["moneyPlayer" + this.currentPlayer] - variables["WORKER_PLAYER" + this.currentPlayer].COSTO;
    }else{
        console.log("no hay money");
    }
    console.log(this["moneyPlayer" + this.currentPlayer]);
    this.refreshInfo();
}

game.prototype.btnFinish = function(){
    this.boardSelected = false;
    this.waitForAction = false;
    this.currentPlayer = (this.currentPlayer==1)?2:1;
    this.setClickeables();
    this.cleanStep();
    this.economy();
    console.log(this["moneyPlayer" + this.currentPlayer]);
    this.update();
	this.printTEMPO();
    this.refreshInfo();
	
	for(let i=0;i<this.clickeables.length;i++){
		let c = this.clickeables[i];
		this.repint(c);
	}
	
    //cambiar de usado a normal, para las unidades
}

game.prototype.btnHide = function(){
    $("#BTN_AWAIT").attr("disabled","disabled");
    $("#BTN_BUILD").attr("disabled","disabled");
    $("#BTN_ATTACK").attr("disabled","disabled");
    $("#BTN_CREATE_UNIT").attr("disabled","disabled");
}

game.prototype.refreshInfo = function(){
    //$("#INFO_PLAYER").html("player: " + this.currentPlayer );
    $("#MP1").html(this["moneyPlayer1"]);
    $("#MP2").html(this["moneyPlayer2"]);
}

new icons(()=>{
	
	var g = new game();

	g.load();

	g.canvas.addEventListener("click", (event)=>{g.canvasClick(event);});
	
	g.canvas.addEventListener("contextmenu", (event)=>{g.canvasClick2(event);});
	
    $("#bw").click(()=>{g.btnWait()});

    $("#bb").click(()=>{g.btnBuild()});

    $("#bf").click(()=>{g.btnFinish()});

    $("#BTN_CREATE_UNIT").click(()=>{g.btnCreateUnit()});
});

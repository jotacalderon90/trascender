var mongo = new(require("../lib/mongodb"));

var app = async function(){
	let db = await mongo.connect("mongodb://127.0.0.1:27017/trascender")
	let coll = await mongo.find(db,"story",{audio: {$nin: [undefined,null,""]}},{});
	for(let i=0;i<coll.length;i++){
		console.log(i);
		let d = {$set: {audio: coll[i].audio.replace("http://historia.jotace.cl","")}}
		await mongo.updateOne(db,"story",coll[i]._id,d);
	}
	db.close();
}

app();
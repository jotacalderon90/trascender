var mongo = new(require("../lib/mongodb"));

var app = async function(){
	let db = await mongo.connect("mongodb://127.0.0.1:27017/trascender")
	let coll = await mongo.find(db,"story",{latitud: {$nin: [null,""]},longitud :{$nin: [null,""]}},{});
	for(let i=0;i<coll.length;i++){
		let newdoc = {
			STORY: coll[i]._id.toString(),
			LAT: coll[i].latitud,
			LNG: coll[i].longitud,
			AUDIO: coll[i].audio
		}
		await mongo.insertOne(db,"map",newdoc);
		console.log((i+1) + "/" + coll.length);
	}
	db.close();
}

app();
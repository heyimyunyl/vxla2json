let fs = require("fs")
let fsx = require("fs-extra")
let xml2js = require("xml-js")

let vxla = fs.readFileSync("./input.vxla").toString()
let songdb = require(__dirname + "/node_modules/songdb.json")
let codename = process.argv[2]

if (!songdb[codename]) {
	console.log("\nOops! Looks like the codename you have entered is not in the database.\nHere is a list of available codenames: \n\n"+ Object.keys(songdb).join("\n") +"\n\nIf you still can't make it work, please check dlc_00/generic/audio or videos to find the codename you are looking for.\n")
	process.exit(1)
}
else if (songdb[codename]){
	if (!fs.existsSync("./maps/" + codename)) fs.mkdirSync("./maps/" + codename, {recursive:true})
	if (!fs.existsSync("./maps/" + codename + "/classifiers_WIIU")) fs.mkdirSync("./maps/" + codename + "/classifiers_WIIU", {recursive:true})
	if (!fs.existsSync("./maps/" + codename + "/moves")) fs.mkdirSync("./maps/" + codename + "/moves", {recursive:true})
}

// -- functions
function getMs(s) {
	return parseInt((s * 1000).toFixed())
}
function isUpperCase(string) {
	if (string[0] !== string[0].toLowerCase()) return 1
	else return 0
}

let finalJSON = {}
let lyrics = [];
let beats = [];
let pictos = [];
let moves = []
function lsd2tp() {
	console.log("\nStarting the conversation of " + codename +" VXLA file to Just Dance Now/TAPE format.")
	let jsonXml = JSON.parse(xml2js.xml2json(vxla, {compact: true, spaces: 4}))
	let lyricArray = jsonXml["AnnotationFile"]["IntervalLayer"][0]["Interval"]
	let beatsArray = jsonXml["AnnotationFile"]["IntervalLayer"][2]["Interval"]
	let pictosArray = jsonXml["AnnotationFile"]["IntervalLayer"][3]["Interval"]
	let movesArray = jsonXml["AnnotationFile"]["IntervalLayer"][4]["Interval"]
	
	// -- lyrics
	console.log(`[${jsonXml["AnnotationFile"]["IntervalLayer"][0]["_attributes"].name}] Converting lyrics`)
	for (var i=0; i<lyricArray.length; i++) {
		if (i > lyricArray.length) i = 0
		let lyricObj = {}
		lyricObj["time"] = getMs(lyricArray[i]._attributes.t1),
		lyricObj["duration"] = getMs(lyricArray[i]._attributes.t2 - lyricArray[i]._attributes.t1),
        lyricObj["text"] = lyricArray[i]._attributes.value
        if (lyricArray[i + 1] && isUpperCase(lyricArray[i + 1]._attributes.value)) lyricObj["isLineEnding"] = 1 
		else if (i == lyricArray.length - 1) lyricObj["isLineEnding"] = 1
		else lyricObj["isLineEnding"] = 0
		lyrics.push(lyricObj)
	}
	// -- beats
	console.log(`[${jsonXml["AnnotationFile"]["IntervalLayer"][2]["_attributes"].name}] Converting beats`)
	for (var i=0; i<beatsArray.length; i++) {
		beats.push(getMs(beatsArray[i]._attributes.t1)),beats.sort(function (a, b) {  return a - b;  })
	}
	// -- pictos
	console.log(`[${jsonXml["AnnotationFile"]["IntervalLayer"][3]["_attributes"].name}] Converting pictos`)
	for (var i=0; i<pictosArray.length; i++) {
		let pictoObj = {}
		if (pictosArray[i]._attributes.value.length > 0) {
			pictoObj["time"] = getMs(pictosArray[i]._attributes.t1),
			pictoObj["duration"] = getMs(pictosArray[i]._attributes.t2 - pictosArray[i]._attributes.t1),
			pictoObj["name"] = `posefiles_dlc00_${codename.toLowerCase()}_${pictosArray[i]._attributes.value}`
			pictos.push(pictoObj)
		}
	}
	// -- moves
	console.log(`[${jsonXml["AnnotationFile"]["IntervalLayer"][4]["_attributes"].name}] Converting moves0`)
	for (var i=0; i<movesArray.length; i++) {
		let movesObj = {}
		movesObj["name"] = `dancemodel_dlc00_${codename.toLowerCase()}_${movesArray[i]._attributes.value.replace(/\*/g, '')}`,
		movesObj["time"] = getMs(movesArray[i]._attributes.t1),
		movesObj["duration"] = getMs(movesArray[i]._attributes.t2 - movesArray[i]._attributes.t1),
		moves.push(movesObj)
		let genericMSM = "000000010000000767656E6572696300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000047656E657269630000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004163635F4465765F4469725F4E5000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003F26F3003F8CCCCD406000003FA666663DCCCCCD211C00000000000000000002000000230000000200000000BF7CD3113F755D583FD6692CBF8E87E3BF970C61400F2D22C016026F3F765E603F82B840BF14C497BF22AE903EAC6ACB3C46DF163F3E7F1BBE0CCE78BE99431F3AADACF8BF38FBA13FAD5E0EBF57B184406A49D53FE21B113FDC5FE33FDE8D843FCE02133FD205FA3FEA4D433FA69ADF41D3610041C91A2541CD1A7841D4321441C6339841C1F7FD41B7EDF53B9A710F3BB658563BCA7BCC3B7AAFD63BAF2E6B3BF426CD3BBB9E2A3B90AD7B3BEDA8ED3C1F13403B8CF2263BFB0E4C3C21150E3B817CAB3C37ABB43C6A6D0F3C62B0B83BE531203C3145B33CA160E93C2007673FAC45BA3FE9D0493FC2BA6E3FC0C4FF4014F2083F8968F33FDD43DA3B42BAB63B90A1B53B32E3F53B1FC1193B609F433B41055D3B457A213FD4481841C8D709"
		fs.writeFileSync(`./maps/${codename}/classifiers_WIIU/dancemodel_dlc00_${codename.toLowerCase()}_${movesArray[i]._attributes.value.replace(/\*/g, '')}.msm`, Buffer.from(genericMSM, "hex"))
	}

	// extra info
        finalJSON = {
        "MapName": codename,
        "JDVersion": 2021,
        "OriginalJDVersion": 2021,
        "Artist": songdb[codename].artist,
        "Title": songdb[codename].title,
        "Credits": songdb[codename].copyright.replace(/[\r\n]+/g," "),
        "NumCoach": 1,
        "CountInProgression": 1,
        "DancerName": "Unknown Dancer",
        "LocaleID": 4294967295,
        "MojoValue": 0,
        "Mode": 6,
        "Status": 3,
        "LyricsType": 0,
        "BackgroundType": 0,
        "Difficulty": parseInt(songdb[codename]["Dance Difficulty"]),
		"DefaultColors": {
			"lyrics": "0xFFFF0000",
			"theme": "0xFFFFFFFF",
			"songColor_1A": "0xFF022B5B",
			"songColor_1B": "0xFF3E2FEA",
			"songColor_2A": "0xFF4BC8FF",
			"songColor_2B": "0xFFB100D2"
    },
		"lyricsColor": "#FF0000",
		"videoOffset": 0
	}
	writeTextures()
	finalJSON.beats = beats
	finalJSON.lyrics = lyrics
	finalJSON.pictos = pictos
	// -- this part is a mess, im lazy asf so i cant do it better rn, done this to make the output look exactly like jdnow jsons...
	finalJSON.AudioPreview = {}
	finalJSON.AudioPreview.coverflow = {}
	finalJSON.AudioPreview.prelobby = {}
	finalJSON.AudioPreview.coverflow.startbeat = beats.indexOf(getMs(songdb[codename]["preview start"])) + 1
	finalJSON.AudioPreview.coverflow.endbeat = beats.indexOf(getMs(songdb[codename]["preview end"])) + 1
	finalJSON.AudioPreview.prelobby.startbeat = beats.indexOf(getMs(songdb[codename]["preview start"])) + 1
	finalJSON.AudioPreview.prelobby.endbeat = beats.indexOf(getMs(songdb[codename]["preview end"])) + 1
	finalJSON.AudioPreviewFadeTime = 0.5
	fs.writeFileSync(`./maps/${codename}/${codename}.json`, JSON.stringify(finalJSON,null,4)) // -- write the main json
	fs.writeFileSync(`./maps/${codename}/moves/${codename}_moves0.json`, JSON.stringify(moves,null,4)) // -- write moves0
	console.log(`\n[IMPORTANT] Let's Dance and Sing does not have gold moves so please make your own.\n[DONE!] Have fun and credit Yunyl for use.\n`)
}
function writeTextures() {
	fsx.copySync(`./node_modules/cover.jpg`, `./maps/${codename}/${codename.toLowerCase()}_cover.jpg`)
	fsx.copySync(`./node_modules/coach_1.png`, `./maps/${codename}/${codename.toLowerCase()}_coach_1.png`)
	fsx.copySync(`./node_modules/thumb.jpg`, `./maps/${codename}/${codename.toLowerCase()}_thumb.jpg`)
}
lsd2tp()
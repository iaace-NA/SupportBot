"use strict";
const fs = require("fs");
let CONFIG;
try {
	CONFIG = JSON.parse(fs.readFileSync("../config.json", "utf-8"));
	CONFIG.VERSION = "v1.2.0b";//b for non-release (in development)
}
catch (e) {
	console.log("something's wrong with config.json");
	console.error(e);
	process.exit(1);
}

let path = require('path');
let crypto = require("crypto");
let https = require('https');
let LoadAverage = require("../loadaverage.js");
//const aes256 = require("aes256");
//let cipher = aes256.createCipher(fs.readFileSync("./aes256.key", "utf-8"));
const response_type = ["Total", "Uncachable", "Cache hit", "Cache hit expired", "Cache miss"];
const load_average = [new LoadAverage(60), new LoadAverage(60), new LoadAverage(60), new LoadAverage(60), new LoadAverage(60)];
const express = require("express");
const website = express();

const UTILS = new (require("../utils.js"))();
let Profiler = require("../timeprofiler.js");
let request = require("request");
UTILS.assert(UTILS.exists(CONFIG.API_PORT_PRODUCTION));
UTILS.assert(UTILS.exists(CONFIG.API_PORT_DEVELOPMENT));
UTILS.output("Modules loaded.");
let apicache = require("mongoose");
apicache.connect("mongodb://localhost/apicache");//cache of summoner object name lookups
apicache.connection.on("error", function (e) { throw e; });
let api_doc = new apicache.Schema({
	url: String,
	response: String,
	expireAt: Date
});
api_doc.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
api_doc.index({ url: "hashed" });
let api_doc_model = apicache.model("api_doc_model", api_doc);
let shortcut_doc = new apicache.Schema({
	uid: String,
	shortcuts: { type: apicache.Schema.Types.Mixed, default: {} }
}, { minimize: false });
shortcut_doc.index({ uid: "hashed" });
let shortcut_doc_model = apicache.model("shortcut_doc_model", shortcut_doc);
let region_limiters = {};
let limiter = require("bottleneck");
for (let b in CONFIG.REGIONS) region_limiters[CONFIG.REGIONS[b]] = new limiter({ maxConcurrent: 1, minTime: CONFIG.API_PERIOD });
let req_num = 0;
let irs = {};//individual request statistics
let database_profiler = new Profiler("Database Profiler");
let server;
if (process.env.NODE_ENV === "production") {//production key
	server = https.createServer({ key: fs.readFileSync("../data/keys/server.key"), 
		cert: fs.readFileSync("../data/keys/server.crt"), 
		ca: fs.readFileSync("../data/keys/ca.crt")}, website).listen(CONFIG.API_PORT_PRODUCTION);
	UTILS.output("IAPI PRODUCTION mode ready and listening on port " + CONFIG.API_PORT_PRODUCTION);
}
else {//non-production key
	server = https.createServer({ key: fs.readFileSync("../data/keys/server.key"), 
		cert: fs.readFileSync("../data/keys/server.crt"), 
		ca: fs.readFileSync("../data/keys/ca.crt")}, website).listen(CONFIG.API_PORT_DEVELOPMENT);
	UTILS.output("IAPI " + process.env.NODE_ENV + " mode ready and listening on port " + CONFIG.API_PORT_DEVELOPMENT);
}
let websocket = require("express-ws")(website, server);
website.use(function (req, res, next) {
	res.removeHeader("X-Powered-By");
	return next();
});
let shard_ws = {};
let champ_emojis = {};
website.ws("/shard", (ws, req) => {
	UTILS.debug("/shard reached");
	if (!UTILS.exists(req.query.k)) return ws.close(4401);//unauthenticated
	if (req.query.k !== CONFIG.API_KEY) return ws.close(4403);//wrong key
	UTILS.debug("ws connected from shard: " + req.query.id);
	shard_ws[req.query.id] = ws;
	ws.on("message", data => {
		data = JSON.parse(data);
		switch (data.type) {
			case 1:
			case 3:
			case 5://received emojis
				for (let b in data.emojis) champ_emojis[data.emojis[b].name] = data.emojis[b].code;
				if (allShardsConnected()) {
					let response = [];
					for (let b in champ_emojis) response.push({ name: b, code: champ_emojis[b] });
					shardBroadcast({ type: 4, emojis: response });
				}
				break;
			default:
				UTILS.output("ws encountered unexpected message type: " + data.type + "\ncontents: " + JSON.stringify(data, null, "\t"));
		}
	});
	//ws.close(4200);//OK
});
function allShardsConnected() {
	for (let i = 0; i < CONFIG.SHARD_COUNT; ++i) if (!UTILS.exists(shard_ws[i + ""])) return false;
	return true;
}
function shardBroadcast(message, server_shards_only = true) {
	let i = 0;
	if (server_shards_only) i = 1;
	for (; i < CONFIG.SHARD_COUNT; ++i) shard_ws[i + ""].send(message);
	UTILS.debug("ws broadcast message sent: type: " + message.type);
}
serveWebRequest("/lol/:region/:cachetime/:maxage/:request_id/", function (req, res, next) {
	if (!UTILS.exists(irs[req.params.request_id])) irs[req.params.request_id] = [0, 0, 0, 0, 0, new Date().getTime()];
	++irs[req.params.request_id][0];
	get(req.params.region, req.query.url, parseInt(req.params.cachetime), parseInt(req.params.maxage), req.params.request_id).then(result => res.json(result)).catch(e => {
		console.error(e);
		res.status(500);
	});
}, true);
serveWebRequest("/terminate_request/:request_id", function (req, res, next) {
	for (let b in irs) if (new Date().getTime() - irs[b][5] > 1000 * 60 * 10) delete irs[b];//cleanup old requests
	if (!UTILS.exists(irs[req.params.request_id])) return res.status(200).end();//doesn't exist
	let description = [];
	for (let i = 0; i < 5; ++i) description.push(response_type[i] + " (" + irs[req.params.request_id][i] + "): " + UTILS.round(100 * irs[req.params.request_id][i] / irs[req.params.request_id][0], 0) + "%");
	description = description.join(", ");
	UTILS.output("IAPI: request #" + req.params.request_id + " (" + (new Date().getTime() - irs[req.params.request_id][5]) + "ms): " + description);
	console.log("");
	delete irs[req.params.request_id];
	res.status(200).end();
	UTILS.debug(database_profiler.endAll());
}, true);
serveWebRequest("/createshortcut/:uid", function(req, res, next) {
	shortcut_doc_model.findOne({ uid: req.params.uid }, (err, doc) => {
		if (err) {
			console.error(err);
			return res.status(500).end();
		}
		if (UTILS.exists(doc)) {
			let shortcut_count = 0;
			for (let b in doc.shortcuts) ++shortcut_count;
			if (shortcut_count >= 50) return res.json({ success: false });
			doc.shortcuts[req.query.from] = req.query.to;
			doc.markModified("shortcuts");
			doc.save(e => {
				if (e) {
					console.error(e);
					return res.status(500).end();
				}
				else {
					res.json({ success: true });
				}
			});
		}
		else {
			let new_shortcuts = {
				uid: req.params.uid,
				shortcuts: {}
			}
			new_shortcuts.shortcuts[req.query.from] = req.query.to;
			let new_document = new shortcut_doc_model(new_shortcuts);
			new_document.save((e, doc) => {
				if (e) {
					console.error(e);
					return res.status(500).end();
				}
				else {
					res.json({ success: true });
				}
			});
		}
	});
}, true);
serveWebRequest("/removeshortcut/:uid", function(req, res, next) {
	shortcut_doc_model.findOne({ uid: req.params.uid }, (err, doc) => {
		if (err) {
			console.error(err);
			return res.status(500).end();
		}
		if (UTILS.exists(doc)) {
			delete doc.shortcuts[req.query.from];
			doc.markModified("shortcuts");
			doc.save(e => {
				if (e) {
					console.error(e);
					return res.status(500).end();
				}
				else {
					res.json({ success: true });
				}
			});
		}
		else {
			res.json({ success: true });
		}
	});
}, true);
serveWebRequest("/removeallshortcuts/:uid", function(req, res, next) {
	shortcut_doc_model.findOne({ uid: req.params.uid }, (err, doc) => {
		if (err) {
			console.error(err);
			return res.status(500).end();
		}
		if (UTILS.exists(doc)) {
			doc.shortcuts = {};
			doc.markModified("shortcuts");
			doc.save(e => {
				if (e) {
					console.error(e);
					return res.status(500).end();
				}
				else {
					res.json({ success: true });
				}
			});
		}
		else {
			res.json({ success: true });
		}
	});
}, true);
serveWebRequest("/getshortcut/:uid", function(req, res, next) {
	shortcut_doc_model.findOne({ uid: req.params.uid }, (err, doc) => {
		if (err) {
			console.error(err);
			return res.status(500).end();
		}
		if (UTILS.exists(doc)) {
			if (UTILS.exists(doc.shortcuts[req.query.from])) {
				let answer = {};
				answer[req.query.from] = doc.shortcuts[req.query.from];
				res.json(answer);
			}
			else res.status(404).end();
		}
		else {
			res.status(404).end();
		}
	});
}, true);
serveWebRequest("/getshortcuts/:uid", function(req, res, next) {
	shortcut_doc_model.findOne({ uid: req.params.uid }, (err, doc) => {
		if (err) {
			console.error(err);
			return res.status(500).end();
		}
		if (UTILS.exists(doc)) {
			res.json(doc.toObject());
		}
		else {
			res.send("{}");
		}
	});
});
//https.createServer({ key: fs.readFileSync("./privkey.pem"), cert: fs.readFileSync("./fullchain.pem") }, website).listen(443);
serveWebRequest("/ping", function (req, res, next) {
	res.json({ received: new Date().getTime() });
}, true);
serveWebRequest("/stats", function (req, res, next) {
	let answer = {};
	for (let i in load_average) {
		answer[i + ""] = {};
		answer[i + ""].description = response_type[i];
		answer[i + ""].min1 = load_average[i].min1();
		answer[i + ""].min5 = load_average[i].min5();
		answer[i + ""].min15 = load_average[i].min15();
		answer[i + ""].min30 = load_average[i].min30();
		answer[i + ""].min60 = load_average[i].min60();
		answer[i + ""].total_rate = load_average[i].total_rate();
		answer[i + ""].total_count = load_average[i].total_count();
	}
	res.json(answer);
}, true);
serveWebRequest("/eval/:script", function (req, res, next) {
	let result = {};
	try {
		result.string = eval(req.params.script);
	}
	catch (e) {
		result.string = e;
	}
	res.json(result).end();
}, true);
serveWebRequest("/", function (req, res, next) {
	res.send("You have reached the online api's testing page.").end();
});
serveWebRequest("*", function (req, res, next) {
	res.status(404).end();
});
function serveWebRequest(branch, callback, validate = false) {
	if (typeof(branch) == "string") {
		website.get(branch, function (req, res, next) {
			//UTILS.output("\trequest received #" + req_num + ": " + req.originalUrl);
			if (validate && !UTILS.exists(req.query.k)) return res.status(401).end();//no key
			if (validate && req.query.k !== CONFIG.API_KEY) return res.status(403).end();//wrong key
			++req_num;
			load_average[0].add();
			callback(req, res, next);
		});
	}
	else {
		for (let b in branch) {
			website.get(branch[b], function(req, res, next){
				//UTILS.output("\trequest received #" + req_num + ": " + req.originalUrl);
				if (validate && !UTILS.exists(req.query.k)) return res.status(401).end();//no key
				if (validate && req.query.k !== CONFIG.API_KEY) return res.status(403).end();//wrong key
				++req_num;
				load_average[0].add();
				callback(req, res, next);
			});
		}
	}
}
function changeBaseTo62(number) {
	number = parseInt(number);//convert to string
	const dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let answer = "";
	while (number > 0) {
		answer = dictionary.substring(number % 62, (number % 62) + 1) + answer;
		number = (number - (number % 62)) / 62;
	}
	return answer;
}
function changeBaseTo55(number) {
	number = parseInt(number);//convert to string
	const dictionary = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
	let answer = "";
	while (number > 0) {
		answer = dictionary.substring(number % 55, (number % 55) + 1) + answer;
		number = (number - (number % 55)) / 55;
	}
	return answer;
}
function checkCache(url, maxage, request_id) {
	return new Promise((resolve, reject) => {
		database_profiler.begin(url + " cache check");
		api_doc_model.findOne({ url }, (err, doc) => {
			database_profiler.end(url + " cache check");
			if (err) return reject(err);
			if (UTILS.exists(doc)) {
				if (UTILS.exists(maxage) && apicache.Types.ObjectId(doc.id).getTimestamp().getTime() < new Date().getTime() - (maxage * 1000)) {//if expired
					//UTILS.output("\tmaxage expired url: " + url);
					load_average[3].add();
					if (UTILS.exists(irs[request_id])) ++irs[request_id][3];
					doc.remove(() => {});
					reject(null);
				}
				else resolve(doc.toObject().response);
			}
			else {
				load_average[4].add();
				if (UTILS.exists(irs[request_id])) ++irs[request_id][4];
				reject(null);
			}
		});
	});
}
function addCache(url, response, cachetime) {
	let new_document = new api_doc_model({ url: url, response: response, expireAt: new Date(new Date().getTime() + (cachetime * 1000)) });
	new_document.save((e, doc) => {
		if (e) console.error(e);
	});
}
function get(region, url, cachetime, maxage, request_id) {
	//cachetime in seconds, if cachetime is 0, do not cache
	//maxage in seconds, if maxage is 0, force refresh
	let that = this;
	return new Promise((resolve, reject) => {
		const url_with_key = url.replace("?api_key=", "?api_key=" + CONFIG.RIOT_API_KEY);
		if (cachetime != 0) {//cache
			checkCache(url, maxage, request_id).then((cached_result) => {
				//UTILS.output("\tcache hit: " + url);
				load_average[2].add();
				if (UTILS.exists(irs[request_id])) ++irs[request_id][2];
				resolve(JSON.parse(cached_result));
			}).catch((e) => {
				if (UTILS.exists(e)) console.error(e);
				region_limiters[region].submit((no_use, cb) => {
					cb();
					request(url_with_key, (error, response, body) => {
						if (UTILS.exists(error)) reject(error);
						else {
							try {
								const answer = JSON.parse(body);
								//UTILS.output("\tcache miss: " + url);
								addCache(url, body, cachetime);
								resolve(answer);
							}
							catch (e) {
								reject(e);
							}
						}
					});
				}, null, () => {});
			});
		}
		else {//don't cache
			region_limiters[region].submit((no_use, cb) => {
				cb();
				request(url_with_key, (error, response, body) => {
					if (UTILS.exists(error)) reject(error);
					else {
						try {
							const answer = JSON.parse(body);
							//UTILS.output("\tuncached: " + url);
							load_average[1].add();
							if (UTILS.exists(irs[request_id])) ++irs[request_id][1];
							resolve(answer);
						}
						catch (e) {
							reject(e);
						}
					}
				});
			}, null, () => {});
		}
	});
}

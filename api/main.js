"use strict";
const fs = require("fs");
const argv_options = new (require("getopts"))(process.argv.slice(2), {
	alias: { c: ["config"] },
	default: { c: "config.json5" }});
let CONFIG;
const JSON5 = require("json5");
try {
	CONFIG = JSON5.parse(fs.readFileSync("../" + argv_options.config, "utf-8"));
	CONFIG.VERSION = "v1.8.1";//b for non-release (in development)
}
catch (e) {
	console.log("something's wrong with config.json");
	console.error(e);
	process.exit(1);
}
const lolapi = new (require("../utils/lolapi.js"))(CONFIG, "0", true, rawAPIRequest);
function endpointToURL(region, endpoint) {
	let options = UTILS.parseQuery(endpoint.substring(endpoint.indexOf("?")));
	let maxage = parseInt(options.iapimaxage);
	let request_id = options.iapirequest_id;
	delete options.iapimaxage;
	delete options.iapirequest_id;
	let path = endpoint.substring(0, endpoint.indexOf("?"));
	let newEndpoint = path;
	let paramcount = 0;
	for (let i in options) {
		if (typeof(options[i]) === "object") {
			for (let j in options[i]) {
				newEndpoint += (paramcount == 0 ? "?" : "&") + i + "=" + encodeURIComponent(options[i][j]);
				++paramcount;
			}
		}
		else {
			newEndpoint += (paramcount == 0 ? "?" : "&") + i + "=" + encodeURIComponent(options[i]);
			++paramcount;
		}
	}
	let query = endpoint.substring(endpoint.indexOf("?") + 1);//?date=0&iapi
	let url = "https://" + region + ".api.riotgames.com" + path + "?api_key=";
	for (let i in options) {
		url += "&" + i + "=" + encodeURIComponent(options[i]);
	}
	//UTILS.debug("endpointToURL result from (" + region + ", " + endpoint + "): url: " + url + " maxage: " + maxage + " endpoint: " + newEndpoint + " request_id: " + request_id);
	return { url, maxage, endpoint: newEndpoint, request_id };
}
let https = require('https');
let riotRequest = new (require("riot-lol-api"))(CONFIG.RIOT_API_KEY, 12000, {
	get: function(region, endpoint, callback) {
		const oldFormat = endpointToURL(region, endpoint);
		if (oldFormat.maxage != 0) {
			checkCache(oldFormat.url, oldFormat.maxage, oldFormat.request_id).then(data => {
				callback(null, data);
				load_average[2].add();
				if (UTILS.exists(irs[oldFormat.request_id])) ++irs[oldFormat.request_id][2];
			}).catch(e => {
				callback(null, null);
			});
		}
		else {
			load_average[1].add();
			if (UTILS.exists(irs[oldFormat.request_id])) ++irs[oldFormat.request_id][1];
			callback(null, null);
		}
	},
	set: function(region, endpoint, cacheStrategy, data) {
		const oldFormat = endpointToURL(region, endpoint);
		if (cacheStrategy.cachetime != 0 && !(UTILS.exists(data.status) && data.status.status_code >= 500)) addCache(oldFormat.url, JSON.stringify(data), cacheStrategy.cachetime);
		else;
	}
});

let LoadAverage = require("../utils/loadaverage.js");
const response_type = ["Total", "Uncachable", "Cache hit", "Cache hit expired", "Cache miss"];
const load_average = [new LoadAverage(60), new LoadAverage(60), new LoadAverage(60), new LoadAverage(60), new LoadAverage(60)];
const dc_load_average = new LoadAverage(60);//discord command load average
const express = require("express");
const website = express();

const UTILS = new (require("../utils/utils.js"))();
let Profiler = require("../utils/timeprofiler.js");
let request = require("request");
let wsRoutes = require("./websockets.js");
let routes = require("./routes.js");
UTILS.assert(UTILS.exists(CONFIG.API_PORT), "API port does not exist in config.");
UTILS.output("Modules loaded.");
let apicache = require("mongoose");
apicache.connect(CONFIG.MONGODB_ADDRESS, { useNewUrlParser: true });//cache of summoner object name lookups
apicache.connection.on("error", function (e) { throw e; });

let api_doc = new apicache.Schema({
	url: String,
	response: String,
	expireAt: Date
});
api_doc.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
api_doc.index({ url: "hashed" });
let api_doc_model = apicache.model("api_doc_model", api_doc);

let shortcut_doc = new apicache.Schema({//basically user preferences
	uid: { type: String, required: true },
	shortcuts: { type: apicache.Schema.Types.Mixed, default: {}, required: true },
	username: { type: String, required: true},
	verifiedAccounts: { type: apicache.Schema.Types.Mixed, default: {}, required: true }//["region:summonerid"] = expiry date ms
}, { minimize: false });
shortcut_doc.index({ uid: "hashed" });
let shortcut_doc_model = apicache.model("shortcut_doc_model", shortcut_doc);

let disciplinary_doc = new apicache.Schema({
	user: { type: Boolean, required: true },//true for user, false for server
	ban: { type: Boolean, required: true },//true for ban, false for warning/other note
	target_id: { type: String, required: true },//target id: uid or sid
	reason: { type: String, required: true },//text reason for disciplinary action
	date: { type: Date, required: true },//new Date() set to 0 if permanent, set to date values for temporary
	active: { type: Boolean, required: true },//true if active ban, false if overridden or warning
	issuer_id: { type: String, required: true }//uid for the person who issued the ban
});
disciplinary_doc.index({ target_id: "hashed" });//direct username lookups
disciplinary_doc.index({ issuer_id: "hashed" });//direct issuer lookups
//disciplinary_doc.index({ target_id: 1 });//ranged username lookups
disciplinary_doc.index({ active: 1, date: 1, user: 1, ban: 1 });//actives for broadcast to shards
let disciplinary_model = apicache.model("disciplinary_model", disciplinary_doc);
let msg_audit_doc = new apicache.Schema({
	mid: { type: String, required: true },//message id
	uid: { type: String, required: true },//user id
	tag: { type: String, required: true },//username#discriminator
	cid: { type: String, required: true },//channel id
	sid: { type: String },//server id not required
	content: { type: String },
	clean_content: { type: String },
	guild_name: { type: String },//server name, not required
	channel_name: { type: String },//channel name, not required
	calls: { type: Number, required: true },//number of API calls
	chr: { type: Number },//0-1 floating point number for cache hit ratio
	creation_time: { type: Date, required: true },//when the command was sent
	reply_time: { type: Date, required: true },//when the reply was sent
	ttr: { type: Number, required: true },//time to respond (ms)
	permission: { type: Number, required: true },//permission level number
	response: { type: String },//string reply
	embed: { type: apicache.Schema.Types.Mixed },//embed object reply
	shard: { type: Number, required: true },
	expireAt: { type: Date, required: true }
});
msg_audit_doc.index({ mid: 1 });
msg_audit_doc.index({ uid: "hashed" });
msg_audit_doc.index({ tag: "hashed" });
msg_audit_doc.index({ cid: "hashed" });
msg_audit_doc.index({ sid: "hashed" });
msg_audit_doc.index({ content: "hashed" });
msg_audit_doc.index({ clean_content: "hashed" });
msg_audit_doc.index({ guild_name: "hashed" });
msg_audit_doc.index({ channel_name: "hashed" });
msg_audit_doc.index({ calls: -1 });
msg_audit_doc.index({ chr: -1 });
msg_audit_doc.index({ creation_time: -1 });
msg_audit_doc.index({ reply_time: -1 });
msg_audit_doc.index({ ttr: -1 });
msg_audit_doc.index({ permission: "hashed" });
msg_audit_doc.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
let msg_audit_model = apicache.model("msg_audit_model", msg_audit_doc);


let server_preferences_doc = new apicache.Schema({
	id: { type: String, required: true },//id of server
	prefix: { type: String, required: isString, default: CONFIG.DISCORD_COMMAND_PREFIX },//default bot prefix
	enabled: { type: Boolean, required: true, default: true },//whether or not the bot is enabled on the server
	slow: { type: Number, required: true, default: 0 },//self slow mode
	//region: { type: String, required: true, default: "" },//default server region, LoL ("" = disabled)
	auto_opgg: { type: Boolean, required: true, default: true },//automatically embed respond to op.gg links
	force_prefix: { type: Boolean, required: true, default: false },
	release_notifications: { type: Boolean, required: true, default: true },
	feedback_enabled: { type: Boolean, required: true, default: true}
	//music
	/*
	max_music_length: { type: Number, required: true, default: 360 },//in seconds
	paused: { type: Boolean, required: true, default: false },//music paused (or not)
	connected_playback: { type: Boolean, required: true, default: false },//requiring users to be connected in order to request songs
	*/
	//boatbot-only
	/*
	personalizations: { type: Boolean, required: true, default: false },//whether or not personalizations are enabled
	personalized_commands: { type: apicache.Schema.Types.Mixed, default: {}, required: true },//
	pro: { type: Number, required: true, default: 0 },//when their premium features expire (0 = disabled)
	ccid: { type: String, required: true, default: "" },//cleverbot conversation ID
	welcome_cid: { type: String, required: true, default: "" },//welcome channel ID ("" = disabled)
	farewell_cid: { type: String, required: true, default: "" },//farewell channel ID ("" = disabled)
	*/
}, { minimize: false });
server_preferences_doc.index({ id: "hashed" });
server_preferences_doc.index({ id: 1 });
let server_preferences_model = apicache.model("server_preferences_doc", server_preferences_doc);

let irs = {};//individual request statistics
let database_profiler = new Profiler("Database Profiler");
let server = https.createServer({ key: fs.readFileSync("../data/keys/server.key"),
		cert: fs.readFileSync("../data/keys/server.crt"),
		ca: fs.readFileSync("../data/keys/ca.crt")}, website).listen(CONFIG.API_PORT);
server.setTimeout(120000);
UTILS.output(CONFIG.VERSION + " IAPI " + process.env.NODE_ENV + " mode ready and listening on port " + CONFIG.API_PORT);
let websocket = require("express-ws")(website, server);
website.use(function (req, res, next) {
	res.setTimeout(120000);
	res.removeHeader("X-Powered-By");
	return next();
});
const HEARTBEAT_INTERVAL = 60000;
let shard_ws = {};
let ws_request_id = 0;
let message_handlers = {};
website.ws("/shard", (ws, req) => {
	UTILS.debug("/shard reached");
	if (!UTILS.exists(req.query.k)) return ws.close(4401);//unauthenticated
	if (req.query.k !== CONFIG.API_KEY) return ws.close(4403);//wrong key
	UTILS.debug("ws connected $" + req.query.id);
	shard_ws[req.query.id] = ws;
	//send bans
	ws.on("message", data => {
		data = JSON.parse(data);
		UTILS.debug("ws message received: $" + data.id + " type: " + data.type);
		wsRoutes(CONFIG, ws, shard_ws, data, shardBroadcast, sendToShard, getBans, sendExpectReplyBroadcast, rawAPIRequest, irs);
		if (UTILS.exists(data.request_id) && UTILS.exists(message_handlers[data.request_id])) {
			let nMsg = UTILS.copy(data);
			delete nMsg.request_id;
			message_handlers[data.request_id](nMsg);
			delete message_handlers[data.request_id];
		}
		for (let b in message_handlers) if (parseInt(b.substring(0, b.indexOf(":"))) < new Date().getTime() - (15 * 60 * 1000)) delete message_handlers[b];//cleanup old message handlers
	});
	ws.on("close", (code, reason) => {
		UTILS.output("ws $" + req.query.id + " closed: " + code + ", " + reason);
	});
	//ws.close(4200);//OK
});
function sendExpectReplyRaw(message, destination, callback) {
	let request = UTILS.copy(message);
	if (request.request_id != undefined) throw new Error("request.request_id must be undefined for send and receive");
	++ws_request_id;
	request.request_id = new Date().getTime() + ":" + ws_request_id;
	message_handlers[request.request_id] = callback;
	sendToShard(request, destination);
	UTILS.debug("request " + ws_request_id + " sent with contents" + JSON.stringify(request, null, "\t"));
}
function sendExpectReply(message, destination, timeout = 5000) {
	return new Promise((resolve, reject) => {
		sendExpectReplyRaw(message, destination, resolve);
		setTimeout(function () {
			reject(new Error("timed out waiting for response from shard"));
		}, timeout);
	});
}
function sendExpectReplyBroadcast(message, timeout = 5000) {
	let shard_numbers = [];
	for (let i = 0; i < CONFIG.SHARD_COUNT; ++i) shard_numbers.push(i);
	return Promise.all(shard_numbers.map(n => sendExpectReply(message, n, timeout)));
}

setInterval(() => {
	shardBroadcast({ type: 0 });
}, HEARTBEAT_INTERVAL);
function shardBroadcast(message, exclusions = []) {
	for (let i = 0; i < CONFIG.SHARD_COUNT; ++i) if (exclusions.indexOf(i) == -1) sendToShard(message, i);
	UTILS.debug("ws broadcast message sent: type: " + message.type);
}
function sendToShard(message, id, callback) {
	if (UTILS.exists(shard_ws[id + ""]) && shard_ws[id + ""].readyState == 1) shard_ws[id + ""].send(JSON.stringify(message), callback);
}
function getBans(user, callback) {
	disciplinary_model.find({ user, ban: true, active: true, $or: [{ date : { $eq: new Date(0) } }, { date: { $gte: new Date() } }] }, "target_id date", (err, docs) => {
		if (err) console.error(err);
		let bans = {};
		docs.forEach(ban => {
			if (!UTILS.exists(bans[ban.target_id])) bans[ban.target_id] = ban.date.getTime();
			else if (bans[ban.target_id] != 0) {//has a current temporary ban
				if (ban.date.getTime() == 0) bans[ban.target_id] = 0;//overriding permaban
				else if (ban.date.getTime() > bans[ban.target_id]) bans[ban.target_id] = ban.date.getTime();//overriding longer ban
			}
			//else;//perma'd already
		});
		callback(bans);
	});
}
/*
serveWebRequest("/lol/:region/:cachetime/:maxage/:request_id/", function (req, res, next) {
	if (!UTILS.exists(irs[req.params.request_id])) irs[req.params.request_id] = [0, 0, 0, 0, 0, new Date().getTime()];
	++irs[req.params.request_id][0];
	get(req.params.region, req.query.url, parseInt(req.params.cachetime), parseInt(req.params.maxage), req.params.request_id).then(result => res.json(result)).catch(e => {
		console.error(e);
		res.status(500);
	});
}, true);*/
serveWebRequest("/lol/:region/:cachetime/:maxage/:request_id/:tag/", (req, res, next) => {
	if (!UTILS.exists(irs[req.params.request_id])) irs[req.params.request_id] = [0, 0, 0, 0, 0, new Date().getTime()];
	++irs[req.params.request_id][0];
	rawAPIRequest(req.params.region, req.params.tag, req.query.endpoint, parseInt(req.params.maxage), parseInt(req.params.cachetime)).then(data => {
		res.status(200).type('application/json').send(data).end();
	}).catch(err => {
		if (err === 500) res.status(500).end();
		else res.status(err.status).type('application/json').send(err.response.res.text).end();
	});
}, true);
serveWebRequest("/terminate_request/:request_id", function (req, res, next) {
	res.status(200).end()
	dc_load_average.add();
	for (let b in irs) if (new Date().getTime() - irs[b][5] > 1000 * 60 * 10) delete irs[b];//cleanup old requests
	let newaudit = {
		mid: req.query.mid,
		uid: req.query.uid,
		tag: req.query.tag,
		cid: req.query.cid,
		calls: req.query.calls,
		creation_time: new Date(parseInt(req.query.creation_time)),
		reply_time: new Date(parseInt(req.query.reply_time)),
		ttr: parseInt(req.query.ttr),
		permission: parseInt(req.query.permission),
		shard: parseInt(req.query.shard),
		expireAt: new Date(new Date().getTime() + (CONFIG.AUDIT_TTL * 1000))
	};
	if (UTILS.exists(req.query.sid)) newaudit.sid = req.query.sid;
	if (UTILS.exists(req.query.guild_name)) newaudit.guild_name = req.query.guild_name;
	if (UTILS.exists(req.query.channel_name)) newaudit.channel_name = req.query.channel_name;
	if (UTILS.exists(req.query.content)) newaudit.content = req.query.content;
	if (UTILS.exists(req.query.clean_content)) newaudit.clean_content = req.query.clean_content;
	if (UTILS.exists(req.query.response)) newaudit.response = req.query.response;
	if (UTILS.exists(req.query.embed)) newaudit.embed = JSON.parse(req.query.embed);
	if (UTILS.exists(irs[req.params.request_id])) {//request handler exists
		let description = [];
		irs[req.params.request_id][4] = irs[req.params.request_id][0] - irs[req.params.request_id][1] - irs[req.params.request_id][2] - irs[req.params.request_id][3];
		for (let i = 0; i < 5; ++i) description.push(response_type[i] + " (" + irs[req.params.request_id][i] + "): " + UTILS.round(100 * irs[req.params.request_id][i] / irs[req.params.request_id][0], 0) + "%");
		description = description.join(", ");
		UTILS.output("IAPI: request #" + req.params.request_id + " (" + (new Date().getTime() - irs[req.params.request_id][5]) + "ms): " + description);
		console.log("");
		newaudit.chr = irs[req.params.request_id][2] / irs[req.params.request_id][0];
		delete irs[req.params.request_id];
		UTILS.debug(database_profiler.endAll(), false);
	}
	let new_document = new msg_audit_model(newaudit);
	new_document.save((e, doc) => {
		if (e) console.error(e);
	})
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
routes(CONFIG, apicache, serveWebRequest, response_type, load_average, disciplinary_model, shortcut_doc_model, getBans, shardBroadcast, sendExpectReply, sendExpectReplyBroadcast, sendToShard, server_preferences_model, dc_load_average);
function serveWebRequest(branch, callback, validate = false) {
	if (typeof(branch) == "string") {
		website.get(branch, function (req, res, next) {
			UTILS.debug("\trequest received: " + req.originalUrl);
			if (validate && !UTILS.exists(req.query.k)) return res.status(401).end();//no key
			if (validate && req.query.k !== CONFIG.API_KEY) return res.status(403).end();//wrong key
			load_average[0].add();
			callback(req, res, next);
		});
	}
	else {
		for (let b in branch) {
			website.get(branch[b], function(req, res, next){
				UTILS.debug("\trequest received: " + req.originalUrl);
				if (validate && !UTILS.exists(req.query.k)) return res.status(401).end();//no key
				if (validate && req.query.k !== CONFIG.API_KEY) return res.status(403).end();//wrong key
				load_average[0].add();
				callback(req, res, next);
			});
		}
	}
}
function rawAPIRequest(region, tag, endpoint, maxage, cachetime) {
	return new Promise((resolve, reject) => {
		riotRequest.request(region, tag, endpoint, { maxage, cachetime }, (err, data) => {
			if (err) {
				if (!err.riotInternal || !UTILS.exists(err.response)) {//real error
					reject(500);
				}
				else {
					const oldFormat = endpointToURL(region, endpoint);
					if (cachetime != 0) addCache(oldFormat.url, err.response.res.text, cachetime);
					reject(err);
				}
			}
			else resolve(data);
		});
	});
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
	//UTILS.debug("CACHE ADD: " + url + " is " + JSON.parse(response).status);
	let new_document = new api_doc_model({ url: url, response: response, expireAt: new Date(new Date().getTime() + (cachetime * 1000)) });
	new_document.save((e, doc) => {
		if (e) console.error(e);
	});
}
function isString(s) {
	return typeof(s) === "string";
}

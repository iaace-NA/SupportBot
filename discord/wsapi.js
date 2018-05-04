"use strict";
const UTILS = new (require("../utils.js"))();
const REQUEST = require("request");
const ws = require("ws");
const fs = require("fs");
const agentOptions = { ca: fs.readFileSync("../data/keys/ca.crt") };
module.exports = class WSAPI {
	/*
	Used for internal communication between shards and IAPI.
	For requests used to process commands, use the lolapi.js file.
	Client sends odd values, server sends even values.
	Sample ws message:
	{
		type: 4,
		id: 0,//shard ID
		emojis: [...]
	}
	id table:
		0: heartbeat request
		1: heartbeat

		2: IAPI stats
		3: shard stats

		4: IAPI broadcasts champ emojis
		5: shard sends whatever emojis it can see

		6: IAPI wants to send a message to a server channel
		7: shard wants to send a message to a server channel

		8: IAPI wants to send a message to a server's default
		9: shard wants to send a message to a server's default

		10: IAPI wants to send a PM
		11: shard wants to send a PM
	*/
	constructor(INIT_CONFIG, discord_client) {
		this.client = discord_client;
		this.CONFIG = INIT_CONFIG;
		if (!UTILS.exists(this.CONFIG)) throw new Error("config.json required.");
		this.request = REQUEST;
		this.address = "wss://" + (process.env.NODE_ENV !== "production" ? this.CONFIG.API_ADDRESS_DEVELOPMENT : this.CONFIG.API_ADDRESS_PRODUCTION);
		this.port = process.env.NODE_ENV !== "production" ? this.CONFIG.API_PORT_DEVELOPMENT : this.CONFIG.API_PORT_PRODUCTION;
		UTILS.debug("wss address attempted: " + this.address + ":" + this.port + "/shard?k=" + encodeURIComponent(this.CONFIG.API_KEY) + "&id=" + process.env.SHARD_ID);
		this.connect();
		this.connection.on("open", () => {
			UTILS.output("ws connected");
		});
		this.connection.on("close", (code, reason) => {
			UTILS.output("ws closed: " + code + ", " + reason);
		});
		this.connection.on("message", data => {
			data = JSON.parse(data);
			UTILS.output("ws message received: type: " + data.type);
			switch(data.type) {//client receives even values only
				case 0://reserved/heartbeat
					this.send({ type: 1, received: new Date().getTime() });
					break;
				case 2://reserved/stat
				case 4://emoji
					let all_emojis = data.emojis;
					for (let b in this.CONFIG.STATIC.CHAMPIONS) {
						const candidate = all_emojis.find(e => { return this.CONFIG.STATIC.CHAMPIONS[b].key.toLowerCase() == e.name; });
						this.CONFIG.STATIC.CHAMPIONS[b].emoji = UTILS.exists(candidate) ? candidate.code : this.CONFIG.STATIC.CHAMPIONS[b].name;
					}
					UTILS.output("champion emojis registered");
					break;
				case 6://send message to channel
					const candidate = this.client.get(data.cid);
					if (UTILS.exists(candidate)) {
						candidate.send(data.content).catch(console.error);
						UTILS.debug("message sent to " + data.cid);
					}
					break;
				case 8://send message to default channel in server
				case 10://send message to user
				default:
					UTILS.output("ws encountered unexpected message type: " + data.type + "\ncontents: " + JSON.stringify(data, null, "\t"));
			}
		});
	}
	sendEmojis(emojis) {
		this.send({ type: 5, emojis });
	}
	sendTextToChannel(cid, content) {
		this.send({ type: 7, content, cid });
	}
	send(raw_object) {
		let that = this;
		raw_object.id = parseInt(process.env.SHARD_ID);
		if (this.connection.readyState != 1) {
			this.connect();
			setTimeout(() => {
				that.send(raw_object);
			}, 10000);
		}
		else this.connection.send(JSON.stringify(raw_object));
	}
	connect() {
		this.connection = new ws(this.address + ":" + this.port + "/shard?k=" + encodeURIComponent(this.CONFIG.API_KEY) + "&id=" + process.env.SHARD_ID, agentOptions);
	}
}

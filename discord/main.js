"use strict";
const start_time = new Date().getTime();
const fs = require("fs");

const UTILS = new (require("../utils.js"))();
const { ShardingManager } = require('discord.js');
const util = require("util");

let CONFIG;
try {
	CONFIG = JSON.parse(fs.readFileSync("../config.json", "utf-8"));
	CONFIG.VERSION = "v1.3.0b";//b for non-release (in development)
}
catch (e) {
	UTILS.output("something's wrong with config.json");
	console.error(e);
	process.exit(1);
}
const mode = process.env.NODE_ENV === "production" ? "PRODUCTION:warning:" : process.env.NODE_ENV;

const manager = new ShardingManager("./shard.js", 
	{ token: process.env.NODE_ENV == "production" ? CONFIG.DISCORD_API_KEY_PRODUCTION : CONFIG.DISCORD_API_KEY_DEVELOPMENT,
	totalShards: CONFIG.SHARD_COUNT,
	respawn: false});

manager.spawn();
UTILS.output("Sharding Manager started");
manager.on("launch", shard => {
	UTILS.output("Launched shard " + shard.id);
	UTILS.output(util.inspect(shard.process));
	//shard.process.stdio.on("data", data => console.log("$" + shard.id + ": " + data));
	//shard.process.stderr.on("data", data => console.error("$" + shard.id + ": " + data));
});

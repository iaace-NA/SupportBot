"use strict";
const fs = require("fs");

const UTILS = new (require("../utils.js"))();
const { ShardingManager } = require('discord.js');

let CONFIG;
try {
	CONFIG = JSON.parse(fs.readFileSync("../config.json", "utf-8"));
}
catch (e) {
	UTILS.output("something's wrong with config.json");
	console.error(e);
	process.exit(1);
}

const manager = new ShardingManager("./shard.js",
	{ token: process.env.NODE_ENV == "production" ? CONFIG.DISCORD_API_KEY_PRODUCTION : CONFIG.DISCORD_API_KEY_DEVELOPMENT,
	totalShards: CONFIG.SHARD_COUNT,
	respawn: false });

manager.on("launch", shard => {
	UTILS.output("Launched shard " + shard.id);
});
manager.spawn(undefined, 10000);
UTILS.output("Sharding Manager started");

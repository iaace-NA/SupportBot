"use strict";
const fs = require("fs");
const argv_options = new (require("getopts"))(process.argv.slice(2), {
	alias: { c: ["config"] },
	default: { c: "config.json" }
});

const UTILS = new (require("../utils.js"))();
const { ShardingManager } = require('discord.js');

let CONFIG;
try {
	CONFIG = JSON.parse(fs.readFileSync("../" + argv_options.config, "utf-8"));
}
catch (e) {
	UTILS.output("something's wrong with config.json");
	console.error(e);
	process.exit(1);
}

const manager = new ShardingManager("./shard.js",
	{ token: CONFIG.DISCORD_API_KEY,
	totalShards: CONFIG.SHARD_COUNT,
	respawn: false,
	shardArgs: process.argv.slice(2) });

manager.on("launch", shard => {
	UTILS.output("Launched shard " + shard.id);
	shard.on("death", () => {
		setTimeout(shard.spawn, 5000);
	});
});
manager.spawn(undefined, 10000);
UTILS.output("Sharding Manager started");

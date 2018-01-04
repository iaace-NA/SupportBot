"use strict";

const fs = require("fs");
const Discord = require("discord.js");
let discordcommands = require("./discord/discordcommands.js");

const UTILS = new (require("./utils.js"))();

const client = new Discord.Client({});

let CONFIG;
try{
	CONFIG = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
}
catch(e) {
	console.log("something's wrong with config.json");
	console.error(e);
	process.exit(1);
}

const LOLAPI = new (require("./discord/lolapi.js"))(CONFIG);

client.on("ready", function () {
	UTILS.output("discord user login success");
});
client.on("disconnect", function () {
	UTILS.output("discord disconnected");
});
client.on("message", function (msg) {
	try {
		discordcommands(CONFIG, client, LOLAPI, msg);
	}
	catch (e) {
		console.error(e);
	}
});
if (process.argv.length === 2) {//production key
	UTILS.output("PRODUCTION LOGIN");
	client.login(CONFIG.DISCORD_API_KEY_PRODUCTION).catch(console.error);
}
else {//non-production key
	UTILS.output("DEVELOPMENT LOGIN");
	client.login(CONFIG.DISCORD_API_KEY_DEVELOPMENT).catch(console.error);
}


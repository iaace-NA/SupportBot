"use strict";
const start_time = new Date().getTime();
const fs = require("fs");
const Discord = require("discord.js");
let discordcommands = require("./discordcommands.js");

const UTILS = new (require("../utils.js"))();

const client = new Discord.Client({ disabledEvents: ["TYPING_START"] });

let CONFIG;
try {
	CONFIG = JSON.parse(fs.readFileSync("../config.json", "utf-8"));
	CONFIG.VERSION = "v1.1.0";//b for non-release (in development)
}
catch (e) {
	console.log("something's wrong with config.json");
	console.error(e);
	process.exit(1);
}
const DB = new (require("./dbmanager.js"))(CONFIG);
const LOLAPI = new (require("./lolapi.js"))(CONFIG);
let mode = "N/A";
LOLAPI.getStatic("realms/na.json").then(result => {//load static dd version
	UTILS.output("DD STATIC RESOURCES LOADED");
	CONFIG.STATIC = result;
	let temp_regions = [];
	for (let i in CONFIG.REGIONS) temp_regions.push(CONFIG.REGIONS[i]);
	Promise.all(temp_regions.map(tr => { return LOLAPI.getStaticChampions(tr); })).then(results => {
		CONFIG.STATIC.CHAMPIONS = results[0].data;
		LOLAPI.getStaticSummonerSpells("na1").then(result => {
			CONFIG.STATIC.SUMMONERSPELLS = result.data;
			UTILS.output("API STATIC RESOURCES LOADED");
			if (process.argv.length === 2) {//production key
				mode = "PRODUCTION:warning:";
				UTILS.output("PRODUCTION LOGIN");
				client.login(CONFIG.DISCORD_API_KEY_PRODUCTION).catch(console.error);
			}
			else {//non-production key
				mode = "DEVELOPMENT"
				UTILS.output("DEVELOPMENT LOGIN");
				client.login(CONFIG.DISCORD_API_KEY_DEVELOPMENT).catch(console.error);
			}
		});
	}).catch(e => { throw e; });
}).catch(e => { throw e; });

client.on("ready", function () {
	UTILS.output("discord user login success");
	client.user.setStatus("online").catch(console.error);
	client.user.setActivity("League of Legends").catch(console.error);
	client.channels.get(CONFIG.LOG_CHANNEL_ID).send(":repeat:Bot started in " + UTILS.round((new Date().getTime() - start_time) / 1000, 0) + "s: version: " + CONFIG.VERSION + " mode: " + mode + " servers: " + client.guilds.size);
});
client.on("disconnect", function () {
	UTILS.output("discord disconnected");
});
client.on("message", function (msg) {
	try {
		discordcommands(CONFIG, client, LOLAPI, msg, DB);
	}
	catch (e) {
		console.error(e);
	}
});
client.on("guildCreate", function (guild) {
	UTILS.output("Server Joined: " + guild.id + " :: " + guild.name + " :: Population=" + guild.memberCount + " :: " + guild.owner.user.tag);
	client.channels.get(CONFIG.LOG_CHANNEL_ID).send(":white_check_mark:Server Joined: `" + guild.id + "` :: " + guild.name + " :: Population=" + guild.memberCount + " :: " + guild.owner.user.tag).catch(e => console.error(e));
	guild.owner.send("SupportBot has joined your server: " + guild.name + "\nUse `Lhelp` for information on how to use SupportBot.\nAdd SupportBot to other servers using this link: <" + CONFIG.BOT_ADD_LINK + ">").catch(e => console.error(e));
	let candidate = UTILS.preferredTextChannel(client, guild.channels, "text", ["general", "bot", "bots", "bot-commands", "botcommands", "lol", "league", "spam"], ["VIEW_CHANNEL", "SEND_MESSAGES"]);
	if (UTILS.exists(candidate)) candidate.send("Use `Lhelp` for information on how to use SupportBot.\nAdd SupportBot to other servers using this link: <" + CONFIG.BOT_ADD_LINK + ">").catch();
});
client.on("guildDelete", function(guild) {
	UTILS.output("Server Left: " + guild.id + " :: " + guild.name + " :: Population=" + guild.memberCount + " :: " + guild.owner.user.tag);
	client.channels.get(CONFIG.LOG_CHANNEL_ID).send(":x:Server Left: `" + guild.id + "` :: " + guild.name + " :: Population=" + guild.memberCount + " :: " + guild.owner.user.tag).catch(e => console.error(e));
});

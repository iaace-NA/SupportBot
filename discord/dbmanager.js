"use strict";
module.exports = class DBManager {//mongodb
	constructor(CONFIG) {
		this.namecache = require("mongoose");
		this.namecache.connect("mongodb://localhost/namecache");
		this.namecache.on("error", function (e) { throw e; });
		this.discordlink = require("mongoose");
		this.discordlink.connect("mongodb://localhost/discordlink");
		this.discordlink.on("error", function (e) { throw e; });
	}
	test() {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Test");
		newEmbed.setDescription("description");
		return newEmbed;
	}
	addLink() {}
}

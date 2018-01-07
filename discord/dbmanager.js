"use strict";
module.exports = class DBManager {//mongodb
	constructor(CONFIG) {
		this.namecache = require("mongoose");
		this.namecache.connect("mongodb://localhost/namecache");//cache of summoner object name lookups
		this.namecache.on("error", function (e) { throw e; });
		this.discordlink = require("mongoose");
		this.discordlink.connect("mongodb://localhost/discordlink");//links discord uids to namecache
		this.discordlink.on("error", function (e) { throw e; });
		this.userSchema = new this.namecache.Schema({
			profileIconId: Number,
			name: String,
			summonerLevel: Number,
			revisionDate: Number,//epoch time
			id: Number,
			accountId: Number,
			lastUpdated: Number
		});
		let that = this;
		this.linkSchema = new this.discordlink.Schema({
			uid: String,
			userref: that.discordlink.Schema.Types.ObjectId
		});
	}
	test() {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Test");
		newEmbed.setDescription("description");
		return newEmbed;
	}
	addLink() {}
}

"use strict";
const UTILS = new (require("../utils.js"))();
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
		this.userModel = this.namecache.model("SummonerModel", this.userSchema);
		this.linkSchema = new this.discordlink.Schema({
			uid: String,
			userref: that.discordlink.Schema.Types.ObjectId
		});
		this.linkModel = this.discordlink.model("DefaultUser", this.linkSchema);
	}
	test() {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Test");
		newEmbed.setDescription("description");
		return newEmbed;
	}
	addLink(uid, summoner) {
		return new Promise((resolve, reject) => {
			this.userModel.findOne({ accountId: summoner.accountId }, (err, doc) => {//see if summoner doc is cached already
				if (err) reject(err);
				if (UTILS.exists(doc)) {//summoner is already cached
					let new_link = new this.DefaultUser({
						"uid": uid,
						userref: doc.id()
					});
					new_link.save(e => { e ? reject(e) : resolve() });
				}
				else {
					reject("Error: The summoner could not be found in our database. Please use `<region> <summoner name>`, then rerun this command.");
				}
			});
		});
	}
	getLink(uid) {
		return new Promise((resolve, reject) => {
			this.linkModel.findOne({ uid: uid }, (err, doc) => {
				if (err) reject(err);
				if (UTILS.exists(doc)) {
					this.userModel.findById(doc.id(), (err, doc) => {
						if (err) reject(err);
						if (UTILS.assert(UTILS.exists(doc))) {
							resolve(doc.toObject);
						}
				});
				}
			});
		});
	}
}

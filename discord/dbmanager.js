"use strict";
const UTILS = new (require("../utils.js"))();
module.exports = class DBManager {//mongodb
	constructor(CONFIG) {
		this.namecache = require("mongoose");
		this.namecache.connect("mongodb://localhost/namecache");//cache of summoner object name lookups
		this.namecache.connection.on("error", function (e) { throw e; });
		this.discordlink = require("mongoose");
		this.discordlink.connect("mongodb://localhost/discordlink");//links discord uids to namecache
		this.discordlink.connection.on("error", function (e) { throw e; });
		this.userSchema = new this.namecache.Schema({
			profileIconId: Number,
			name: String,
			summonerLevel: Number,
			revisionDate: Number,//epoch time
			id: Number,
			accountId: Number,
			lastUpdated: Number,
			region: String
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
		let that = this;
		return new Promise((resolve, reject) => {
			if (!UTILS.exists(summoner.region)) reject("Error: region property undefined for summoner object.");
			this.userModel.findOne({ accountId: summoner.accountId }, (err, doc) => {//see if summoner doc is cached already
				if (err) return reject(err);
				if (UTILS.exists(doc)) {//summoner is already cached
					let new_link = new that.linkModel({
						"uid": uid,
						userref: doc.id
					});
					new_link.save(e => { e ? reject(e) : resolve() });
				}
				else {
					let new_summoner = new that.userModel(summoner);
					new_summoner.save((e, doc) => {
						if (e) return reject(e);
						let new_link = new that.linkModel({
							"uid": uid,
							userref: doc.id
						});
						new_link.save(e => { e ? reject(e) : resolve() });
					});
				}
			});
		});
	}
	getLink(uid) {
		return new Promise((resolve, reject) => {
			this.linkModel.findOne({ uid: uid }, (err, doc) => {
				if (err) return reject(err);
				if (UTILS.exists(doc)) {
					this.userModel.findById(doc.id(), (err, doc) => {
						if (err) return reject(err);
						if (UTILS.assert(UTILS.exists(doc))) {
							resolve(doc.toObject());
						}
					});
				}
				else {
					resolve(null);
				}
			});
		});
	}
}

"use strict";
const UTILS = new (require("../utils.js"))();
module.exports = function(CONFIG, apicache, serveWebRequest, response_type, load_average, disciplinary_model, shortcut_doc_model, getBans, shardBroadcast, sendExpectReply, sendExpectReplyBroadcast, sendToShard, server_preferences_model) {
	serveWebRequest("/createshortcut/:uid", function(req, res, next) {
		findShortcut(req.params.uid, res, doc => {
			if (UTILS.exists(doc)) {
				let shortcut_count = 0;
				for (let b in doc.shortcuts) ++shortcut_count;
				if (shortcut_count >= 50) return res.json({ success: false });
				doc.shortcuts[req.query.from] = req.query.to;
				doc.markModified("shortcuts");
				doc.save(e => {
					if (e) {
						console.error(e);
						return res.status(500).end();
					}
					else res.json({ success: true });
				});
			}
			else {
				let new_shortcuts = {
					uid: req.params.uid,
					shortcuts: {},
					username: ""
				}
				new_shortcuts.shortcuts[req.query.from] = req.query.to;
				let new_document = new shortcut_doc_model(new_shortcuts);
				new_document.save((e, doc) => {
					if (e) {
						console.error(e);
						return res.status(500).end();
					}
					else res.json({ success: true });
				});
			}
		});
	}, true);
	serveWebRequest("/removeshortcut/:uid", function(req, res, next) {
		findShortcut(req.params.uid, res, doc => {
			if (UTILS.exists(doc)) {
				delete doc.shortcuts[req.query.from];
				doc.markModified("shortcuts");
				doc.save(e => {
					if (e) {
						console.error(e);
						return res.status(500).end();
					}
					else res.json({ success: true });
				});
			}
			else res.json({ success: true });
		});
	}, true);
	serveWebRequest("/removeallshortcuts/:uid", function(req, res, next) {
		findShortcut(req.params.uid, res, doc => {
			if (UTILS.exists(doc)) {
				doc.shortcuts = {};
				doc.markModified("shortcuts");
				doc.save(e => {
					if (e) {
						console.error(e);
						return res.status(500).end();
					}
					else res.json({ success: true });
				});
			}
			else res.json({ success: true });
		});
	}, true);
	serveWebRequest("/getshortcut/:uid", function(req, res, next) {
		findShortcut(req.params.uid, res, doc => {
			if (UTILS.exists(doc)) {
				if (UTILS.exists(doc.shortcuts[req.query.from])) {
					let answer = {};
					answer[req.query.from] = doc.shortcuts[req.query.from];
					res.json(answer);
				}
				else res.status(404).end();
			}
			else res.status(404).end();
		});
	}, true);
	serveWebRequest("/getshortcuts/:uid", function(req, res, next) {
		findShortcut(req.params.uid, res, doc => {
			if (UTILS.exists(doc)) res.json({ shortcuts: doc.toObject().shortcuts });
			else res.send("{}");
		});
	}, true);
	serveWebRequest("/setlink/:uid", (req, res, next) => {
		findShortcut(req.params.uid, res, doc => {
			if (UTILS.exists(doc)) {
				doc.username = req.query.link;
				doc.save(e => {
					if (e) {
						console.error(e);
						return res.status(500).end();
					}
					else res.json({ success: true });
				});
			}
			else {
				let new_shortcuts = {
					uid: req.params.uid,
					shortcuts: {},
					username: req.query.link
				}
				let new_document = new shortcut_doc_model(new_shortcuts);
				new_document.save((e, doc) => {
					if (e) {
						console.error(e);
						return res.status(500).end();
					}
					else res.json({ success: true });
				});
			}
		});
	}, true);
	serveWebRequest("/getlink/:uid", function(req, res, next) {
		findShortcut(req.params.uid, res, doc => {
			if (UTILS.exists(doc)) res.json({ username: doc.toObject().username });
			else res.json({ username: "" });
		});
	}, true);
	serveWebRequest("/ban", (req, res, next) => {//boolean-user, string-id, string-reason, number-date, string-issuer, string-issuer_tag, string-issuer_avatarURL
		let new_doc = new disciplinary_model({
			user: req.query.user == "true",
			ban: true,
			target_id: req.query.id,
			reason: ":no_entry: " + req.query.reason,
			date: new Date(parseInt(req.query.date)),
			active: true,
			issuer_id: req.query.issuer
		});
		new_doc.save((e, doc) => {
			if (e) {
				console.error(e);
				res.status(500).end();
			}
			else res.json({ success: true });
			if (req.query.user != "true") shardBroadcast({ type: 18,
				sid: req.query.id,
				reason: req.query.reason,
				date: parseInt(req.query.date),
				issuer_tag: req.query.issuer_tag,
				issuer_avatarURL: req.query.issuer_avatarURL });
			else sendExpectReplyBroadcast({ type: 20,
				uid: req.query.id,
				reason: req.query.reason,
				issuer_tag: req.query.issuer_tag,
				issuer_avatarURL: req.query.issuer_avatarURL,
				date: parseInt(req.query.date) }).then(results => {
					for (let i = 0; i < results.length; ++i) {
						if (results[i].connected) {
							sendToShard({ type: 22,
								uid: req.query.id,
								reason: req.query.reason,
								issuer_tag: req.query.issuer_tag,
								issuer_avatarURL: req.query.issuer_avatarURL,
								date: parseInt(req.query.date) }, i);
							break;
						}
					}
				}).catch(console.error);
			getBans(req.query.user == "true", bans => {
				shardBroadcast({ type: req.query.user == "true" ? 14 : 16, bans });//updates all shards with new ban information
			});

		});
	}, true);
	serveWebRequest("/warn", (req, res, next) => {//boolean-user, string-id, string-reason, string-issuer, boolean-notify, string-issuer_tag, string-issuer_avatarURL
		let new_doc = new disciplinary_model({
			user: req.query.user == "true",
			ban: false,
			target_id: req.query.id,
			reason: (req.query.notify == "true" ? ":warning: " : ":information_source: ") + req.query.reason,
			date: new Date(0),
			active: false,
			issuer_id: req.query.issuer
		});
		new_doc.save((e, doc) => {
			if (e) {
				console.error(e);
				res.status(500).end();
			}
			else {
				res.json({ success: true });
				if (req.query.notify == "true")
				{
					if (req.query.user == "true") sendExpectReplyBroadcast({ type: 20,
					uid: req.query.id,
					reason: req.query.reason,
					issuer_tag: req.query.issuer_tag,
					issuer_avatarURL: req.query.issuer_avatarURL, }).then(results => {
						for (let i = 0; i < results.length; ++i) {
							if (results[i].connected) {
								sendToShard({ type: 24,
									uid: req.query.id,
									reason: req.query.reason,
									issuer_tag: req.query.issuer_tag,
									issuer_avatarURL: req.query.issuer_avatarURL }, i);
								break;
							}
						}
					}).catch(console.error);
					else shardBroadcast({ type: 18,
						sid: req.query.id,
						reason: req.query.reason,
						issuer_tag: req.query.issuer_tag,
						issuer_avatarURL: req.query.issuer_avatarURL });
				}
			}
		});
	}, true);
	serveWebRequest("/unban", (req, res, next) => {//boolean-user, string-id, string-issuer, string-issuer_tag, string-issuer_avatarURL
		let new_doc = new disciplinary_model({
			user: req.query.user == "true",
			ban: false,
			target_id: req.query.id,
			reason: ":no_entry_sign: Bans cleared (unbanned)",
			date: new Date(0),
			active: false,
			issuer_id: req.query.issuer
		});
		new_doc.save(e => {
			if (UTILS.exists(e)) console.error(e);
		});//save a note that the user was unbanned
		disciplinary_model.find({ user: req.query.user == "true", target_id: req.query.id, active: true }, (err, docs) => {
			let errored = false;
			docs.forEach(doc => {
				doc.active = false;
				doc.save(e => {
					if (e) {
						console.error(e);
						errored = true;
					}
				});
			});
			errored ? res.status(500).end() : res.json({ success: true });
			getBans(req.query.user == "true", bans => {
				shardBroadcast({ type: req.query.user == "true" ? 14 : 16, bans });
			});//update shards with new ban list
			if (req.query.user != "true") shardBroadcast({ type: 30,
				sid: req.query.id,
				issuer_tag: req.query.issuer_tag,
				issuer_avatarURL: req.query.issuer_avatarURL });
			else sendExpectReplyBroadcast({ type: 20,
				uid: req.query.id,
				issuer_tag: req.query.issuer_tag,
				issuer_avatarURL: req.query.issuer_avatarURL }).then(results => {
					for (let i = 0; i < results.length; ++i) {
						if (results[i].connected) {
							sendToShard({ type: 28,
								uid: req.query.id,
								issuer_tag: req.query.issuer_tag,
								issuer_avatarURL: req.query.issuer_avatarURL }, i);
							break;
						}
					}
				}).catch(console.error);
			getBans(req.query.user == "true", bans => {
				shardBroadcast({ type: req.query.user == "true" ? 14 : 16, bans });//updates all shards with new ban information
			});
		});
	}, true);
	serveWebRequest("/gethistory", (req, res, next) => {//boolean-user, string-id, number-limit (optional)
		let options = { sort: { "_id": -1 } };
		if (UTILS.exists(req.query.limit) && !isNaN(parseInt(req.query.limit))) options.limit = parseInt(req.query.limit);
		disciplinary_model.find({ user: req.query.user == "true", target_id: req.query.id }, null, options, (err, docs) => {
			let answer = {};
			answer[req.query.id] = docs.map(d => {
				d = d.toObject();
				d.id_timestamp = apicache.Types.ObjectId(d._id).getTimestamp().getTime();
				return d;
			});//add creation timestamp, convert doc to object
			res.json(answer);
		});
	}, true);
	serveWebRequest("/getactions", (req, res, next) => {//string-id, number-limit(optional)
		let options = { sort: { "_id": -1 } };
		if (UTILS.exists(req.query.limit) && !isNaN(parseInt(req.query.limit))) options.limit = parseInt(req.query.limit);
		disciplinary_model.find({ issuer_id: req.query.id }, null, options, (err, docs) => {
			let answer = {};
			answer[req.query.id] = docs.map(d => {
				d = d.toObject();
				d.id_timestamp = apicache.Types.ObjectId(d._id).getTimestamp().getTime();
				return d;
			});//add creation timestamp, convert doc to object
			res.json(answer);
		});
	}, true);
	serveWebRequest("/resetpreferences", (req, res, next) => {
		server_preferences_model.deleteMany({ id: req.query.id }, (err) => {
			if (UTILS.exists(err)) return res.status(500).json(err).end();
			let new_document = new server_preferences_model({ id: req.query.id });
			new_document.save((e, doc) => {
				res.json(doc.toObject());
			});
		});
	}, true);
	serveWebRequest("/getpreferences", (req, res, next) => {
		findPreferences(req.query.id, res, doc => {
			if (!UTILS.exists(doc)) {//create new doc
				let new_document = new server_preferences_model({ id: req.query.id });
				new_document.save((e, doc) => {
					res.json(doc.toObject());
				});
			}
			else {//
				res.json(doc.toObject());
			}
		});
	}, true);
	serveWebRequest("/setpreferences", (req, res, next) => {
		findPreferences(req.query.id, res, doc => {
			if(!UTILS.exists(doc)) return res.status(412).end();//precondition failed
			let c_val = req.query.val;
			if (req.query.type === "number") c_val = parseInt(type);
			else if (req.query.type === "boolean") {
				if (c_val === "true") c_val = true;
				else if (c_val === "false") c_val = false;
				else return res.status(400).end();
			}
			else if (req.query.type === "string" && !UTILS.exists(c_val)) c_val = "";
			UTILS.debug("typeof is " + typeof(c_val) + " while actual value is " + c_val);
			doc[req.query.prop] = c_val;
			doc.markModified(req.query.prop);
			doc.save(e => {
				if (e) {
					console.error(e);
					return res.status(500).end();
				}
				else res.json({ success: true });
			});
		});
	}, true);
	serveWebRequest("/ping", function (req, res, next) {
		res.json({ received: new Date().getTime() });
	}, true);
	serveWebRequest("/stats", function (req, res, next) {
		let answer = {};
		for (let i in load_average) {
			answer[i + ""] = {};
			answer[i + ""].description = response_type[i];
			answer[i + ""].min1 = load_average[i].min1();
			answer[i + ""].min5 = load_average[i].min5();
			answer[i + ""].min15 = load_average[i].min15();
			answer[i + ""].min30 = load_average[i].min30();
			answer[i + ""].min60 = load_average[i].min60();
			answer[i + ""].total_rate = load_average[i].total_rate();
			answer[i + ""].total_count = load_average[i].total_count();
		}
		res.json(answer);
	}, true);
	serveWebRequest("/", function (req, res, next) {
		res.send("You have reached the online api's testing page.").end();
	});
	serveWebRequest("*", function (req, res, next) {
		res.status(404).end();
	});
	function findShortcut(uid, res, callback) {
		shortcut_doc_model.findOne({ uid }, (err, doc) => {
			if (err) {
				console.error(err);
				return res.status(500).end();
			}
			callback(doc);
		});
	}
	function findPreferences(id, res, callback) {
		server_preferences_model.findOne({ id }, (err, doc) => {
			if (err) {
				console.error(err);
				return res.status(500).end();
			}
			callback(doc);
		});
	}
}

"use strict";
const UTILS = new (require("../utils.js"))();
let champ_emojis = {};
module.exports = function(CONFIG, ws, shard_ws, data, shardBroadcast, sendToShard, getBans, sendExpectReplyBroadcast) {
	switch (data.type) {
		case 1:
			break;
		case 3:
		case 5://received emojis
			for (let b in data.emojis) champ_emojis[data.emojis[b].name] = data.emojis[b].code;
			if (allShardsConnected()) {
				let response = [];
				for (let b in champ_emojis) response.push({ name: b, code: champ_emojis[b] });
				shardBroadcast({ type: 4, emojis: response });
			}
			else UTILS.debug(JSON.stringify(disconnectedShards()) + " shards are not connected so emojis will not be sent out yet");
			break;
		case 7:
			shardBroadcast({ type: 6, content: data.content, cid: data.cid }, [data.id]);
			break;
		case 13:
			shardBroadcast({ type: 12, content: data.content, username: data.username, displayAvatarURL: data.displayAvatarURL, release: data.release });
			break;
		case 15:
			getBans(true, bans => {
				sendToShard({ type: 14, bans }, data.id);
			});
			break;
		case 17:
			getBans(false, bans => {
				sendToShard({ type: 16, bans }, data.id);
			});
			break;
		case 21:
			break;
		case 33:
			sendExpectReplyBroadcast({ type: 20, uid: data.uid, embed: data.embed }).then(results => {
				for (let i = 0; i < results.length; ++i) {
					if (results[i].connected) {
						sendToShard({ type: 32,
							uid: data.uid,
							embed: data.embed }, i);
						break;
					}
				}
			}).catch(console.error);
			break;
		case 35:
			shardBroadcast({ type: 34, embed: data.embed, cid: data.cid, approvable: data.approvable }, [data.id]);
			break;
		case 37:
			sendToShard({ type: 36 }, data.id);
			break;
		default:
			UTILS.output("ws encountered unexpected message type: " + data.type + "\ncontents: " + JSON.stringify(data, null, "\t"));
	}
	function allShardsConnected() {//checks heartbeat
		for (let i = 0; i < CONFIG.SHARD_COUNT; ++i) if (!UTILS.exists(shard_ws[i + ""]) || shard_ws[i + ""].readyState != 1) return false;
		return true;
	}
	function disconnectedShards() {//checks heartbeat
		let answer = [];
		for (let i = 0; i < CONFIG.SHARD_COUNT; ++i) if (!UTILS.exists(shard_ws[i + ""]) || shard_ws[i + ""].readyState != 1) answer.push(i);
		return answer;
	}
}

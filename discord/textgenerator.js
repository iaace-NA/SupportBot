"use strict";
const UTILS = new (require("../utils.js"))();
module.exports = class TextGenerator {
	constructor() { }
	ping_callback(msg, nMsg) {
		nMsg.edit(nMsg.content + " " + (nMsg.createdTimestamp - msg.createdTimestamp) + "ms");
	}
	internal_ping(times) {
		return "Time to internal api: " + (times.received - times.started) + " ms. Time to return: " + (times.ended - times.received) + " ms.";
	}
	shortcuts(CONFIG, obj) {
		const post_desc = "To add a shortcut: `" + CONFIG.DISCORD_COMMAND_PREFIX + "setshortcut $<shortcut name> <username>`\nTo remove a shortcut: `" + CONFIG.DISCORD_COMMAND_PREFIX + "removeshortcut $<shortcut name>`\nTo remove all shortcuts: `" + CONFIG.DISCORD_COMMAND_PREFIX + "removeallshortcuts`";
		if (!UTILS.exists(obj.shortcuts) || Object.keys(obj.shortcuts).length == 0) return post_desc;
		let answer = "```";
		for (let b in obj.shortcuts) answer += "\n$" + b + " -> " + obj.shortcuts[b];
		return answer + "```" + post_desc;
	}
	owners(CONFIG) {
		let answer = "Here are my bot owners:\n`user id:name`";
		for (let b in CONFIG.OWNER_DISCORD_IDS) if (CONFIG.OWNER_DISCORD_IDS.active) answer += "\n`" + b + ":" + CONFIG.OWNER_DISCORD_IDS[b].name + "`";
		return answer;
	}
}

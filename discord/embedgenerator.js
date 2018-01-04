"use strict";
const Discord = require("discord.js");
let ta = require("time-ago")();
const UTILS = new (require("../utils.js"))();
module.exports = class EmbedGenrator {
	constructor() { }
	test() {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Test");
		newEmbed.setDescription("description");
		return newEmbed;
	}
}

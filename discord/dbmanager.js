"use strict";
module.exports = class DBManager {//mongodb
	constructor(CONFIG) {

	}
	test() {
		let newEmbed = new Discord.RichEmbed();
		newEmbed.setTitle("Test");
		newEmbed.setDescription("description");
		return newEmbed;
	}
}

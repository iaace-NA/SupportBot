"use strict";
let UTILS = require("../utils/utils.js");
let MultiPoller = require("../utils/multipoller.js");
let sample_db = {};
for (let i = 0; i < 50; ++i) {
	sample_db[i + ""] = new Date().getTime() + UTILS.randomInt(1000, 60000);
}
let test_system = new MultiPoller("Test");
function updatesDue() {
	let ans = [];//{id: "", options: {}, order: 0}
	for (let i = 0; i < 50; ++i) {
		if (sample_db[i + ""] < UTILS.now()) ans.push({ id: i + "", options: {}, order: sample_db[i + ""] });
	}
	ans.sort((a, b) => a.order - b.order);
	return ans;
}
function checkForUpdates() {}
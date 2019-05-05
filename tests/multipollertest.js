"use strict";
let UTILS = require("../utils/utils.js");
let MultiPoller = require("../utils/multipoller.js");
let sample_db = {};
const sample_size = 15;
for (let i = 0; i < sample_size; ++i) {
	sample_db[i + ""] = UTILS.now() + UTILS.randomInt(1000, 60000);
}
printDB();
let test_system = new MultiPoller("Test", updatesDue, checkForUpdates, checkReadyForUpdate, justUpdated, () => {}, {
	min_queue_length: 0,
	max_queue_length: 100,
	slow_update_interval: 2000,
	fast_update_interval: 100,
	status_check_interval: 10000
});
function updatesDue() {
	return new Promise((resolve, reject) => {
		let ans = [];//{id: "", options: {}, order: 0}
		for (let i = 0; i < sample_size; ++i) {
			if (sample_db[i + ""] < UTILS.now()) ans.push({ id: i + "", options: {}, order: sample_db[i + ""] });
		}
		ans.sort((a, b) => a.order - b.order);
		resolve(ans);
	});
}
function checkForUpdates(id, options) {
	return new Promise((resolve, reject) => {
		const new_time = UTILS.now() + UTILS.randomInt(1000, 60000);
		UTILS.output("updating ID: " + id + ". age (ms): " + UTILS.now() - sample_db[id]);
		sample_db[id] = new_time;
		resolve(new_time);
	});
}
function checkReadyForUpdate(id) {
	return new Promise((resolve, reject) => {
		resolve(sample_db[i + ""] < UTILS.now());
	});
}
function justUpdated(id, results, error) {
	UTILS.output("ID: " + id + " was just updated with result: " + results + " . error: " + error);
	printDB();
}
function printDB() {
	sample_db[i + ""] = UTILS.now() + UTILS.randomInt(1000, 60000);
}

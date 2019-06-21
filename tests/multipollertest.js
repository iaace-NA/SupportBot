"use strict";
let UTILS = new (require("../utils/utils.js"))();
let MultiPoller = require("../utils/multipoller.js");
let sample_db = {};
const sample_size = 6000;
let stats = {
	uD: 0,
	cFU: 0,
	cRFU: 0,
	jU: 0,
	s: 0,
	totalUpdates: 0,
	updateAgeSum: 0
};
const MINUTE = 60000;
for (let i = 0; i < sample_size; ++i) {
	sample_db[i + ""] = UTILS.now() + UTILS.randomInt(-15 * MINUTE, 60 * MINUTE);
}
let test_system = new MultiPoller("Test", updatesDue, checkForUpdates, checkReadyForUpdate, justUpdated, stalled, {
	min_queue_length: 0,
	max_queue_length: sample_size / 6,
	slow_update_interval: 1200,
	fast_update_interval: 450,
	status_check_interval: 10000,
	soft_update_interval: 10
});
printDB();
//test_system.setUpdateIntervalSlow();
function updatesDue() {
	++stats.uD;
	return new Promise((resolve, reject) => {
		let ans = [];//{id: "", options: {}, order: 0}
		for (let i = 0; i < sample_size; ++i) {
			if (sample_db[i + ""] < UTILS.now()) ans.push({ id: i + "", options: {}, order: sample_db[i + ""] });
		}
		ans.sort((a, b) => a.order - b.order);
		//UTILS.output("updates ready:" + ans.length);
		resolve(ans);
	});
}
function checkForUpdates(id, options) {
	++stats.cFU;
	return new Promise((resolve, reject) => {
		let factor;
		const chance = Math.random() * 100;
		if (chance < .5) factor = 3 * MINUTE;
		else if (chance < 5) factor = 9 * MINUTE;
		else if (chance < 57) factor = 20 * MINUTE;
		else factor = 120 * MINUTE;
		const new_time = UTILS.now() + factor;
		const age = UTILS.now() - sample_db[id];
		stats.updateAgeSum += age;
		++stats.totalUpdates;
		UTILS.output("updating ID: " + id + ". age (ms): " + age);
		sample_db[id] = new_time;
		resolve(new_time);
	});
}
function checkReadyForUpdate(id) {
	++stats.cRFU;
	return new Promise((resolve, reject) => {
		const ans = sample_db[id + ""] < UTILS.now();
		//UTILS.output("checkReadyForUpdate result on id " + id + " was " + ans);
		resolve(ans);
	});
}
function justUpdated(id, results, error) {
	++stats.jU;
	return new Promise((resolve, reject) => {
		//UTILS.output("ID: " + id + " was just updated with result: " + results + " . error: " + error);
		printDB();
		resolve();
	});
}
function stalled() {
	++stats.s;
	console.error("Stalled");
}
function printDB() {
	let relative_copy = UTILS.copy(sample_db);
	for (let b in relative_copy) {
		relative_copy[b] = relative_copy[b] - UTILS.now();
	}
	UTILS.debug("sample_db: " + JSON.stringify(relative_copy, null, "\t"));
	UTILS.output("stats: " + JSON.stringify(stats));
	let sum = 0;
	const now = new Date().getTime();
	for (let b in sample_db) {
		sum += now - sample_db[b];
	}
	UTILS.output("updates ready: " + test_system.queueLength() + " avg age(min): " + ((sum / sample_size) / 60000).round(3) + "\n");
	UTILS.output("updating every: " + test_system.getUpdateInterval() + "ms");
}

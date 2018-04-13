"use strict";
const fs = require("fs");
let CONFIG;
try {
	CONFIG = JSON.parse(fs.readFileSync("../config.json", "utf-8"));
	CONFIG.VERSION = "v1.2.0b";//b for non-release (in development)
}
catch (e) {
	console.log("something's wrong with config.json");
	console.error(e);
	process.exit(1);
}

let path = require('path');
let crypto = require("crypto");
let https = require('https');
let http = require('http');
//const aes256 = require("aes256");
//let cipher = aes256.createCipher(fs.readFileSync("./aes256.key", "utf-8"));

const express = require("express");
const website = express();
const UTILS = new (require("../utils.js"))();
UTILS.assert(UTILS.exists(CONFIG.API_PORT_PRODUCTION));
UTILS.assert(UTILS.exists(CONFIG.API_PORT_DEVELOPMENT));
UTILS.output("Modules loaded.");
ready();
function ready() {
	if (process.argv.length === 2) {//production key
		UTILS.output("Ready and listening on port " + CONFIG.API_PORT_PRODUCTION);
		website.listen(CONFIG.API_PORT_PRODUCTION);
	}
	else {//non-production key
		UTILS.output("Ready and listening on port " + CONFIG.API_PORT_DEVELOPMENT);
		website.listen(CONFIG.API_PORT_DEVELOPMENT);
	}
	
	website.use(function (req, res, next) {
		res.removeHeader("X-Powered-By");
		return next();
	});
	//https.createServer({ key: fs.readFileSync("./privkey.pem"), cert: fs.readFileSync("./fullchain.pem") }, website).listen(443);
	serveWebRequest("/ping", function (req, res, next) {
		res.send(JSON.stringify({ received: new Date().getTime() }));
	});
	serveWebRequest("/", function (req, res, next) {
		res.send("You have reached the online api's testing page.");
	});
	serveWebRequest("*", function (req, res, next) {
		res.status(404).end();
	});
	function serveWebRequest(branch, callback) {
		if (typeof(branch) == "string") {
			website.get(branch, function (req, res, next) {
				UTILS.output("request served: " + req.originalUrl);
				callback(req, res, next);
			});
		}
		else {
			for (let b in branch) {
				website.get(branch[b], function(req, res, next){
					UTILS.output("request served: " + req.originalUrl);
					callback(req, res, next);
				});
			}
		}
	}
}
function exists(anyObject) {//general utility function
	if (anyObject != null && anyObject != undefined) {
		return true;
	}
	else {
		return false;
	}
}
function changeBaseTo62(number) {
	number = parseInt(number);//convert to string
	const dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let answer = "";
	while (number > 0) {
		answer = dictionary.substring(number % 62, (number % 62) + 1) + answer;
		number = (number - (number % 62)) / 62;
	}
	return answer;
}
function changeBaseTo55(number) {
	number = parseInt(number);//convert to string
	const dictionary = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
	let answer = "";
	while (number > 0) {
		answer = dictionary.substring(number % 55, (number % 55) + 1) + answer;
		number = (number - (number % 55)) / 55;
	}
	return answer;
}
function assert(value) {
	if (value !== true) {
		throw new Error("Assertion failed");
	}
}
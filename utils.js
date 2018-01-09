"use strict";
module.exports = class UTILS {
	output(t) {//general utility function
		if (this.exists(t)) {
			let d = new Date();
			let n = d.toUTCString();
			console.log(n + " : " + t);
		}
	}
	exists(anyObject) {//general utility function
		if (anyObject != null && anyObject != undefined) return true;
		else return false;
	}
	numberWithCommas(x) {//general utility function
		if (this.exists(x)) {
			let parts = x.toString().split(".");
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			return parts.join(".");
		}
		else return "";
	}
	round(num, decimal) {
		return Math.round(num * Math.pow(10, decimal)) / Math.pow(10, decimal);
	}
	assert(condition) {
		if (typeof (condition) != "boolean") throw new Error("asserting non boolean value: " + typeof(condition));
		if (!condition) throw new Error("assertion false");
		return true;
	}
}
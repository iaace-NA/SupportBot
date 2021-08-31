"use strict";
let JSON5 = require("json5");
let fs = require("fs");
const lanes = JSON5.parse(fs.readFileSync("../data/lanes.json5"));
for (let b in lanes) {
    const sum = lanes[b][0] + lanes[b][1] + lanes[b][2] + lanes[b][3] + lanes[b][4];
    if (sum !== 100) {
        console.error(`ERROR: id ${b} sum is ${sum}`);
    }
}
#!/usr/bin/env node
var name = process.argv[2];
var exec = require('child_process').exec;

var child = exec('tsc', function(err, stdout, stderr) {
    require("../dist/src/index")
});

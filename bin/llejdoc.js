#!/usr/bin/env node
var name = process.argv[2];
var exec = require("child_process").exec;

console.log("开始运行");

//没有传入命令的时候才编译代码
if (name === undefined) {
  var child = exec("tsc", function(err, stdout, stderr) {
    console.log("编译代码完毕");
    require("../dist/src/index");
  });
} else {
  require("../dist/src/index");
}

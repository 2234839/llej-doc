#!/usr/bin/env node
var exec = require("child_process").exec;

//传入 update 才编译自身
if (process.env.update) {
  console.log("开始编译自身");

  var child = exec("tsc", function (err, stdout, stderr) {
    console.log("编译代码完毕");
    require("../dist/src/index");
  });
} else {
  require("../dist/src/index");
}

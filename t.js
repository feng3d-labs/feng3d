// console.log(1);

// var oldlog = console.log;
// console.log = function () {
//     debugger;
//     oldlog.apply(this, arguments);
// }

// console.warn("1");

// var debuggerPre = () => { console.log("pre") };
// var debuggerNext = () => { console.log("next") };
// wrapFunction(console, "warn", debuggerPre, debuggerNext);

// function wrapFunction(space, funcName, pf, nf) {
//     var oldlog = space[funcName];
//     space[funcName] = function () {
//         pf && (pf)(this, arguments);
//         oldlog.apply(this, arguments);
//         nf && (nf)(this, arguments);
//     }
// }


// console.warn(2);

// var fw = require("./packages/functionwarp/out/index");
// fw
// console.log(fw);

// var map = new Map();

// map.set("a", 1);
// map.set({ "a": 1 }, 2);
// map.set(2, 10);

// var ks = map.keys();
// console.log(ks);
var build = require("@feng3d/build");
var shaderpack = require("@feng3d/shaderpack");
var path = require("path");

shaderpack.shaderPack(__dirname);

/**
 * Watch for changes in TypeScript
 */
build.watchProject({ path: __dirname, moduleName: "feng3d", globalModule: "feng3d", });
build.watchProject({ path: path.resolve(__dirname, "tests"), moduleName: "tests", globalModule: "tests", });
var build = require("@feng3d/build");
var shaderpack = require("@feng3d/shaderpack");

shaderpack.shaderPack(__dirname);

/**
 * Watch for changes in TypeScript
 */
build.watchProject({ path: __dirname, moduleName: "feng3d", globalModule: "feng3d", });
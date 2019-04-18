var build = require("./tools/build/out/index");

var fs = require("fs");
var path = require("path");


var toolsPath = path.join(__dirname, "tools");
var tools = fs.readdirSync(toolsPath);
var toolsProject = tools.map(v => { return { path: path.join(toolsPath, v) } });

var projectPaths = toolsProject.concat({
    path: __dirname,
    moduleName: "feng3d",
    globalModule: "feng3d",
});

/**
 * Watch for changes in TypeScript
 */
build.watchProject(projectPaths);
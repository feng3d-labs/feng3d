var build = require("./tools/build/out/index");

var fs = require("fs");
var path = require("path");


var packagesPath = path.join(__dirname, "packages");
var packages = fs.readdirSync(packagesPath);
var packagesProject = packages.map(v => { return { path: path.join(packagesPath, v), moduleName: `@feng3d/${v}`, globalModule: "feng3d" } });

var toolsPath = path.join(__dirname, "tools");
var tools = fs.readdirSync(toolsPath);
var toolsProject = tools.map(v => { return { path: path.join(toolsPath, v) } });

var projectPaths = packagesProject.concat(toolsProject).concat({ path: path.join(__dirname, "bundles/feng3d"), moduleName: `feng3d`, globalModule: "feng3d" });

/**
 * Watch for changes in TypeScript
 */
build.watchProject(projectPaths);
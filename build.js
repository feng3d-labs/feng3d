var build = require("./tools/build/out/index");

var fs = require("fs");
var path = require("path");


var packagesPath = path.join(__dirname, "packages");
var packages = fs.readdirSync(packagesPath);
var packagesProject = packages.map(v => { return { path: path.join(packagesPath, v), moduleName: `@feng3d/${v}`, globalModule: "feng3d" } });

var toolsPath = path.join(__dirname, "tools");
var tools = fs.readdirSync(toolsPath);
var toolsProject = tools.map(v => { return { path: path.join(toolsPath, v) } });

var bundlesPath = path.join(__dirname, "bundles");
var bundles = fs.readdirSync(bundlesPath);
var bundlesProject = bundles.map(v => { return { path: path.join(bundlesPath, v), moduleName: `feng3d`, globalModule: "feng3d" } });

var projectPaths = packagesProject.concat(toolsProject).concat(bundlesProject);

/**
 * Watch for changes in TypeScript
 */
build.watchProject(projectPaths);
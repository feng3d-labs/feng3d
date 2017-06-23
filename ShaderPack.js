var fs = require("fs");
const util = require("util");

console.log(`监控shader变化，自动生成shaders.ts`);
fs.watch("./shaders", changeHandler);

function changeHandler(event, filename) {
    try {
        var savePath = "src/autofiles/shaders.ts";
        var filesContent = readFiles(getFilePaths("shaders"));
        var contentStr = JSON.stringify(filesContent, null, '\t');
        contentStr = contentStr.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
        writeFile(savePath, `namespace feng3d\n{\nfeng3d.shaderFileMap = ${contentStr}\n}`);
        console.log("自动生成" + savePath)
    } catch (error) {
        console.log("error!!!!!\n" + error);
    }
};

function writeFile(filePath, content) {
    fs.openSync(filePath, "w");
    fs.writeFileSync(filePath, content);
}

function readFile(filePath) {
    fs.openSync(filePath, "r");
    var result = fs.readFileSync(filePath, 'utf8');
    return result;
}

function readFiles(filePaths) {
    var result = {};
    filePaths.forEach(function (element) {
        result[element] = readFile(element);
    }, this);
    return result;
}

function getFilePaths(rootPath, filePaths) {

    filePaths = filePaths || [];
    var stats = fs.statSync(rootPath);
    if (stats.isFile()) {
        filePaths.push(rootPath);
    } else if (stats.isDirectory) {
        var childPaths = fs.readdirSync(rootPath);
        for (var i = 0; i < childPaths.length; i++) {
            getFilePaths(rootPath + "/" + childPaths[i], filePaths);
        }
    }
    return filePaths;
}
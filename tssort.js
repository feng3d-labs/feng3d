var fs = require("fs");

var tsconfig = readTsConfig(readFile("tsconfig.json"));
console.log(tsconfig);

var filesContent = readFiles(getFilePaths("src"));

filesContent


function writeFile(filePath, content)
{
    fs.openSync(filePath, "w");
    fs.writeFileSync(filePath, content);
}

function readFile(filePath)
{
    fs.openSync(filePath, "r");
    var result = fs.readFileSync(filePath, 'utf8');
    return result;
}

function readTsConfig(tsconfigStr)
{
    var tsconfig;
    eval("tsconfig=" + tsconfigStr);
    return tsconfig;
}


function readFiles(filePaths)
{
    var result = {};
    filePaths.forEach(function (element)
    {
        result[element] = readFile(element);
    }, this);
    return result;
}

function getFilePaths(rootPath, filePaths)
{

    filePaths = filePaths || [];
    var stats = fs.statSync(rootPath);
    if (stats.isFile())
    {
        filePaths.push(rootPath);
    } else if (stats.isDirectory)
    {
        var childPaths = fs.readdirSync(rootPath);
        for (var i = 0; i < childPaths.length; i++)
        {
            getFilePaths(rootPath + "/" + childPaths[i], filePaths);
        }
    }
    return filePaths;
}
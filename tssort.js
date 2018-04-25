var fs = require("fs");

var reg = /export\s+(abstract\s+)?class\s+([\w$_\d]+)(\s+extends\s+([\w$_\d]+))?/;

var tsconfig = readTsConfig(readFile("tsconfig.json"));
// console.log(tsconfig);

var filesContent = readFiles(getFilePaths("src"));

var filelist = [{ path: "", class: [""], extends: [""] }];
filelist.length = 0;

//替换路径
filesContent = ((files) => {
    var newobj = {};
    for (var path in files) {
        if (files.hasOwnProperty(path)) {
            var content = files[path];
            var result = content.match(reg);
            //目前只处理了ts文件中单个导出对象
            var item = { path: path, class: [], extends: [] }
            if (result) {
                item.class.push(result[2]);
                if (result[4])
                    item.extends.push(result[4]);
            }
            filelist.push(item);
        }
    }
    return newobj;
})(filesContent);

//安装字母排序
filelist.sort((a, b) => {
    if (a.class.length != b.class.length)
        return a.class.length - b.class.length;
    return a.path - b.path;
})

//按继承排序
for (let i = 0; i < filelist.length; i++) {
    var item = filelist[i];
    var newpos = i;
    if (item.extends.length > 0) {
        for (let j = 0; j < item.extends.length; j++) {
            var extendsclass = item.extends[j];
            for (let k = i + 1; k < filelist.length; k++) {
                var itemk = filelist[k];
                if (itemk.class.indexOf(extendsclass) != -1 && newpos < k) {
                    newpos = k;
                }
            }
        }
    }
    if (newpos > i) {
        filelist[i] = null;
        filelist.splice(newpos + 1, 0, item);
    }
}

var filePaths = [""];
filePaths.length = 0;

for (let i = 0; i < filelist.length; i++) {
    const element = filelist[i];
    if (element)
        filePaths.push(element.path);
}

tsconfig.files = filePaths;
var str = JSON.stringify(tsconfig, null, '\t').replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
                    
writeFile("tsconfig.json",str)

filePaths;

console.log(filePaths);

filelist

function writeFile(filePath, content) {
    fs.openSync(filePath, "w");
    fs.writeFileSync(filePath, content);
}

function readFile(filePath) {
    fs.openSync(filePath, "r");
    var result = fs.readFileSync(filePath, 'utf8');
    return result;
}

function readTsConfig(tsconfigStr) {
    var tsconfig;
    eval("tsconfig=" + tsconfigStr);
    return tsconfig;
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
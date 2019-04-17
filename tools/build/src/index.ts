import * as fs from "fs";
import * as process from "child_process";

export function watchProject(project: { path: string, moduleName: string, globalModule: string })
{
    if (Array.isArray(project))
    {
        for (var i = 0; i < project.length; i++)
        {
            watchProject(project[i]);
        }
        return;
    }

    var childProcess = process.exec('tsc -w -p ' + project.path, function (error, stdout, stderr)
    {
        if (error !== null)
        {
            console.log('exec error: ' + error);
        }
        console.log(stdout)
        console.log(stderr)
    });
    childProcess.stdout.on('data', function (data)
    {
        data = data.trim();
        if (data.length > 10) console.log(data);
        if (data.indexOf("Compilation complete") != -1 || data.indexOf("Watching for file changes") != -1)
        {
            //在编译完成后处理 模块导出
            var tsconfig = readFileObject(project.path + "/tsconfig.json");
            var outjsFilePath = tsconfig.compilerOptions.outFile;
            if (outjsFilePath !== undefined)
            {
                //添加 js 文件的模块导出代码
                outjsFilePath = project.path + "/" + outjsFilePath;
                if (fs.existsSync(outjsFilePath))
                {
                    var outjsStr = readFile(outjsFilePath)
                    // 添加版本号输出
                    var packageObj = readFileObject(project.path + "/package.json");
                    if (packageObj && packageObj.name && packageObj.version)
                        outjsStr += `\nconsole.log("${packageObj.name}-${packageObj.version}");`;
                    //
                    var universalModuleDefinitionStr = getUniversalModuleDefinition(project.moduleName, project.globalModule);
                    outjsStr = outjsStr.replace(universalModuleDefinitionStr, "");
                    outjsStr += universalModuleDefinitionStr;
                    writeFile(outjsFilePath, outjsStr);
                }
                //添加 d.ts 文件的模块导出代码
                var outdtsFilePath = ((path) =>
                {
                    var paths = path.split(".");
                    paths.pop();
                    paths.push("d", "ts");
                    return paths.join(".");
                })(outjsFilePath);
                if (fs.existsSync(outdtsFilePath))
                {
                    //计算 module.d.ts 路径
                    var moduledtsPath = outdtsFilePath;
                    // var moduledtsPath = ((path) =>
                    // {
                    //     var paths = path.split(".");
                    //     paths.splice(-2, 0, "module");
                    //     return paths.join(".");
                    // })(outdtsFilePath);

                    var declaremodulestr = getdeclaremodule(project.moduleName);
                    var outdtsStr = readFile(outdtsFilePath);
                    outdtsStr = outdtsStr.replace(declaremodulestr, "");
                    declaremodulestr += outdtsStr;
                    writeFile(moduledtsPath, declaremodulestr);
                }
            }
        }
    });
    childProcess.stderr.on('data', function (data)
    {
        data = data.trim();
        console.error(data);
    });
}

function getdeclaremodule(moduleName)
{
    return `declare module '${moduleName}' {
    export = feng3d;
}
`;
}

function getUniversalModuleDefinition(moduleName, globalModule)
{
    return `
(function universalModuleDefinition(root, factory)
{
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["${moduleName}"] = factory();
    else
        root["${moduleName}"] = factory();
    ${globalModule && `
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    globalObject["${globalModule || "feng3d"}"] = factory();`}
})(this, function ()
{
    return feng3d;
});
`
}

function writeFile(filePath, content)
{
    fs.openSync(filePath, "w");
    fs.writeFileSync(filePath, content);
}

function readFile(filePath: string)
{
    fs.openSync(filePath, "r");
    var result = fs.readFileSync(filePath, 'utf8');
    return result;
}

function readFileObject(path: string)
{
    var tsconfigStr = readFile(path);
    var tsconfig;
    eval("tsconfig=" + tsconfigStr);
    return tsconfig;
}
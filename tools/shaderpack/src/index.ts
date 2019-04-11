var fs = require("fs");

export function shaderPack(root: string)
{
    console.log(`监控shader变化，自动生成shaders.ts`);
    fs.watch(root + "/shaders", { recursive: true }, changeHandler);

    //用于控制连续修改只执行一次打包
    var count = 0;

    function changeHandler(event, filename)
    {
        count++;
        setTimeout(function ()
        {
            count--;
            if (count == 0)
                pack();
        }, 1000);

        function pack()
        {
            console.log(filename + " 发生变化")
            try
            {
                var savePath = root + "/" + "src/autofiles/ShaderConfig.ts";
                var shaders = readFiles(getFilePaths(root + "/" + "shaders", null, 1));
                var shadermodules = readFiles(getFilePaths(root + "/" + "shaders/modules", null, 1));

                //
                var shaderObj = { shaders: {}, modules: {} };
                for (const key in shaders)
                {
                    if (shaders.hasOwnProperty(key))
                    {
                        const element = shaders[key];
                        var reg = /shaders\/([\w\d]+)\.(vertex|fragment)\.glsl/;
                        var result = reg.exec(key);
                        if (result)
                        {
                            var shaderName = result[1];
                            var shaderType = result[2];
                            shaderObj.shaders[shaderName] = shaderObj.shaders[shaderName] || {};
                            shaderObj.shaders[shaderName][shaderType] = element;
                        }
                    }
                }
                for (const key in shadermodules)
                {
                    if (shadermodules.hasOwnProperty(key))
                    {
                        const element = shadermodules[key];
                        var reg = /shaders\/modules\/([\w\d\.]+)\.glsl/;
                        var result = reg.exec(key);
                        if (result)
                        {
                            var shaderName = result[1];
                            shaderObj.modules[shaderName] = element;
                        }
                    }
                }
                var contentStr = JSON.stringify(shaderObj, null, '\t').replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1')
                writeFile(savePath, `namespace feng3d\n{\nfeng3d.shaderConfig = ${contentStr}\n}`);
                console.log("自动生成" + savePath)
            } catch (error)
            {
                console.log("error!!!!!\n" + error);
            }
        }
    };
}

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

function readFiles(filePaths)
{
    var result = {};
    filePaths.forEach(function (element)
    {
        result[element] = readFile(element);
    }, this);
    return result;
}

function getFilePaths(rootPath, filePaths, depth)
{
    if (depth == undefined) depth = 10000;
    if (depth < 0) return;
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
            getFilePaths(rootPath + "/" + childPaths[i], filePaths, depth - 1);
        }
    }
    return filePaths;
}
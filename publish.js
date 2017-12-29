var co = require('co');
var OSS = require('ali-oss');
var client = new OSS({
    region: 'oss-cn-shanghai',
    //云账号AccessKey有所有API访问权限，建议遵循阿里云安全最佳实践，部署在服务端使用RAM子账号或STS，部署在客户端使用STS。
    accessKeyId: 'LTAICJ2Udvl7blNs',
    accessKeySecret: 'rfCdOJr0LIxNfQeOe6LZ680rMsU5hb',
    bucket: 'feng3deditor'
});

co(function* ()
{
    // var result = yield client.get('object-key', 'local-file');
    var result = yield client.get('feng3d.js', 'D:/feng/workspace/ts/feng3d/feng3d-workspace/examples/libs/feng3d_1.js');
    console.log(result);
}).catch(function (err)
{
    console.log(err);
});

co(function* ()
{
    // 不带任何参数，默认最多返回1000个文件
    var result = yield client.list();
    console.log(result);
    // 根据nextMarker继续列出文件
    if (result.isTruncated)
    {
        var result = yield client.list({
            marker: result.nextMarker
        });
    }
    // 列出前缀为'my-'的文件
    var result = yield client.list({
        prefix: 'my-'
    });
    console.log(result);
    // 列出前缀为'my-'且在'my-object'之后的文件
    var result = yield client.list({
        prefix: 'my-',
        marker: 'my-object'
    });
    console.log(result);
}).catch(function (err)
{
    console.log(err);
});
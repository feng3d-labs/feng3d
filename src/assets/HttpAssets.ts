namespace feng3d
{
    export var httpAssets: HttpAssets;

    export class HttpAssets implements ReadFS
    {
        get type()
        {
            return FSType.http;
        }

        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void)
        {
            var request = new XMLHttpRequest();
            request.open('Get', path, true);
            request.responseType = "arraybuffer";
            request.onreadystatechange = (ev) =>
            {
                if (request.readyState == 4)
                {// 4 = "loaded"

                    request.onreadystatechange = <any>null;

                    if (request.status >= 200 && request.status < 300)
                    {
                        callback(null, request.response);
                    } else
                    {
                        callback(new Error(path + " 加载失败！"), null);
                    }
                }
            }
            request.onprogress = (ev) =>
            {

            };
            request.send();
        }
    }

    httpAssets = new HttpAssets();
}
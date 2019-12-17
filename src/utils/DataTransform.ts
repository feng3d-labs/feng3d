/**
 * The unescape() function computes a new string in which hexadecimal escape sequences are replaced with the character that it represents. The escape sequences might be introduced by a function like escape. Usually, decodeURI or decodeURIComponent are preferred over unescape.
 * @param str A string to be decoded.
 * @return A new string in which certain characters have been unescaped.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/unescape
 */
declare function unescape(str: string): string;

/**
 * The escape() function computes a new string in which certain characters have been replaced by a hexadecimal escape sequence.
 * @param str A string to be encoded.
 * @return A new string in which certain characters have been escaped.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/escape
 */
declare function escape(str: string): string;

namespace feng3d
{
    /**
     * 数据类型转换
     * TypeArray、ArrayBuffer、Blob、File、DataURL、canvas的相互转换
     * @see http://blog.csdn.net/yinwhm12/article/details/73482904
     */
    export var dataTransform: DataTransform;

    /**
     * 数据类型转换
     * TypeArray、ArrayBuffer、Blob、File、DataURL、canvas的相互转换
     * @see http://blog.csdn.net/yinwhm12/article/details/73482904
     */
    export class DataTransform
    {
        /**
         * Blob to ArrayBuffer
         */
        blobToArrayBuffer(blob: Blob, callback: (arrayBuffer: ArrayBuffer) => void)
        {
            var reader = new FileReader();
            reader.onload = function (e)
            {
                callback(<any>e.target["result"]);
            };
            reader.readAsArrayBuffer(blob);
        }

        /**
         * ArrayBuffer to Blob
         */
        arrayBufferToBlob(arrayBuffer: ArrayBuffer)
        {
            var blob = new Blob([arrayBuffer]);       // 注意必须包裹[]
            return blob;
        }

        /**
         * ArrayBuffer to Uint8
         * Uint8数组可以直观的看到ArrayBuffer中每个字节（1字节 == 8位）的值。一般我们要将ArrayBuffer转成Uint类型数组后才能对其中的字节进行存取操作。
         */
        arrayBufferToUint8(arrayBuffer: ArrayBuffer)
        {
            var u8 = new Uint8Array(arrayBuffer);
            return u8;
        }

        /**
         * Uint8 to ArrayBuffer
         * 我们Uint8数组可以直观的看到ArrayBuffer中每个字节（1字节 == 8位）的值。一般我们要将ArrayBuffer转成Uint类型数组后才能对其中的字节进行存取操作。
         */
        uint8ToArrayBuffer(uint8Array: Uint8Array)
        {
            var buffer = <ArrayBuffer>uint8Array.buffer;
            return buffer;
        }

        /**
         * Array to ArrayBuffer
         * @param array 例如：[0x15, 0xFF, 0x01, 0x00, 0x34, 0xAB, 0x11];
         */
        arrayToArrayBuffer(array: number[])
        {
            var uint8 = new Uint8Array(array);
            var buffer = <ArrayBuffer>uint8.buffer;
            return buffer;
        }

        /**
         * TypeArray to Array
         */
        uint8ArrayToArray(u8a: Uint8Array)
        {
            var arr: number[] = [];
            for (var i = 0; i < u8a.length; i++)
            {
                arr.push(u8a[i]);
            }
            return arr;
        }

        /**
         * canvas转换为dataURL
         */
        canvasToDataURL(canvas: HTMLCanvasElement, type: "png" | "jpeg" = "png", quality = 1)
        {
            if (type == "png") return canvas.toDataURL("image/png");
            return canvas.toDataURL("image/jpeg", quality);
        }

        /**
         * canvas转换为图片
         */
        canvasToImage(canvas: HTMLCanvasElement, type: "png" | "jpeg" = "png", quality = 1, callback: (img: HTMLImageElement) => void)
        {
            var dataURL = this.canvasToDataURL(canvas, type, quality);
            this.dataURLToImage(dataURL, callback);
        }

        /**
         * File、Blob对象转换为dataURL
         * File对象也是一个Blob对象，二者的处理相同。
         */
        blobToDataURL(blob: Blob, callback: (dataurl: string) => void)
        {
            var a = new FileReader();
            a.onload = function (e)
            {
                callback(<any>e.target["result"]);
            };
            a.readAsDataURL(blob);
        }

        /**
         * dataURL转换为Blob对象
         */
        dataURLtoBlob(dataurl: string)
        {
            var arr = dataurl.split(","), mime = (<any>arr[0].match(/:(.*?);/))[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while (n--)
            {
                u8arr[n] = bstr.charCodeAt(n);
            }
            var blob = new Blob([u8arr], { type: mime });
            return blob;
        }

        /**
         * dataURL图片数据转换为HTMLImageElement
         * dataURL图片数据绘制到canvas
         * 先构造Image对象，src为dataURL，图片onload之后绘制到canvas
         */
        dataURLDrawCanvas(dataurl: string, canvas: HTMLCanvasElement, callback: (img: HTMLImageElement) => void)
        {
            this.dataURLToImage(dataurl, (img) =>
            {
                // canvas.drawImage(img);
                callback(img);
            });
        }

        dataURLToArrayBuffer(dataurl: string, callback: (arraybuffer: ArrayBuffer) => void)
        {
            var blob = this.dataURLtoBlob(dataurl);
            this.blobToArrayBuffer(blob, callback)
        }

        arrayBufferToDataURL(arrayBuffer: ArrayBuffer, callback: (dataurl: string) => void)
        {
            var blob = this.arrayBufferToBlob(arrayBuffer);
            this.blobToDataURL(blob, callback);
        }

        dataURLToImage(dataurl: string, callback: (img: HTMLImageElement) => void)
        {
            var img = new Image();
            img.onload = function ()
            {
                callback(img);
            };
            img.src = dataurl;
        }

        imageToDataURL(img: HTMLImageElement, quality = 1)
        {
            var canvas = this.imageToCanvas(img);
            var dataurl = this.canvasToDataURL(canvas, "png", quality);
            return dataurl;
        }

        imageToCanvas(img: HTMLImageElement)
        {
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctxt = canvas.getContext('2d');
            ctxt.drawImage(img, 0, 0);
            return canvas;
        }

        imageToArrayBuffer(img: HTMLImageElement, callback: (arraybuffer: ArrayBuffer) => void)
        {
            if (img["arraybuffer"])
            {
                callback(img["arraybuffer"]);
                return;
            }
            var dataUrl = this.imageToDataURL(img);
            this.dataURLToArrayBuffer(dataUrl, arraybuffer =>
            {
                img["arraybuffer"] = arraybuffer;
                arraybuffer["img"] = img;
                callback(arraybuffer);
            });
        }

        imageDataToDataURL(imageData: ImageData, quality = 1)
        {
            var canvas = this.imageDataToCanvas(imageData);
            var dataurl = this.canvasToDataURL(canvas, "png", quality);
            return dataurl;
        }

        imageDataToCanvas(imageData: ImageData)
        {
            var canvas = document.createElement("canvas");
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            var ctxt = canvas.getContext('2d');
            ctxt.putImageData(imageData, 0, 0);
            return canvas;
        }

        imagedataToImage(imageData: ImageData, quality = 1, callback: (img: HTMLImageElement) => void)
        {
            var dataUrl = this.imageDataToDataURL(imageData, quality);
            this.dataURLToImage(dataUrl, callback);
        }

        arrayBufferToImage(arrayBuffer: ArrayBuffer, callback: (img: HTMLImageElement) => void)
        {
            if (arrayBuffer["image"])
            {
                callback(arrayBuffer["image"]);
                return;
            }

            this.arrayBufferToDataURL(arrayBuffer, (dataurl) =>
            {
                this.dataURLToImage(dataurl, img =>
                {
                    img["arraybuffer"] = arrayBuffer;
                    arrayBuffer["image"] = img;
                    callback(img);
                });
            });
        }

        blobToText(blob: Blob, callback: (content: string) => void)
        {
            var a = new FileReader();
            a.onload = function (e) { callback(<any>e.target["result"]); };
            a.readAsText(blob);
        }

        stringToArrayBuffer(str: string)
        {
            var uint8Array = this.stringToUint8Array(str);
            var buffer = this.uint8ToArrayBuffer(uint8Array);
            return buffer
        }

        arrayBufferToString(arrayBuffer: ArrayBuffer, callback: (content: string) => void)
        {
            var blob = this.arrayBufferToBlob(arrayBuffer);
            this.blobToText(blob, callback);
        }

        /**
         * ArrayBuffer 转换为 对象
         * 
         * @param arrayBuffer 
         * @param callback 
         */
        arrayBufferToObject(arrayBuffer: ArrayBuffer, callback: (object: Object) => void)
        {
            this.arrayBufferToString(arrayBuffer, (str) =>
            {
                var obj = JSON.parse(str);
                callback(obj);
            });
        }

        stringToUint8Array(str: string)
        {
            var utf8 = unescape(encodeURIComponent(str));
            var uint8Array = new Uint8Array(utf8.split('').map(function (item)
            {
                return item.charCodeAt(0);
            }));
            return uint8Array;
        }

        uint8ArrayToString(arr: Uint8Array, callback: (str: string) => void)
        {
            // or [].slice.apply(arr)
            // var utf8 = Array.from(arr).map(function (item)
            var utf8 = [].slice.apply(arr).map(function (item)
            {
                return String.fromCharCode(item);
            }).join('');

            var str = decodeURIComponent(escape(utf8));
            callback(str);
        }
    }
    dataTransform = new DataTransform();
}
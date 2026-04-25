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
    async blobToArrayBuffer(blob: Blob)
    {
        const arrayBuffer: ArrayBuffer = await new Promise((resolve) =>
        {
            const reader = new FileReader();
            reader.onload = function (e)
            {
                resolve(e.target.result as ArrayBuffer);
            };
            reader.readAsArrayBuffer(blob);
        });

        return arrayBuffer;
    }

    /**
     * ArrayBuffer to Blob
     */
    arrayBufferToBlob(arrayBuffer: ArrayBuffer)
    {
        const blob = new Blob([arrayBuffer]); // 注意必须包裹[]

        return blob;
    }

    /**
     * ArrayBuffer to Uint8
     * Uint8数组可以直观的看到ArrayBuffer中每个字节（1字节 === 8位）的值。一般我们要将ArrayBuffer转成Uint类型数组后才能对其中的字节进行存取操作。
     */
    arrayBufferToUint8(arrayBuffer: ArrayBuffer)
    {
        const u8 = new Uint8Array(arrayBuffer);

        return u8;
    }

    /**
     * Uint8 to ArrayBuffer
     * 我们Uint8数组可以直观的看到ArrayBuffer中每个字节（1字节 === 8位）的值。一般我们要将ArrayBuffer转成Uint类型数组后才能对其中的字节进行存取操作。
     */
    uint8ToArrayBuffer(uint8Array: Uint8Array)
    {
        const buffer = uint8Array.buffer as ArrayBuffer;

        return buffer;
    }

    /**
     * Array to ArrayBuffer
     * @param array 例如：[0x15, 0xFF, 0x01, 0x00, 0x34, 0xAB, 0x11];
     */
    arrayToArrayBuffer(array: number[])
    {
        const uint8 = new Uint8Array(array);
        const buffer = uint8.buffer as ArrayBuffer;

        return buffer;
    }

    /**
     * TypeArray to Array
     */
    uint8ArrayToArray(u8a: Uint8Array)
    {
        const arr: number[] = [];
        for (let i = 0; i < u8a.length; i++)
        {
            arr.push(u8a[i]);
        }

        return arr;
    }

    /**
     * canvas转换为dataURL
     */
    canvasToDataURL(canvas: HTMLCanvasElement, type: 'png' | 'jpeg' = 'png', quality = 1)
    {
        if (type === 'png') return canvas.toDataURL('image/png');

        return canvas.toDataURL('image/jpeg', quality);
    }

    /**
     * canvas转换为图片
     */
    async canvasToImage(canvas: HTMLCanvasElement, type: 'png' | 'jpeg' = 'png', quality = 1)
    {
        const dataURL = this.canvasToDataURL(canvas, type, quality);
        const img = await this.dataURLToImage(dataURL);

        return img;
    }

    /**
     * File、Blob对象转换为dataURL
     * File对象也是一个Blob对象，二者的处理相同。
     */
    async blobToDataURL(blob: Blob)
    {
        const dataURL: string = await new Promise((resolve) =>
        {
            const a = new FileReader();
            a.onload = function (e)
            {
                resolve(e.target.result as any);
            };
            a.readAsDataURL(blob);
        });

        return dataURL;
    }

    /**
     * dataURL转换为Blob对象
     */
    dataURLtoBlob(dataurl: string)
    {
        const arr = dataurl.split(','); const mime = (arr[0].match(/:(.*?);/))[1];
        const bstr = atob(arr[1]); let n = bstr.length; const
            u8arr = new Uint8Array(n);
        while (n--)
        {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });

        return blob;
    }

    async dataURLToArrayBuffer(dataurl: string)
    {
        const blob = this.dataURLtoBlob(dataurl);
        const arrayBuffer = await this.blobToArrayBuffer(blob);

        return arrayBuffer;
    }

    async arrayBufferToDataURL(arrayBuffer: ArrayBuffer)
    {
        const blob = this.arrayBufferToBlob(arrayBuffer);
        const dataURL = await this.blobToDataURL(blob);

        return dataURL;
    }

    async dataURLToImage(dataurl: string)
    {
        const img: HTMLImageElement = await new Promise((resolve) =>
        {
            const img = new Image();
            img.onload = function ()
            {
                resolve(img);
            };
            img.src = dataurl;
        });

        return img;
    }

    imageToDataURL(img: HTMLImageElement, quality = 1)
    {
        const canvas = this.imageToCanvas(img);
        const dataurl = this.canvasToDataURL(canvas, 'png', quality);

        return dataurl;
    }

    imageToCanvas(img: HTMLImageElement)
    {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctxt = canvas.getContext('2d');
        ctxt.drawImage(img, 0, 0);

        return canvas;
    }

    async imageToArrayBuffer(img: HTMLImageElement)
    {
        if (img.arraybuffer)
        {
            return img.arraybuffer;
        }
        const dataUrl = this.imageToDataURL(img);
        const arraybuffer = await this.dataURLToArrayBuffer(dataUrl);
        img.arraybuffer = arraybuffer;
        arraybuffer.image = img;

        return arraybuffer;
    }

    imageDataToDataURL(imageData: ImageData, quality = 1)
    {
        const canvas = this.imageDataToCanvas(imageData);
        const dataurl = this.canvasToDataURL(canvas, 'png', quality);

        return dataurl;
    }

    imageDataToCanvas(imageData: ImageData)
    {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctxt = canvas.getContext('2d');
        ctxt.putImageData(imageData, 0, 0);

        return canvas;
    }

    async imagedataToImage(imageData: ImageData, quality = 1)
    {
        const dataUrl = this.imageDataToDataURL(imageData, quality);
        const img = await this.dataURLToImage(dataUrl);

        return img;
    }

    async arrayBufferToImage(arrayBuffer: ArrayBuffer)
    {
        if (arrayBuffer.image)
        {
            return arrayBuffer.image;
        }

        const dataurl = await this.arrayBufferToDataURL(arrayBuffer);
        const img = await this.dataURLToImage(dataurl);
        img.arraybuffer = arrayBuffer;
        arrayBuffer.image = img;

        return img;
    }

    async blobToText(blob: Blob)
    {
        const content: string = await new Promise((resolve) =>
        {
            const a = new FileReader();
            a.onload = function (e) { resolve(e.target.result as any); };
            a.readAsText(blob);
        });

        return content;
    }

    stringToArrayBuffer(str: string)
    {
        const uint8Array = this.stringToUint8Array(str);
        const buffer = this.uint8ToArrayBuffer(uint8Array);

        return buffer;
    }

    async arrayBufferToString(arrayBuffer: ArrayBuffer)
    {
        const blob = this.arrayBufferToBlob(arrayBuffer);
        const content = await this.blobToText(blob);

        return content;
    }

    /**
     * ArrayBuffer 转换为 对象
     *
     * @param arrayBuffer
     */
    async arrayBufferToObject(arrayBuffer: ArrayBuffer)
    {
        const str = await this.arrayBufferToString(arrayBuffer);
        const obj = JSON.parse(str);

        return obj;
    }

    stringToUint8Array(str: string)
    {
        const utf8 = unescape(encodeURIComponent(str));
        const uint8Array = new Uint8Array(utf8.split('').map(function (item)
        {
            return item.charCodeAt(0);
        }));

        return uint8Array;
    }

    uint8ArrayToString(arr: Uint8Array)
    {
        // or [].slice.apply(arr)
        // var utf8 = Array.from(arr).map(function (item)
        const utf8 = [].slice.apply(arr).map(function (item)
        {
            return String.fromCharCode(item);
        }).join('');

        const str = decodeURIComponent(escape(utf8));

        return str;
    }
}

/**
 * 数据类型转换
 * TypeArray、ArrayBuffer、Blob、File、DataURL、canvas的相互转换
 * @see http://blog.csdn.net/yinwhm12/article/details/73482904
 */
export const dataTransform = new DataTransform();

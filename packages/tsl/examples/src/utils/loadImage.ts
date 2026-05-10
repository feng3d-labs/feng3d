/**
 * 加载图片
 * @param url 图片 URL
 * @returns Promise<HTMLImageElement>
 */
export function loadImage(url: string): Promise<HTMLImageElement>
{
    return new Promise((resolve, reject) =>
    {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = (err) => reject(err);
        image.src = url;
    });
}

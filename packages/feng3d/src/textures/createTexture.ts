import { Color4, ColorKeywords } from '@feng3d/math';
import { Texture, TextureImageSource } from '@feng3d/webgpu';
import { ImageUtil } from '../utils/ImageUtil';

/**
 * 预生成 ImageData 名字（black/white/red/green/blue/defaultNormal/defaultParticle）。
 *
 * 仅用于 {@link imageDatas} 索引。
 */
export enum ImageDatas
{
    black = 'black',
    white = 'white',
    red = 'red',
    green = 'green',
    blue = 'blue',
    defaultNormal = 'defaultNormal',
    defaultParticle = 'defaultParticle',
}

/**
 * 预生成的 1×1（粒子贴图为 64×64）ImageData 集合。
 *
 * 供：
 * - {@link defaultTexture} / {@link defaultNormalTexture} / {@link defaultParticleTexture}
 *   创建 webgpu `Texture` 时的像素源
 *
 * 在非 DOM 环境（如 Node）下为 `undefined`，调用方需自行判空。
 */
export let imageDatas: {
    black: ImageData;
    white: ImageData;
    red: ImageData;
    green: ImageData;
    blue: ImageData;
    defaultNormal: ImageData;
    defaultParticle: ImageData;
};
if (typeof document !== 'undefined')
{
    imageDatas = {
        black: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.black)).imageData,
        white: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.white)).imageData,
        red: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.red)).imageData,
        green: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.green)).imageData,
        blue: new ImageUtil(1, 1, new Color4().fromUnit24(ColorKeywords.blue)).imageData,
        defaultNormal: new ImageUtil(1, 1, new Color4().fromUnit24(0x8080ff)).imageData,
        defaultParticle: new ImageUtil().drawDefaultParticle().imageData,
    };
}

/**
 * 默认纹理（1×1 rgba8unorm 白色）。
 *
 * 替代旧 `Texture2D.white` / `Texture2D.default`。在 DOM 环境下提供白色像素源；
 * 非 DOM 环境下仅声明 descriptor（GPU 端会按 1×1 占位创建）。
 */
export const defaultTexture: Texture = imageDatas
    ? { descriptor: { size: [1, 1], format: 'rgba8unorm' }, sources: [{ image: imageDatas.white }] }
    : { descriptor: { size: [1, 1], format: 'rgba8unorm' } };

/**
 * 默认法线纹理（1×1 rgba8unorm，RGB = (0x80, 0x80, 0xff)，指向 +Z 的单位法线）。
 *
 * 替代旧 `Texture2D.defaultNormal`。
 */
export const defaultNormalTexture: Texture = imageDatas
    ? { descriptor: { size: [1, 1], format: 'rgba8unorm' }, sources: [{ image: imageDatas.defaultNormal }] }
    : { descriptor: { size: [1, 1], format: 'rgba8unorm' } };

/**
 * 默认粒子纹理（64×64 rgba8unorm，径向衰减的白色圆点）。
 *
 * 替代旧 `Texture2D.defaultParticle`。
 */
export const defaultParticleTexture: Texture = imageDatas
    ? { descriptor: { size: [64, 64], format: 'rgba8unorm' }, sources: [{ image: imageDatas.defaultParticle }] }
    : { descriptor: { size: [1, 1], format: 'rgba8unorm' } };

/**
 * 默认 cube 纹理（1×1×6 cube，6 面全白）。
 *
 * 替代旧 `TextureCube.default`。WebGPU cube 层顺序为 [+X, -X, +Y, -Y, +Z, -Z]，
 * 6 面 textureOrigin 分别为 0..5。
 */
export const defaultCubeTexture: Texture = {
    descriptor: {
        size: [1, 1, 6],
        dimension: 'cube',
        format: 'rgba8unorm',
    },
    sources: [0, 1, 2, 3, 4, 5].map((i) =>
    {
        const item: TextureImageSource = {
            image: new ImageData(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1),
            textureOrigin: [0, 0, i],
        };

        return item;
    }),
};

/**
 * 从 url 异步加载 2D 纹理（HTMLImageElement → ImageData）。
 *
 * 替代旧 `new Texture2D(); t.source = { url }`。返回的 Texture 直接满足 webgpu
 * `Texture` 接口，descriptor.sources 在创建时已就绪（不再有 loadCompleted 事件）。
 *
 * 加载失败时打印警告并 reject。
 *
 * @param url 图片地址
 */
export async function createTextureFromUrl(url: string): Promise<Texture>
{
    const img = await loadImage(url);
    const imageData = ImageUtil.fromImage(img).imageData;

    return {
        descriptor: { size: [imageData.width, imageData.height], format: 'rgba8unorm' },
        sources: [{ image: imageData }],
    };
}

/**
 * 从 HTMLCanvasElement 创建 2D 纹理（对应 three.js CanvasTexture）。
 *
 * 用于程序化纹理（棋盘格、径向渐变、法线贴图等），无需加载图片文件。
 *
 * @param canvas HTML 画布元素
 * @param format 纹理格式（默认 rgba8unorm）
 */
export function createTextureFromCanvas(canvas: HTMLCanvasElement, format: Texture['descriptor']['format'] = 'rgba8unorm'): Texture
{
    return {
        descriptor: { size: [canvas.width, canvas.height], format },
        sources: [{ image: canvas }],
    };
}

/**
 * 加载图片（HTMLImageElement + onload/onerror）。
 *
 * @param url 图片地址
 */
function loadImage(url: string): Promise<HTMLImageElement>
{
    return new Promise((resolve, reject) =>
    {
        const image = new Image();

        image.crossOrigin = 'Anonymous';
        image.onload = () => resolve(image);
        image.onerror = () =>
        {
            console.error(`Error while trying to load texture: ${url}`);
            reject(new Error(`${url} 加载失败！`));
        };
        image.src = url;
    });
}

/**
 * 从 6 个 url 加载 cube 纹理。
 *
 * 替代旧 `new TextureCube(); t.urls = [...]`。feng3d API 顺序 [+X, +Y, +Z, -X, -Y, -Z]
 * 会通过 faceRemap 重排到 WebGPU cube 层顺序 [+X, -X, +Y, -Y, +Z, -Z]。
 *
 * @param urls 6 个面的图片地址，顺序为 feng3d 约定 [+X, +Y, +Z, -X, -Y, -Z]
 */
export async function createTextureCubeFromUrls(urls: string[]): Promise<Texture>
{
    console.assert(urls.length === 6, 'createTextureCubeFromUrls: urls length must be 6');

    const imageBitmaps = await Promise.all(urls.map(async (src) =>
    {
        const response = await fetch(src);
        const blob = await response.blob();

        return createImageBitmap(blob);
    }));

    // feng3d API 顺序 [+X, +Y, +Z, -X, -Y, -Z] → WebGPU cube 层顺序 [+X, -X, +Y, -Y, +Z, -Z]
    const faceRemap = [0, 2, 4, 1, 3, 5];
    const sources: TextureImageSource[] = imageBitmaps.map((bitmap, i) =>
    {
        const item: TextureImageSource = {
            image: bitmap,
            textureOrigin: [0, 0, faceRemap[i]],
        };

        return item;
    });

    return {
        descriptor: {
            size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
            dimension: 'cube',
            format: 'rgba8unorm',
        },
        sources,
    };
}

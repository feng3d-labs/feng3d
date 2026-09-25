/**
 * 纹理基础类型（尺寸、坐标、数据布局）。
 *
 * **本文件的存在是为了打破循环依赖**：
 * - `Texture.ts` 需要 `TextureDataSource` / `TextureImageSource` 来构造 `TextureSource` 联合类型
 * - 而 `TextureDataSource.ts` / `TextureImageSource.ts` 又需要下面这些基础类型
 *
 * 若这些类型留在 `Texture.ts`，就形成
 * `Texture → TextureDataSource → Texture` 的循环。循环依赖在**跨包编译上下文**
 * （例如 `packages/editor` 编译时通过 workspace 解析 `@feng3d/webgpu`）下会因类型解析
 * 顺序不同而产生"类型不完整"的假报错，典型症状是：
 * `TextureDataSource is not assignable to TextureSource`。
 *
 * 因此把它们下沉到本文件：`Texture.ts` 仅 re-export 以保持对外 API 不变。
 */

/**
 * 纹理数据布局。
 */
export interface TextureDataLayout
{
    /**
     * 默认为 0。字节偏移，一般用于跳过文件头部非纹理数据部分。
     */
    offset?: number;

    /**
     * 图片宽度。
     *
     * 默认值为 ITextureDataSource.size[0] 。
     */
    width?: number;

    /**
     * 单张图片高度。只在纹理为2d纹理数组或者3d纹理时生效。
     *
     * 默认值为 ITextureDataSource.size[1] 。
     */
    height?: number;
}

/**
 * 图片中的坐标。
 */
export type ImageOrigin = readonly [x: number, y: number];

/**
 * 数据图片中的坐标。depthOrArrayLayers 表示数据中包含有多张图片中的第几张，只在纹理为2d纹理数组或者3d纹理时生效。
 */
export type DataImageOrigin = readonly [x: number, y: number, depthOrArrayLayers?: number];

/**
 * 图片尺寸
 */
export type ImageSize = readonly [width: number, height: number];

/**
 * 纹理尺寸，包含纹理的宽度、高度以及深度或者层数。
 *
 * depthOrArrayLayers: 当纹理为3d纹理时表示深度，2d纹理数组时表示数组索引，cube纹理时表示6个面的索引。
 */
export type TextureSize = readonly [width: number, height: number, depthOrArrayLayers?: number];

/**
 * 纹理内的坐标位置。
 */
export type TextureOrigin = readonly [x: number, y: number, depthOrArrayLayers?: number];

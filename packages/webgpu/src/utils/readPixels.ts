import { Texture } from '../data/Texture';

/**
 * 从 GPU纹理 上读取数据。
 *
 * @param device GPU设备。
 * @param texture GPU纹理
 * @param origin 纹理读取起点坐标 [x, y]。
 * @param copySize 纹理读取尺寸 [width, height]。
 * @param mipLevel mipmap级别，默认为 0。
 * @param arrayLayer 纹理数组层索引，默认为 0。
 *
 * @returns 读取到的数据。
 */
export async function readPixels(device: GPUDevice, params: {
    texture: GPUTexture,
    origin: [x: number, y: number],
    copySize: [width: number, height: number],
    mipLevel?: number,
    arrayLayer?: number,
})
{
    const commandEncoder = device.createCommandEncoder();

    const { texture, origin, copySize, mipLevel = 0, arrayLayer = 0 } = params;
    const [width, height] = copySize;

    const bytesPerPixel = Texture.getTextureBytesPerPixel(texture.format);
    const DataConstructor = Texture.getTextureDataConstructor(texture.format);

    // WebGPU 要求 bytesPerRow 必须是 256 的倍数
    const unalignedBytesPerRow = width * bytesPerPixel;
    const alignedBytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256;
    const bufferSize = alignedBytesPerRow * height;
    const bufferData = new DataConstructor((unalignedBytesPerRow * height) / DataConstructor.BYTES_PER_ELEMENT);

    //
    const buffer = device.createBuffer({ size: bufferSize, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });

    commandEncoder.copyTextureToBuffer(
        {
            texture,
            mipLevel,
            origin: { x: origin[0], y: origin[1], z: arrayLayer },
        },
        {
            buffer,
            offset: 0,
            bytesPerRow: alignedBytesPerRow,
        },
        copySize,
    );

    device.queue.submit([commandEncoder.finish()]);

    await buffer.mapAsync(GPUMapMode.READ);

    const source = new Uint8Array(buffer.getMappedRange());

    // 从对齐的缓冲区中提取实际数据（跳过每行的填充字节）
    const actualDataSize = unalignedBytesPerRow * height;
    const actualData = new Uint8Array(actualDataSize);

    for (let row = 0; row < height; row++)
    {
        const sourceOffset = row * alignedBytesPerRow;
        const destOffset = row * unalignedBytesPerRow;

        actualData.set(source.subarray(sourceOffset, sourceOffset + unalignedBytesPerRow), destOffset);
    }

    bufferData.set(actualData);

    buffer.destroy();

    return bufferData;
}

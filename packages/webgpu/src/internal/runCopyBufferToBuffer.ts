import { Buffer } from '../data/Buffer';
import { CopyBufferToBuffer } from '../data/CopyBufferToBuffer';
import { WGPUBuffer } from '../caches/WGPUBuffer';

export function runCopyBufferToBuffer(device: GPUDevice, commandEncoder: GPUCommandEncoder, copyBufferToBuffer: CopyBufferToBuffer)
{
    //
    const sourceBuffer = WGPUBuffer.getInstance(device, Buffer.getBuffer(copyBufferToBuffer.source.buffer));
    const source = sourceBuffer.gpuBuffer;

    //
    const sourceOffset = copyBufferToBuffer.source.byteOffset;

    //
    const destinationBuffer = WGPUBuffer.getInstance(device, Buffer.getBuffer(copyBufferToBuffer.destination.buffer));
    const destination = destinationBuffer.gpuBuffer;

    //
    const destinationOffset = copyBufferToBuffer.destination.byteOffset;

    //
    const size = copyBufferToBuffer.size ?? Math.min(copyBufferToBuffer.source.byteLength, copyBufferToBuffer.destination.byteLength);

    commandEncoder.copyBufferToBuffer(source, sourceOffset, destination, destinationOffset, size);
}

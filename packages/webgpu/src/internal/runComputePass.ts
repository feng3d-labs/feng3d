import { WGPUTimestampQuery } from '../caches/WGPUTimestampQuery';
import { ComputePass } from '../data/ComputePass';
import { runComputeObject } from './runComputeObject';

export function runComputePass(device: GPUDevice, commandEncoder: GPUCommandEncoder, computePass: ComputePass)
{
    const descriptor: GPUComputePassDescriptor = {};

    if (computePass.descriptor?.timestampQuery)
    {
        const wGPUTimestampQuery = WGPUTimestampQuery.getInstance(device, computePass.descriptor.timestampQuery);

        // getInstance 在设备不支持 timestamp-query 特性时返回 null（见该方法内的 console.warn），
        // 此时不设置 timestampWrites：与 WGPURenderPassDescriptor 的处理方式一致，也是该分支的既有意图
        descriptor.timestampWrites = wGPUTimestampQuery?.gpuPassTimestampWrites;
    }
    //
    const passEncoder = commandEncoder.beginComputePass(descriptor);

    computePass.computeObjects.forEach((computeObject) =>
    {
        runComputeObject(computeObject, device, passEncoder);
    });

    passEncoder.end();

    // 处理时间戳查询；resolve 是引擎扩展的可选方法（未设置时不解析）
    descriptor.timestampWrites?.resolve?.(commandEncoder);
}
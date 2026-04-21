import { quitIfWebGPUNotAvailable } from './quitIfWebGPUNotAvailable';

export async function getGPUDevice(options?: GPURequestAdapterOptions, descriptor?: GPUDeviceDescriptor)
{
    const adapter = await navigator.gpu?.requestAdapter(options);
    // 获取支持的特性
    const features: GPUFeatureName[] = [];

    adapter?.features.forEach((v) =>
    {
        features.push(v as any);
    });
    // 判断请求的特性是否被支持
    const requiredFeatures = Array.from(descriptor?.requiredFeatures || []);

    if (requiredFeatures.length > 0)
    {
        for (let i = requiredFeatures.length - 1; i >= 0; i--)
        {
            if (features.indexOf(requiredFeatures[i]) === -1)
            {
                console.error(`当前 GPUAdapter 不支持特性 ${requiredFeatures[i]}！`);
                requiredFeatures.splice(i, 1);
            }
        }
    }
    // 默认开启当前本机支持的所有WebGPU特性。
    const finalDescriptor: GPUDeviceDescriptor = descriptor || {};
    finalDescriptor.requiredFeatures = (finalDescriptor.requiredFeatures || requiredFeatures.length > 0 ? requiredFeatures : features) as any;

    // 设置更高的限制以支持更多的 storage buffer
    if (adapter)
    {
        const adapterLimits = adapter.limits;

        finalDescriptor.requiredLimits = finalDescriptor.requiredLimits || {};
        // 请求适配器支持的最大 storage buffer 数量
        if (adapterLimits.maxStorageBuffersPerShaderStage > 8)
        {
            finalDescriptor.requiredLimits.maxStorageBuffersPerShaderStage = adapterLimits.maxStorageBuffersPerShaderStage;
        }
    }
    //
    const device = await adapter?.requestDevice(finalDescriptor);

    quitIfWebGPUNotAvailable(adapter, device || null);

    return device!;
}
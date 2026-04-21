import { CanvasContext } from '../data/CanvasContext';
import { CommandEncoder } from '../data/CommandEncoder';
import { CopyBufferToBuffer } from '../data/CopyBufferToBuffer';
import { CopyTextureToTexture } from '../data/CopyTextureToTexture';
import { RenderPass } from '../data/RenderPass';
import { TransformFeedbackPass } from '../data/TransformFeedbackPass';

import { ComputePass } from '../data/ComputePass';
import { runComputePass } from './runComputePass';
import { runCopyBufferToBuffer } from './runCopyBufferToBuffer';
import { runCopyTextureToTexture } from './runCopyTextureToTexture';
import { runRenderPass } from './runRenderPass';
import { runTransformFeedbackPass } from './runTransformFeedbackPass';

export function runCommandEncoder(device: GPUDevice, commandEncoder: CommandEncoder, canvasContext?: CanvasContext)
{
    const gpuCommandEncoder = device.createCommandEncoder();

    commandEncoder.passEncoders.forEach((passEncoder) =>
    {
        if (!passEncoder.__type__ || passEncoder.__type__ === 'RenderPass')
        {
            runRenderPass(device, gpuCommandEncoder, passEncoder as RenderPass, canvasContext);

            return;
        }
        if (passEncoder.__type__ === 'ComputePass')
        {
            runComputePass(device, gpuCommandEncoder, passEncoder as ComputePass);

            return;
        }
        if (passEncoder.__type__ === 'CopyTextureToTexture')
        {
            runCopyTextureToTexture(device, gpuCommandEncoder, passEncoder as CopyTextureToTexture, canvasContext);

            return;
        }
        if (passEncoder.__type__ === 'CopyBufferToBuffer')
        {
            runCopyBufferToBuffer(device, gpuCommandEncoder, passEncoder as CopyBufferToBuffer);

            return;
        }

        if (passEncoder.__type__ === 'TransformFeedbackPass')
        {
            runTransformFeedbackPass(device, gpuCommandEncoder, passEncoder as TransformFeedbackPass);

            return;
        }

        console.error(`未处理 passEncoder ${passEncoder}`);
    });

    return gpuCommandEncoder.finish();
}
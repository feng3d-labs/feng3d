import { noMutationCount, reactive } from '@feng3d/reactivity';
import { CanvasContext } from '../data/CanvasContext';
import { Submit } from '../data/Submit';
import { flushDeferredReleases } from '../utils/GpuResourceRef';
import { pullUploads } from '../utils/GpuUploadRegistry';
import { runCommandEncoder } from './runCommandEncoder';

export function runSubmit(device: GPUDevice, submit: Submit, canvasContext?: CanvasContext)
{
    // 提交期间挂起变更计数：preSubmit/afterSubmit 与编码期间引擎自身的
    // 响应式写入是数据变化的"结果"而非"原因"，不得推高按需呈现的脏标记
    noMutationCount(() =>
    {
        reactive(device.queue).preSubmit = ~~device.queue.preSubmit + 1;

        const commandBuffers = submit.commandEncoders.map((v) =>
        {
            return runCommandEncoder(device, v, canvasContext);
        });

        // pull 模型（设计 4.3）：编码后、queue.submit 前统一拉取 uniform 差异上传。
        // 必须在编码后——WGPUBufferBinding 由编码（懒 computed 首读）创建并注册
        // 上传任务；writeBuffer 排队先于本次 submit 的命令缓冲执行，GPU 侧时序正确
        pullUploads(device);

        device.queue.submit(commandBuffers);

        // 引用计数归零的资源在这里才真正销毁（issue #89：deferred release）。
        // 放在 submit 之后：归零可能发生在本帧编码期间，而命令缓冲仍在引用该资源——
        // 立即销毁会让 GPU 侧读到已销毁的 buffer / texture（参考 Babylon.js 的
        // destroyDeferredBuffers）。销毁写入的统计变化属于"数据变化的结果"，
        // 因此仍留在 noMutationCount 内，不推高按需呈现的脏标记。
        flushDeferredReleases(device);

        reactive(device.queue).afterSubmit = ~~device.queue.afterSubmit + 1;
    });
}

declare global
{
    interface GPUQueue
    {
        preSubmit: number;
        afterSubmit: number;
    }
}
import { noMutationCount, reactive } from '@feng3d/reactivity';
import { CanvasContext } from '../data/CanvasContext';
import { Submit } from '../data/Submit';
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

        device.queue.submit(commandBuffers);

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
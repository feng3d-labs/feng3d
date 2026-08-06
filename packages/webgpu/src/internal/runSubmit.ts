import { reactive } from '@feng3d/reactivity';
import { CanvasContext } from '../data/CanvasContext';
import { Submit } from '../data/Submit';
import { runCommandEncoder } from './runCommandEncoder';

export function runSubmit(device: GPUDevice, submit: Submit, canvasContext?: CanvasContext)
{
    reactive(device.queue).preSubmit = ~~device.queue.preSubmit + 1;

    const commandBuffers = submit.commandEncoders.map((v) =>
    {
        return runCommandEncoder(device, v, canvasContext);
    });

    device.queue.submit(commandBuffers);

    reactive(device.queue).afterSubmit = ~~device.queue.afterSubmit + 1;
}

declare global
{
    interface GPUQueue
    {
        preSubmit: number;
        afterSubmit: number;
    }
}
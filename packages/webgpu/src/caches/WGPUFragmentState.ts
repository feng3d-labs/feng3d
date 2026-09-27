import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { FragmentState } from '../data/FragmentState';
import { ReactiveObject } from '../ReactiveObject';
import { WGPUColorTargetState } from './WGPUColorTargetState';
import { WGPUShaderModule } from './WGPUShaderModule';
import { WGPUShaderReflect } from './WGPUShaderReflect';

export class WGPUFragmentState extends ReactiveObject
{
    get gpuFragmentState()
    {
        return this._computedGpuFragmentState.value;
    }

    private _computedGpuFragmentState: Computed<GPUFragmentState>;

    constructor(device: GPUDevice, fragmentState: FragmentState, colorAttachments: readonly GPUTextureFormat[])
    {
        super();

        this._onCreate(device, fragmentState, colorAttachments);
        //
        WGPUFragmentState.map.set([device, fragmentState, colorAttachments], this);
        this.destroyCall(() =>
        {
            WGPUFragmentState.map.delete([device, fragmentState, colorAttachments]);
        });
    }

    private _onCreate(device: GPUDevice, fragmentState: FragmentState, colorAttachments: readonly GPUTextureFormat[])
    {
        const r_fragmentState = reactive(fragmentState);

        this._computedGpuFragmentState = computed(() =>
        {
            r_fragmentState.targets?.concat();
            r_fragmentState.constants;

            // 着色器必有源码（wgsl 或 code）；缺省时原实现同样会把 undefined 交给反射与模块创建
            const code = (r_fragmentState.wgsl || r_fragmentState.code)!;
            const { targets, constants } = fragmentState;

            const module = WGPUShaderModule.getGPUShaderModule(device, code);

            //
            let entryPoint = r_fragmentState.entryPoint;

            if (!entryPoint)
            {
                const reflect = WGPUShaderReflect.getWGSLReflectInfo(code);

                entryPoint = reflect.entry.fragment[0].name;
            }

            let gpuColorTargetStates: (GPUColorTargetState | null)[];

            if (targets)
            {
                gpuColorTargetStates = [];

                for (let i = 0; i < colorAttachments.length; i++)
                {
                    const format = colorAttachments[i];

                    if (!format)
                    {
                        // WebGPU 用 null 表示"跳过这个颜色附件"，且 Web IDL 会把 undefined 转成 null，
                        // 所以写 null 与原来的 undefined 运行时等价，只是类型上如实（targets 不接受 undefined）
                        gpuColorTargetStates.push(null);
                        continue;
                    }

                    const wgpuColorTargetState = WGPUColorTargetState.getInstance(targets[i], format);

                    gpuColorTargetStates.push(wgpuColorTargetState.gpuColorTargetState);
                }
            }
            else
            {
                gpuColorTargetStates = colorAttachments.map((format) => ({ format }));
            }

            const gpuFragmentState: GPUFragmentState = {
                module,
                entryPoint,
                targets: gpuColorTargetStates,
                constants,
            };

            return gpuFragmentState;
        });

    }

    static getInstance(device: GPUDevice, fragmentState: FragmentState, colorAttachments: readonly GPUTextureFormat[])
    {
        if (!fragmentState) return undefined;

        return WGPUFragmentState.map.get([device, fragmentState, colorAttachments]) || new WGPUFragmentState(device, fragmentState, colorAttachments);
    }

    private static readonly map = new ChainMap<[GPUDevice, FragmentState, readonly GPUTextureFormat[]], WGPUFragmentState>();
}
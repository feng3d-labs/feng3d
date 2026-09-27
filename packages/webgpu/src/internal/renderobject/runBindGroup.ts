import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '../../data/RenderObject';
import { WGPUBindGroup } from '../../caches/WGPUBindGroup';
import { WGPUPipelineLayout } from '../../caches/WGPUPipelineLayout';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';

export function runBindGroup(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const device = passEncoder.device;

    const r_renderObject = reactive(renderObject);

    // 执行
    r_renderObject.bindingResources;
    const bindingResources = renderObject.bindingResources;

    const vertexCode = r_renderObject.pipeline.vertex.wgsl || r_renderObject.pipeline.vertex.code;

    // 两种着色器代码在数据接口中都是可选的，缺失时着色器反射得到的是空绑定表，
    // 会导致绑定组布局与实际资源对不上（表现为渲染结果不对），故在此明确报错
    if (!vertexCode) throw new Error('runBindGroup: 管线缺少顶点着色器代码（vertex.wgsl / vertex.code）');

    // fragment 本身可选：没有片段着色器时 fragmentCode 为 undefined，即"无片段阶段"
    // （getPipelineLayout 依据 falsy 判断是否合并片段绑定，空串与 undefined 行为一致）
    const fragmentCode = r_renderObject.pipeline.fragment?.wgsl || r_renderObject.pipeline.fragment?.code || '';

    //
    // getPipelineLayout 的每条返回路径都会返回（缓存命中直接返回，否则必定新建并返回）布局描述符，不会返回 undefined
    const layout = WGPUPipelineLayout.getPipelineLayout({ vertex: vertexCode, fragment: fragmentCode })!;

    // bindingResources 缺省时按空绑定表处理（WGPUBindGroup 按绑定组布局逐项取资源，缺项本来就按"未提供"处理）
    const bindGroupBindingResources = bindingResources ?? {};

    layout.bindGroupLayouts.forEach((bindGroupLayout, index) =>
    {
        const wgpuBindGroup = WGPUBindGroup.getInstance(device, bindGroupLayout, bindGroupBindingResources);

        passEncoder.setBindGroup(index, wgpuBindGroup.gpuBindGroup);
    });
}
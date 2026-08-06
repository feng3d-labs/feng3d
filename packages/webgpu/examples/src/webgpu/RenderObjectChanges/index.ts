import { reactive } from '@feng3d/reactivity';
import { BufferBinding, RenderObject, Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init(); // 初始化WebGPU

    const renderObject: RenderObject = { // 渲染对象
        pipeline: { // 渲染管线
            vertex: { // 顶点着色器
                code: `
                @vertex
                fn main(
                    @location(0) position: vec2<f32>,
                ) -> @builtin(position) vec4<f32> {
                    return vec4<f32>(position, 0.0, 1.0);
                }
                ` },
            fragment: { // 片段着色器
                code: `
                    @binding(0) @group(0) var<uniform> color : vec4<f32>;
                    @fragment
                    fn main() -> @location(0) vec4f {
                        return color;
                    }
                ` },
        },
        vertices: {
            position: { data: new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]), format: 'float32x2' }, // 顶点坐标数据
        },
        indices: new Uint16Array([0, 1, 2]), // 顶点索引数据
        draw: { __type__: 'DrawIndexed', indexCount: 3 }, // 绘制命令
        bindingResources: { color: { value: [1, 0, 0, 0] } as BufferBinding }, // Uniform 颜色值。
    };

    const submit: Submit = { // 一次GPU提交
        commandEncoders: [ // 命令编码列表
            {
                passEncoders: [ // 通道编码列表
                    { // 渲染通道
                        descriptor: { // 渲染通道描述
                            colorAttachments: [{ // 颜色附件
                                view: { texture: { context: { canvasId: canvas.id } } }, // 绘制到canvas上
                                clearValue: [0.0, 0.0, 0.0, 1.0], // 渲染前填充颜色
                            }],
                        },
                        renderPassObjects: [renderObject],
                    },
                ],
            },
        ],
    };

    function render()
    {
        webgpu.submit(submit); // 提交GPU执行
        requestAnimationFrame(render);
    }

    render();

    window.onclick = () =>
    {
        // reactive(renderObject.vertices.position).stepMode = "instance";
        // reactive(renderObject.vertices.position).stepMode = "vertex";
        // reactive(renderObject.vertices.position).data = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -1]);
        // reactive(renderObject.vertices.position).format = "float32x3";
        // reactive(renderObject.vertices.position).data = new Float32Array([1.0, 0.5, 1.0, -0.5, -0.5, 1.0, 0.5, -1, 1.0]);
        // 修改顶点着色器代码
        reactive(renderObject.pipeline.vertex).code = `
                @vertex
                fn main(
                    @location(0) position: vec2<f32>,
                ) -> @builtin(position) vec4<f32> {
                    var pos = position;
                    pos.x = pos.x + 0.5;
                    return vec4<f32>(pos, 0.0, 1.0);
                }
                `;

        // 修改片段着色器代码
        reactive(renderObject.pipeline.fragment).code = `
                @binding(0) @group(0) var<uniform> color : vec4<f32>;
                @fragment
                fn main() -> @location(0) vec4f {
                    var col = color;
                    col.x = 0.5;
                    col.y = 0.6;
                    col.z = 0.7;
                    return col;
                }
                `;

        reactive(renderObject.bindingResources.color as BufferBinding).value = [0, 1, 0, 1];
    };
};

let webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

if (!webgpuCanvas)
{
    webgpuCanvas = document.createElement('canvas');
    webgpuCanvas.id = 'webgpu';
    webgpuCanvas.style.width = '400px';
    webgpuCanvas.style.height = '300px';
    document.body.appendChild(webgpuCanvas);
}
init(webgpuCanvas);

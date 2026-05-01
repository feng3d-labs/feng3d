import { effect, reactive } from '@feng3d/reactivity';
import { BufferBinding, RenderObject, Submit, WebGPU } from '@feng3d/webgpu';

interface Input {
    readonly canvas: HTMLCanvasElement;
    readonly vertex: string;
    readonly fragment: string;
    readonly color: [number, number, number, number];
}

const init = async (input: Input) => {
    const devicePixelRatio = window.devicePixelRatio || 1;

    let canvas = input.canvas;
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'webgpu';
        canvas.style.width = '400px';
        canvas.style.height = '300px';
        document.body.appendChild(canvas);
    }

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

    // 使用响应式系统监听输入变化，动态更新渲染对象的着色器代码和颜色值
    const r_input = reactive(input);

    effect(() => {
        if (r_input.vertex)
            reactive(renderObject.pipeline.vertex).code = r_input.vertex;
        if (r_input.fragment)
            reactive(renderObject.pipeline.fragment).code = r_input.fragment;
        if (r_input.color)
            reactive(renderObject.bindingResources.color as BufferBinding).value = r_input.color;
    });

    let handle: number;
    function render() {
        webgpu.submit(submit); // 提交GPU执行
        handle = requestAnimationFrame(render);
    }

    render();

    return {
        destroy: () => {
            cancelAnimationFrame(handle);
        }
    }
};

const input = {
    canvas: document.getElementById('webgpu') as HTMLCanvasElement,
    vertex: undefined as string,
    fragment: undefined as string,
    color: undefined as [number, number, number, number],
} as const;

init(input);

window.onclick = () => {
    const r_input = reactive(input);
    r_input.vertex = `
                @vertex
                fn main(
                    @location(0) position: vec2<f32>,
                ) -> @builtin(position) vec4<f32> {
                    var pos = position;
                    pos.x = pos.x + 0.5;
                    return vec4<f32>(pos, 0.0, 1.0);
                }
                `;
    r_input.fragment = `
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
    r_input.color = [0, 1, 0, 1];
};
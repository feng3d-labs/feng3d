import { reactive } from '@feng3d/reactivity';
import { CanvasContext, RenderPassDescriptor, RenderPipeline, Submit, VertexAttributes } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { mat4, vec3 } from 'wgpu-matrix';

import { cubePositionOffset, cubeUVOffset, cubeVertexArray, cubeVertexCount, cubeVertexSize } from '../../meshes/cube';

const basicVertWGSL = `
struct Uniforms {
  modelViewProjectionMatrix: mat4x4<f32>,
}
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) fragUV: vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn main(
    @location(0) position: vec4<f32>,
    @location(1) uv: vec2<f32>
) -> VertexOutput {
    var output: VertexOutput;
    output.Position = uniforms.modelViewProjectionMatrix * position;
    output.fragUV = uv;
    output.fragPosition = 0.5 * (position + vec4(1.0, 1.0, 1.0, 1.0));
    return output;
}
`;
const vertexPositionColorWGSL = `
@fragment
fn main(
    @location(0) fragUV: vec2<f32>,
    @location(1) fragPosition: vec4<f32>
) -> @location(0) vec4<f32> {
    return fragPosition;
}

`;

// The worker process can instantiate a WebGPU device immediately, but it still needs an
// OffscreenCanvas to be able to display anything. Here we listen for an 'init' message from the
// main thread that will contain an OffscreenCanvas transferred from the page, and use that as the
// signal to begin WebGPU initialization.
self.addEventListener('message', (ev) =>
{
    switch (ev.data.type)
    {
        case 'init': {
            try
            {
                init(ev.data.offscreenCanvas);
            }
            catch (err)
            {
                console.error(
                    `Error while initializing WebGPU in worker process: ${err.message}`,
                );
            }
            break;
        }
    }
});

// Once we receive the OffscreenCanvas this init() function is called, which functions similarly
// to the init() method for all the other samples. The remainder of this file is largely identical
// to the rotatingCube sample.
async function init(canvas: OffscreenCanvas)
{
    const webgpu = await new WebGPU().init();
    const context: CanvasContext = { canvasId: canvas };

    // Create a vertex buffer from the cube data.
    const verticesBuffer: VertexAttributes = {
        position: { data: cubeVertexArray, format: 'float32x4', offset: cubePositionOffset, arrayStride: cubeVertexSize },
        uv: { data: cubeVertexArray, format: 'float32x2', offset: cubeUVOffset, arrayStride: cubeVertexSize },
    };

    const pipeline: RenderPipeline = {
        vertex: {
            code: basicVertWGSL,
        },
        fragment: {
            code: vertexPositionColorWGSL,
        },
        primitive: {
            topology: 'triangle-list',

            // Backface culling since the cube is solid piece of geometry.
            // Faces pointing away from the camera will be occluded by faces
            // pointing toward the camera.
            cullFace: 'back',
            frontFace: 'ccw',
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
        },
    };

    const uniformBindGroup = {
        uniforms: { value: { modelViewProjectionMatrix: undefined } },
    };

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context } }, // Assigned later

                clearValue: [0.5, 0.5, 0.5, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0,
    );
    const modelViewProjectionMatrix = mat4.create();

    function getTransformationMatrix()
    {
        const viewMatrix = mat4.identity();

        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        const now = Date.now() / 1000;

        mat4.rotate(
            viewMatrix,
            vec3.fromValues(Math.sin(now), Math.cos(now), 0),
            1,
            viewMatrix,
        );

        mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

        return modelViewProjectionMatrix;
    }

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [{
                descriptor: renderPassDescriptor,
                renderPassObjects: [{
                    pipeline,
                    bindingResources: uniformBindGroup,
                    vertices: verticesBuffer,
                    draw: { __type__: 'DrawVertex', vertexCount: cubeVertexCount },
                }],
            }],
        }],
    };

    function frame()
    {
        const transformationMatrix = getTransformationMatrix();

        reactive(uniformBindGroup.uniforms.value).modelViewProjectionMatrix = transformationMatrix.slice();

        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }

    // Note: It is important to return control to the browser regularly in order for the worker to
    // process events. You shouldn't simply loop infinitely with while(true) or similar! Using a
    // traditional requestAnimationFrame() loop in the worker is one way to ensure that events are
    // handled correctly by the worker.
    requestAnimationFrame(frame);
}

export { };


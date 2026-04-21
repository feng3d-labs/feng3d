import { effect, reactive } from '@feng3d/reactivity';
import { RenderObject, Submit } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';
import { mat4 } from 'wgpu-matrix';

import skyFragWGSL from './sky.frag.wgsl';
import skyVertWGSL from './sky.vert.wgsl';

const parameters: {
    readonly elevation: number,
    readonly azimuth: number,
    readonly cameraRotationX: number,
    readonly cameraRotationY: number,
} = {
    elevation: 2,
    azimuth: 180,
    cameraRotationX: 0,
    cameraRotationY: 0,
};

const r_parameters = reactive(parameters);

const init = async (canvas: HTMLCanvasElement) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const gui: GUI = new GUI();

    const webgpu = await new WebGPU().init();

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const buffers = initBuffers();

    const uniforms = {
        value: {
            modelMatrix: new Float32Array(16) as Float32Array,
            modelViewMatrix: new Float32Array(16) as Float32Array,
            projectionMatrix: new Float32Array(16) as Float32Array,
            viewMatrix: new Float32Array(16) as Float32Array,
            cameraPosition: new Float32Array(3) as Float32Array,
            sunPosition: new Float32Array(3) as Float32Array,
            rayleigh: 2.0,
            turbidity: 10.0,
            mieCoefficient: 0.0050,
            up: new Float32Array([0, 1, 0]) as Float32Array,
            mieDirectionalG: 0.2,
        },
    };

    const renderObject: RenderObject = {
        pipeline: {
            vertex: {
                code: skyVertWGSL,
            }, fragment: {
                code: skyFragWGSL,
            },
            primitive: { topology: 'triangle-list' },
        },
        vertices: {
            position: {
                format: 'float32x3',
                data: buffers.position,
            },
        },
        indices: buffers.indices,
        draw: { __type__: 'DrawIndexed', firstIndex: 0, indexCount: 36 },
        bindingResources: {
            uniforms,
        },
    };

    const folderSky = gui.addFolder('Sky');

    folderSky.add(r_parameters, 'elevation', 0, 10, 0.1);
    folderSky.add(r_parameters, 'azimuth', -180, 180, 0.1);
    folderSky.add(r_parameters, 'cameraRotationX', -180, 180, 0.1);
    folderSky.add(r_parameters, 'cameraRotationY', -180, 180, 0.1);
    folderSky.open();

    effect(() =>
    {
        const phi = (90 - r_parameters.elevation) / 180 * Math.PI;
        const theta = (r_parameters.azimuth) / 180 * Math.PI;

        const sun = setFromSphericalCoords(1, phi, theta);

        reactive(uniforms.value).sunPosition = new Float32Array(sun) as Float32Array;
    });

    effect(() =>
    {
        const cameraRotationX = r_parameters.cameraRotationX / 180 * Math.PI;
        const cameraRotationY = r_parameters.cameraRotationY / 180 * Math.PI;

        //
        const fieldOfView = 45 * Math.PI / 180; // in radians
        const aspect = canvas.clientWidth / canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = mat4.perspective(fieldOfView, aspect, zNear, zFar);

        const modelMatrix = mat4.scaling([10000, 10000, 10000]);

        const cameraMatrix = mat4.identity();

        mat4.rotateX(cameraMatrix, cameraRotationX, cameraMatrix);
        mat4.rotateY(cameraMatrix, cameraRotationY, cameraMatrix);
        const viewMatrix = mat4.inverse(cameraMatrix);

        const modelViewMatrix = mat4.multiply(viewMatrix, modelMatrix);

        reactive(uniforms.value).modelMatrix = modelMatrix as Float32Array;
        reactive(uniforms.value).modelViewMatrix = modelViewMatrix as Float32Array;
        reactive(uniforms.value).projectionMatrix = projectionMatrix as Float32Array;
        reactive(uniforms.value).viewMatrix = viewMatrix as Float32Array;
        reactive(uniforms.value).cameraPosition = new Float32Array([0, 0, 0]) as Float32Array;
    });

    const submit: Submit = {
        commandEncoders: [{
            passEncoders: [
                // 绘制
                {
                    descriptor: {
                        colorAttachments: [{ clearValue: [0.5, 0.5, 0.5, 1.0], loadOp: 'clear', view: { texture: { context: { canvasId: canvas.id } } } }],
                    },
                    renderPassObjects: [renderObject],
                },
            ],
        }],
    };

    // Draw the scene repeatedly
    function render()
    {
        webgpu.submit(submit);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers()
{
    // Now create an array of positions for the cube.

    const positions = [
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,
    ];

    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.

    const indices = [
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // back
        8, 9, 10, 8, 10, 11, // top
        12, 13, 14, 12, 14, 15, // bottom
        16, 17, 18, 16, 18, 19, // right
        20, 21, 22, 20, 22, 23, // left
    ];

    return {
        position: new Float32Array(positions),
        indices: new Uint16Array(indices),
    };
}

function setFromSphericalCoords(radius: number, phi: number, theta: number)
{
    const sinPhiRadius = Math.sin(phi) * radius;

    const x = sinPhiRadius * Math.sin(theta);
    const y = Math.cos(phi) * radius;
    const z = sinPhiRadius * Math.cos(theta);

    return [x, y, z];
}

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas);


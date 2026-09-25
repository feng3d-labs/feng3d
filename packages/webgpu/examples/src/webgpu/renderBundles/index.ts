import { reactive } from '@feng3d/reactivity';
import { BindingResources, Buffer, CanvasContext, RenderObject, RenderPass, RenderPassDescriptor, RenderPipeline, Sampler, Submit, Texture, VertexAttributes } from '@feng3d/webgpu';
import { RenderBundle, WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';
import Stats from 'stats.js';
import { mat4, vec3 } from 'wgpu-matrix';

import { SphereLayout, createSphereMesh } from '../../meshes/sphere';
import meshWGSL from './mesh.wgsl';

interface Renderable
{
    renderObject?: RenderObject;
    vertexAttributes: VertexAttributes;
    indices: Uint16Array;
    indexCount: number;
    bindGroup?: BindingResources;
}

const init = async (canvas: HTMLCanvasElement, gui: GUI, stats: Stats) =>
{
    const settings = {
        useRenderBundles: true,
        asteroidCount: 5000,
    };

    gui.add(settings, 'useRenderBundles').onChange(onUseRenderBundlesChanged);
    gui.add(settings, 'asteroidCount', 1000, 10000, 1000).onChange(() =>
    {
        // If the content of the scene changes the render bundle must be recreated.
        ensureEnoughAsteroids();
        updateRenderBundle();
    });

    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();
    const context: CanvasContext = {
        canvasId: canvas.id,
    };

    const pipeline: RenderPipeline = {
        vertex: {
            code: meshWGSL,
        },
        fragment: {
            code: meshWGSL,
        },
        primitive: {
            // Backface culling since the sphere is solid piece of geometry.
            // Faces pointing away from the camera will be occluded by faces
            // pointing toward the camera.
            cullFace: 'back',
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
    };

    const depthTexture: Texture = {
        descriptor: {
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
        },
    };

    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer = new Uint8Array(uniformBufferSize);

    // Fetch the images and upload them into a GPUTexture.
    let planetTexture: Texture;

    {
        const response = await fetch(
            new URL('../../../assets/img/saturn.jpg', import.meta.url).toString(),
        );
        const imageBitmap = await createImageBitmap(await response.blob());

        planetTexture = {
            descriptor: {
                size: [imageBitmap.width, imageBitmap.height],
                format: 'rgba8unorm',
            },
            sources: [{ image: imageBitmap }],
        };
    }

    let moonTexture: Texture;

    {
        const response = await fetch(
            new URL('../../../assets/img/moon.jpg', import.meta.url).toString(),
        );
        const imageBitmap = await createImageBitmap(await response.blob());

        moonTexture = {
            descriptor: {
                size: [imageBitmap.width, imageBitmap.height],
                format: 'rgba8unorm',
            },
            sources: [{ image: imageBitmap }],
        };
    }

    const sampler: Sampler = {
        magFilter: 'linear',
        minFilter: 'linear',
    };

    // Helper functions to create the required meshes and bind groups for each sphere.
    function createSphereRenderable(
        radius: number,
        widthSegments = 32,
        heightSegments = 16,
        randomness = 0,
    ): Renderable
    {
        const sphereMesh = createSphereMesh(
            radius,
            widthSegments,
            heightSegments,
            randomness,
        );

        // Create a vertex buffer from the sphere data.
        const vertices = sphereMesh.vertices;

        const vertexAttributes: VertexAttributes = {
            position: { data: vertices, format: 'float32x3', offset: SphereLayout.positionsOffset, arrayStride: SphereLayout.vertexStride },
            normal: { data: vertices, format: 'float32x3', offset: SphereLayout.normalOffset, arrayStride: SphereLayout.vertexStride },
            uv: { data: vertices, format: 'float32x2', offset: SphereLayout.uvOffset, arrayStride: SphereLayout.vertexStride },
        };

        const indices = sphereMesh.indices;

        return {
            vertexAttributes,
            indices,
            indexCount: sphereMesh.indices.length,
        };
    }

    function createSphereBindGroup1(
        texture: Texture,
        transform: Float32Array,
    ): BindingResources
    {
        const uniformBuffer = new Float32Array(transform);

        const bindGroup: BindingResources = {
            modelMatrix: {
                bufferView: uniformBuffer,
            },
            meshSampler: sampler,
            meshTexture: { texture },
        };

        return bindGroup;
    }

    const transform = mat4.create();

    mat4.identity(transform);

    // Create one large central planet surrounded by a large ring of asteroids
    const planet = createSphereRenderable(1.0);

    planet.bindGroup = createSphereBindGroup1(planetTexture, transform);

    const asteroids1 = [
        createSphereRenderable(0.01, 8, 6, 0.15),
        createSphereRenderable(0.013, 8, 6, 0.15),
        createSphereRenderable(0.017, 8, 6, 0.15),
        createSphereRenderable(0.02, 8, 6, 0.15),
        createSphereRenderable(0.03, 16, 8, 0.15),
    ];

    const renderables = [planet];

    function ensureEnoughAsteroids()
    {
        for (let i = renderables.length; i <= settings.asteroidCount; ++i)
        {
            // Place copies of the asteroid in a ring.
            const radius = Math.random() * 1.7 + 1.25;
            const angle = Math.random() * Math.PI * 2;
            const x = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 0.015;
            const z = Math.cos(angle) * radius;

            mat4.identity(transform);
            mat4.translate(transform, [x, y, z], transform);
            mat4.rotateX(transform, Math.random() * Math.PI, transform);
            mat4.rotateY(transform, Math.random() * Math.PI, transform);
            renderables.push({
                ...asteroids1[i % asteroids1.length],
                bindGroup: createSphereBindGroup1(moonTexture, transform),
            });
        }
    }
    ensureEnoughAsteroids();

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context } },

                clearValue: [0.0, 0.0, 0.0, 1.0],
            },
        ],
        depthStencilAttachment: {
            view: { texture: depthTexture },

            depthClearValue: 1,
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

    const uniforms = {
        value: { viewProjectionMatrix: modelViewProjectionMatrix as Float32Array },
    };

    const frameBindGroup: BindingResources = {
        uniforms: uniforms,
    };

    function getTransformationMatrix()
    {
        const viewMatrix = mat4.identity();

        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        const now = Date.now() / 1000;

        // Tilt the view matrix so the planet looks like it's off-axis.
        mat4.rotateZ(viewMatrix, Math.PI * 0.1, viewMatrix);
        mat4.rotateX(viewMatrix, Math.PI * 0.1, viewMatrix);
        // Rotate the view matrix slowly so the planet appears to spin.
        mat4.rotateY(viewMatrix, now * 0.05, viewMatrix);

        mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

        return modelViewProjectionMatrix as Float32Array;
    }

    // Render bundles function as partial, limited render passes, so we can use the
    // same code both to render the scene normally and to build the render bundle.
    function renderScene()
    {
        const ros: RenderObject[] = [];
        // Loop through every renderable object and draw them individually.
        // (Because many of these meshes are repeated, with only the transforms
        // differing, instancing would be highly effective here. This sample
        // intentionally avoids using instancing in order to emulate a more complex
        // scene, which helps demonstrate the potential time savings a render bundle
        // can provide.)
        let count = 0;

        for (const renderable of renderables)
        {
            if (!renderable.renderObject)
            {
                renderable.renderObject = {
                    pipeline: pipeline,
                    bindingResources: { ...frameBindGroup, ...renderable.bindGroup },
                    vertices: renderable.vertexAttributes,
                    indices: renderable.indices,
                    draw: { __type__: 'DrawIndexed', indexCount: renderable.indexCount },
                };
            }

            ros.push(renderable.renderObject);

            if (++count > settings.asteroidCount)
            {
                break;
            }
        }

        return ros;
    }

    const renderPass: RenderPass = {
        descriptor: renderPassDescriptor,
        renderPassObjects: [],
    };

    const submit: Submit = {
        commandEncoders: [
            {
                passEncoders: [renderPass],
            },
        ],
    };

    // The render bundle can be encoded once and re-used as many times as needed.
    // Because it encodes all of the commands needed to render at the GPU level,
    // those commands will not need to execute the associated JavaScript code upon
    // execution or be re-validated, which can represent a significant time savings.
    //
    // However, because render bundles are immutable once created, they are only
    // appropriate for rendering content where the same commands will be executed
    // every time, with the only changes being the contents of the buffers and
    // textures used. Cases where the executed commands differ from frame-to-frame,
    // such as when using frustrum or occlusion culling, will not benefit from
    // using render bundles as much.
    let renderBundle: RenderBundle = {
        __type__: 'RenderBundle',
        renderObjects: renderScene(),
    };

    function updateRenderBundle()
    {
        const renderBundleEncoder: RenderBundle = {
            __type__: 'RenderBundle',
            renderObjects: renderScene(),
        };

        renderBundle = renderBundleEncoder;
        onUseRenderBundlesChanged();
    }
    updateRenderBundle();

    function onUseRenderBundlesChanged()
    {
        if (settings.useRenderBundles)
        {
            // Executing a bundle is equivalent to calling all of the commands encoded
            // in the render bundle as part of the current render pass.
            reactive(renderPass).renderPassObjects = [renderBundle];
        }
        else
        {
            // Alternatively, the same render commands can be encoded manually, which
            // can take longer since each command needs to be interpreted by the
            // JavaScript virtual machine and re-validated each time.
            reactive(renderPass).renderPassObjects = renderBundle.renderObjects;
        }
    }
    onUseRenderBundlesChanged();

    function frame()
    {
        stats.begin();

        const transformationMatrix = getTransformationMatrix();

        reactive(uniforms.value).viewProjectionMatrix = transformationMatrix.subarray();

        webgpu.submit(submit);

        stats.end();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
};

const stats = new Stats();

document.body.appendChild(stats.dom);
const panel = new GUI({ width: 310 });
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel, stats);

import { reactive } from '@feng3d/reactivity';
import { BindingResources, RenderPassDescriptor, RenderPipeline, Sampler, Submit, Texture } from '@feng3d/webgpu';
import { WebGPU } from '@feng3d/webgpu';
import { GUI } from 'dat.gui';
import { mat4, vec3 } from 'wgpu-matrix';
import { createBoxMeshWithTangents } from '../../meshes/box';
import normalMapWGSL from './normalMap.wgsl';
import { create3DRenderPipeline, createTextureFromImage } from './utils';

const init = async (canvas: HTMLCanvasElement, gui: GUI) =>
{
    const devicePixelRatio = window.devicePixelRatio || 1;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const webgpu = await new WebGPU().init();

    enum TextureAtlas
    {
        Spiral,
        Toybox,
        BrickWall,
    }

    interface GUISettings
    {
        'Bump Mode':
        | 'Albedo Texture'
        | 'Normal Texture'
        | 'Depth Texture'
        | 'Normal Map'
        | 'Parallax Scale'
        | 'Steep Parallax';
        cameraPosX: number;
        cameraPosY: number;
        cameraPosZ: number;
        lightPosX: number;
        lightPosY: number;
        lightPosZ: number;
        lightIntensity: number;
        depthScale: number;
        depthLayers: number;
        Texture: string;
        'Reset Light': () => void;
    }

    const settings: GUISettings = {
        'Bump Mode': 'Normal Map',
        cameraPosX: 0.0,
        cameraPosY: 0.8,
        cameraPosZ: -1.4,
        lightPosX: 1.7,
        lightPosY: 0.7,
        lightPosZ: -1.9,
        lightIntensity: 5.0,
        depthScale: 0.05,
        depthLayers: 16,
        Texture: 'Spiral',
        'Reset Light': () =>
        {
            return;
        },
    };

    // Create normal mapping resources and pipeline
    const depthTexture: Texture = {
        descriptor: {
            size: [canvas.width, canvas.height],
            format: 'depth24plus',
        },
    };

    // Fetch the image and upload it into a GPUTexture.
    let woodAlbedoTexture: Texture;

    {
        const response = await fetch('../../../assets/img/wood_albedo.png');
        const imageBitmap = await createImageBitmap(await response.blob());

        woodAlbedoTexture = createTextureFromImage(imageBitmap);
    }

    let spiralNormalTexture: Texture;

    {
        const response = await fetch('../../../assets/img/spiral_normal.png');
        const imageBitmap = await createImageBitmap(await response.blob());

        spiralNormalTexture = createTextureFromImage(imageBitmap);
    }

    let spiralHeightTexture: Texture;

    {
        const response = await fetch('../../../assets/img/spiral_height.png');
        const imageBitmap = await createImageBitmap(await response.blob());

        spiralHeightTexture = createTextureFromImage(imageBitmap);
    }

    let toyboxNormalTexture: Texture;

    {
        const response = await fetch('../../../assets/img/toybox_normal.png');
        const imageBitmap = await createImageBitmap(await response.blob());

        toyboxNormalTexture = createTextureFromImage(imageBitmap);
    }

    let toyboxHeightTexture: Texture;

    {
        const response = await fetch('../../../assets/img/toybox_height.png');
        const imageBitmap = await createImageBitmap(await response.blob());

        toyboxHeightTexture = createTextureFromImage(imageBitmap);
    }

    let brickwallAlbedoTexture: Texture;

    {
        const response = await fetch('../../../assets/img/brickwall_albedo.png');
        const imageBitmap = await createImageBitmap(await response.blob());

        brickwallAlbedoTexture = createTextureFromImage(imageBitmap);
    }

    let brickwallNormalTexture: Texture;

    {
        const response = await fetch('../../../assets/img/brickwall_normal.png');
        const imageBitmap = await createImageBitmap(await response.blob());

        brickwallNormalTexture = createTextureFromImage(imageBitmap);
    }

    let brickwallHeightTexture: Texture;

    {
        const response = await fetch('../../../assets/img/brickwall_height.png');
        const imageBitmap = await createImageBitmap(await response.blob());

        brickwallHeightTexture = createTextureFromImage(imageBitmap);
    }

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler: Sampler = {
        magFilter: 'linear',
        minFilter: 'linear',
    };

    const renderPassDescriptor: RenderPassDescriptor = {
        colorAttachments: [
            {
                view: { texture: { context: { canvasId: canvas.id } } },

                clearValue: [0, 0, 0, 1],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: { texture: depthTexture },

            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const box = createBoxMeshWithTangents(1.0, 1.0, 1.0);

    // Uniform bindGroups and bindGroupLayout
    const spaceTransform = {
        worldViewProjMatrix: undefined,
        worldViewMatrix: undefined,
    };
    const mapInfo = {
        lightPosVS: undefined,
        mode: undefined,
        lightIntensity: undefined,
        depthScale: undefined,
        depthLayers: undefined,
    };

    const bindingResources: BindingResources = {
        spaceTransform: { value: spaceTransform },
        mapInfo: { value: mapInfo },
        // Texture bindGroups and bindGroupLayout
        textureSampler: sampler,
        albedoTexture: { texture: woodAlbedoTexture },
        normalTexture: { texture: spiralNormalTexture },
        depthTexture: { texture: spiralHeightTexture },
    };

    const bindingResourcesList = [
        bindingResources,
        {
            ...bindingResources,
            albedoTexture: { texture: woodAlbedoTexture },
            normalTexture: { texture: toyboxNormalTexture },
            depthTexture: { texture: toyboxHeightTexture },
        },
        {
            ...bindingResources,
            albedoTexture: { texture: brickwallAlbedoTexture },
            normalTexture: { texture: brickwallNormalTexture },
            depthTexture: { texture: brickwallHeightTexture },
        },
    ];

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 10.0);

    function getViewMatrix()
    {
        return mat4.lookAt(
            [settings.cameraPosX, settings.cameraPosY, settings.cameraPosZ],
            [0, 0, 0],
            [0, 1, 0],
        );
    }

    function getModelMatrix()
    {
        const modelMatrix = mat4.create();

        mat4.identity(modelMatrix);
        const now = Date.now() / 1000;

        mat4.rotateY(modelMatrix, now * -0.5, modelMatrix);

        return modelMatrix;
    }

    // Change the model mapping type
    const getMode = (): number =>
    {
        switch (settings['Bump Mode'])
        {
            case 'Albedo Texture':
                return 0;
            case 'Normal Texture':
                return 1;
            case 'Depth Texture':
                return 2;
            case 'Normal Map':
                return 3;
            case 'Parallax Scale':
                return 4;
            case 'Steep Parallax':
                return 5;
        }
    };

    const texturedCubePipeline: RenderPipeline = create3DRenderPipeline(
        'NormalMappingRender',
        normalMapWGSL,
        // Position,   normal       uv           tangent      bitangent
        normalMapWGSL,
        true,
    );

    let currentSurfaceBindGroup = 0;
    const onChangeTexture = () =>
    {
        currentSurfaceBindGroup = TextureAtlas[settings.Texture];
    };

    gui.add(settings, 'Bump Mode', [
        'Albedo Texture',
        'Normal Texture',
        'Depth Texture',
        'Normal Map',
        'Parallax Scale',
        'Steep Parallax',
    ]);
    gui
        .add(settings, 'Texture', ['Spiral', 'Toybox', 'BrickWall'])
        .onChange(onChangeTexture);
    const lightFolder = gui.addFolder('Light');
    const depthFolder = gui.addFolder('Depth');

    lightFolder.add(settings, 'Reset Light').onChange(() =>
    {
        lightPosXController.setValue(1.7);
        lightPosYController.setValue(0.7);
        lightPosZController.setValue(-1.9);
        lightIntensityController.setValue(5.0);
    });
    const lightPosXController = lightFolder
        .add(settings, 'lightPosX', -5, 5)
        .step(0.1);
    const lightPosYController = lightFolder
        .add(settings, 'lightPosY', -5, 5)
        .step(0.1);
    const lightPosZController = lightFolder
        .add(settings, 'lightPosZ', -5, 5)
        .step(0.1);
    const lightIntensityController = lightFolder
        .add(settings, 'lightIntensity', 0.0, 10)
        .step(0.1);

    depthFolder.add(settings, 'depthScale', 0.0, 0.1).step(0.01);
    depthFolder.add(settings, 'depthLayers', 1, 32).step(1);

    function frame()
    {
        // Update spaceTransformsBuffer
        const viewMatrix = getViewMatrix();
        const worldViewMatrix = mat4.mul(viewMatrix, getModelMatrix());
        const worldViewProjMatrix = mat4.mul(projectionMatrix, worldViewMatrix);

        reactive(spaceTransform).worldViewMatrix = worldViewMatrix;
        reactive(spaceTransform).worldViewProjMatrix = worldViewProjMatrix;

        // Update mapInfoBuffer
        const lightPosWS = vec3.create(
            settings.lightPosX,
            settings.lightPosY,
            settings.lightPosZ,
        );
        const lightPosVS = vec3.transformMat4(lightPosWS, viewMatrix);
        const mode = getMode();

        // struct MapInfo {
        //   lightPosVS: vec3f,
        //   mode: u32,
        //   lightIntensity: f32,
        //   depthScale: f32,
        //   depthLayers: f32,
        // }
        mapInfo.lightPosVS = lightPosVS;
        mapInfo.mode = mode;
        mapInfo.lightIntensity = settings.lightIntensity;
        mapInfo.depthScale = settings.depthScale;
        mapInfo.depthLayers = settings.depthLayers;

        const submit: Submit = {
            commandEncoders: [{
                passEncoders: [{
                    descriptor: renderPassDescriptor,
                    renderPassObjects: [{
                        pipeline: texturedCubePipeline,
                        bindingResources: bindingResourcesList[currentSurfaceBindGroup],
                        // *   position  : float32x3
                        // *   normal    : float32x3
                        // *   uv        : float32x2
                        // *   tangent   : float32x3
                        // *   bitangent : float32x3
                        vertices: {
                            position: { data: box.vertices, offset: 0, format: 'float32x3', arrayStride: box.vertexStride },
                            normal: { data: box.vertices, offset: 12, format: 'float32x3', arrayStride: box.vertexStride },
                            uv: { data: box.vertices, offset: 24, format: 'float32x2', arrayStride: box.vertexStride },
                            vert_tan: { data: box.vertices, offset: 32, format: 'float32x3', arrayStride: box.vertexStride },
                            vert_bitan: { data: box.vertices, offset: 44, format: 'float32x3', arrayStride: box.vertexStride },
                        },
                        indices: box.indices,
                        draw: { __type__: 'DrawIndexed', indexCount: box.indices.length },
                    }],
                }],
            }],
        };

        webgpu.submit(submit);

        requestAnimationFrame(frame);
    }
    frame();
};

const panel = new GUI();
const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;

init(webgpuCanvas, panel);

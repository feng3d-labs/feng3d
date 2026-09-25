import { DepthStencilState, RenderPipeline, Texture } from '@feng3d/webgpu';

export const create3DRenderPipeline = (
    label: string,
    vertexShader: string,
    fragmentShader: string,
    depthTest = false,
) =>
{
    let depthStencil: DepthStencilState;

    if (depthTest)
    {
        depthStencil = {
            depthCompare: 'less',
            depthWriteEnabled: true,
        };
    }

    const pipelineDescriptor: RenderPipeline = {
        label: `${label}.pipeline`,
        vertex: {
            code: vertexShader,
        },
        fragment: {
            code: fragmentShader,
        },
        primitive: {
            topology: 'triangle-list',
            cullFace: 'back',
        },
        depthStencil,
    };

    return pipelineDescriptor;
};

export const createTextureFromImage = (
    bitmap: ImageBitmap,
) =>
{
    const texture: Texture = {
        descriptor: {
            size: [bitmap.width, bitmap.height],
            format: 'rgba8unorm',
        },
        sources: [{ image: bitmap }],
    };

    return texture;
};

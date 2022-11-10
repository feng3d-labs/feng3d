import { decoratorRegisterClass } from '@feng3d/serialization';
import { shaderlib } from '@feng3d/renderer';
import { Texture2D } from '../../textures/Texture2D';
import meshPhongFragment from './meshPhong_fragment_glsl';
import meshPhongVertex from './meshPhong_vertex_glsl';

declare global
{
    export interface MixinsUniformsTypes
    {
        meshPhong: MeshPhongUniforms
    }
}

@decoratorRegisterClass()
export class MeshPhongUniforms
{
    __class__: 'MeshPhongUniforms';

    map = Texture2D.default;

    modelViewMatrix = [0.6234, -0.6258, -0.4688, 0, -0.6025, -0.0023, -0.7981, 0, 0.4983, 0.7800, -0.3785, 0, 229.1123, 86.6113, -1067.6498, 1];

    projectionMatrix = [1.4530, 0, 0, 0, 0, 2.4142, 0, 0, 0, 0, -1.0010, -1, 0, 0, -2.0010, 0];

    viewMatrix = [-0.7637, -0.2887, 0.5774, 0, -0.0000, 0.8944, 0.4472, 0, -0.6456, 0.3415, -0.6831, 0, 0.0000, -0.0000, -894.4272, 1];

    normalMatrix = [0.6234, -0.6258, -0.4688, -0.6025, -0.0023, -0.7981, 0.4983, 0.7800, -0.3785];

    isOrthographic = false;

    uvTransform = [1, 0, 0, 0, 1, 0, 0, 0, 1];

    diffuse = [1, 1, 1];

    emissive = [0, 0, 0];

    specular = [0.0667, 0.0667, 0.0667];

    shininess = 30;

    opacity = 1;

    ambientLightColor = [1.0053, 1.0053, 1.0053];

    lightProbe = [
        [0, 0, 0], [0, 0, 0], [0, 0, 0],
        [0, 0, 0], [0, 0, 0], [0, 0, 0],
        [0, 0, 0], [0, 0, 0], [0, 0, 0],
    ];

    pointLights = [{
        position: [-0.0000, -0.0000, -0.0000],
        color: [2.5133, 2.5133, 2.5133],
        distance: 0,
        decay: 1,
    }];
}

shaderlib.shaderConfig.shaders.meshPhong = {
    vertex: meshPhongVertex,
    fragment: meshPhongFragment,
    cls: MeshPhongUniforms
};

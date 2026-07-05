import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Component, } from '../component/Component';
import { AddComponentMenu } from '../Menu';
import { TextureCube } from '../textures/TextureCube';

// 触发 skyboxLogic 注册到 componentLogic 分发表
import './skyboxLogic';

/**
 * 天空盒组件（纯数据）。
 *
 * 渲染逻辑由 {@link skyboxLogic} 提供。
 */
@AddComponentMenu('SkyBox/SkyBox')
@decoratorRegisterClass()
export class SkyBox implements Component
{
    readonly __type__: string = 'SkyBox';

    __class__: 'SkyBox';

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'texturecube', datatype: 'texturecube' } })
    s_skyboxTexture = TextureCube.default;
}

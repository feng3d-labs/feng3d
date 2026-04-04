import { Component } from '@feng3d/ecs';
import { RenderAtomic } from '@feng3d/renderer';
import { SerializeProperty } from '@feng3d/serialization';
import { Camera3D } from '../../3d/cameras/Camera3D';
import { Scene3D } from '../../3d/core/Scene3D';
import { HideFlags } from '../HideFlags';
import { RunEnvironment } from '../RunEnvironment';

export { };

declare module '@feng3d/ecs'
{
    interface Component
    {
        /**
         * 隐藏标记，用于控制是否在层级界面、检查器显示，是否保存
         */
        hideFlags: HideFlags;

        /**
         * 可运行环境
         */
        runEnvironment: RunEnvironment;

        beforeRender(_renderAtomic: RenderAtomic, _scene: Scene3D, _camera: Camera3D): void;
    }
}

Component.prototype.hideFlags = HideFlags.None;

SerializeProperty()(Component, 'hideFlags');

Component.prototype.runEnvironment = RunEnvironment.all;

Component.prototype.beforeRender = function beforeRender(_renderAtomic: RenderAtomic, _scene: Scene3D, _camera: Camera3D)
{

};

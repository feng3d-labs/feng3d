import { RegisterComponent, Component, Scene, Camera, IEvent, Object3D, DirectionalLight, PointLight, SpotLight, serialization } from 'feng3d';
import { CameraIcon } from '../scripts/CameraIcon';
import { DirectionLightIcon } from '../scripts/DirectionLightIcon';
import { PointLightIcon } from '../scripts/PointLightIcon';
import { SpotLightIcon } from '../scripts/SpotLightIcon';

declare global
{
    export interface MixinsComponentMap { EditorComponent: EditorComponent }
}

@RegisterComponent()
export class EditorComponent extends Component
{
    get scene()
    {
        return this._scene;
    }
    set scene(v)
    {
        if (this._scene === v) return;

        if (this._scene)
        {
            this.scene.off('addComponent', this._onAddComponent, this);
            this.scene.off('removeComponent', this._onRemoveComponent, this);

            this.scene.getComponentsInChildren(Component).forEach((element) =>
            {
                this._removeComponent(element);
            });
        }
        this._scene = v;
        if (this._scene)
        {
            this.scene.getComponentsInChildren(Component).forEach((element) =>
            {
                this._addComponent(element);
            });

            this.scene.on('addComponent', this._onAddComponent, this);
            this.scene.on('removeComponent', this._onRemoveComponent, this);
            this.scene.on('addChild', this._onAddChild, this);
            this.scene.on('removeChild', this._onRemoveChild, this);
        }
    }

    private _scene: Scene;

    get editorCamera() { return this._editorCamera; }
    set editorCamera(v) { if (this._editorCamera === v) return; this._editorCamera = v; this.update(); }
    private _editorCamera: Camera;

    /**
     * 销毁
     */
    dispose()
    {
        this.scene = null;
        super.dispose();
    }

    private _onAddChild(event: IEvent<{ parent: Object3D; child: Object3D; }>)
    {
        const components = event.data.child.getComponentsInChildren();
        components.forEach((v) =>
        {
            this._addComponent(v);
        });
    }

    private _onRemoveChild(event: IEvent<{ parent: Object3D; child: Object3D; }>)
    {
        const components = event.data.child.getComponentsInChildren();
        components.forEach((v) =>
        {
            this._removeComponent(v);
        });
    }

    private _onAddComponent(event: IEvent<{ object3D: Object3D; component: Component; }>)
    {
        this._addComponent(event.data.component);
    }

    private _onRemoveComponent(event: IEvent<{ object3D: Object3D; component: Component; }>)
    {
        this._removeComponent(event.data.component);
    }

    private update()
    {
        this.directionLightIconMap.forEach((v) =>
        {
            v.editorCamera = this.editorCamera;
        });
        this.pointLightIconMap.forEach((v) =>
        {
            v.editorCamera = this.editorCamera;
        });
        this.spotLightIconMap.forEach((v) =>
        {
            v.editorCamera = this.editorCamera;
        });
        this.cameraIconMap.forEach((v) =>
        {
            v.editorCamera = this.editorCamera;
        });
    }

    private _addComponent(component: Component)
    {
        if (component instanceof DirectionalLight)
        {
            const object3D = new Object3D();
            object3D.name = 'DirectionLightIcon';
            const directionLightIcon = object3D.addComponent(DirectionLightIcon);
            directionLightIcon.light = component;
            directionLightIcon.editorCamera = this.editorCamera;
            this.object3D.addChild(directionLightIcon.object3D);
            this.directionLightIconMap.set(component, directionLightIcon);
        }
        else if (component instanceof PointLight)
        {
            const object3D = new Object3D();
            object3D.name = 'PointLightIcon';
            const pointLightIcon = object3D.addComponent(PointLightIcon);
            pointLightIcon.light = component;
            pointLightIcon.editorCamera = this.editorCamera;
            this.object3D.addChild(pointLightIcon.object3D);
            this.pointLightIconMap.set(component, pointLightIcon);
        }
        else if (component instanceof SpotLight)
        {
            const object3D = new Object3D();
            object3D.name = 'SpotLightIcon';
            const spotLightIcon = object3D.addComponent(SpotLightIcon);
            spotLightIcon.light = component;
            spotLightIcon.editorCamera = this.editorCamera;
            this.object3D.addChild(spotLightIcon.object3D);
            this.spotLightIconMap.set(component, spotLightIcon);
        }
        else if (component instanceof Camera)
        {
            const object3D = new Object3D();
            object3D.name = 'CameraIcon';
            const cameraIcon = object3D.addComponent(CameraIcon);
            cameraIcon.camera = component;
            cameraIcon.editorCamera = this.editorCamera;
            this.object3D.addChild(cameraIcon.object3D);
            this.cameraIconMap.set(component, cameraIcon);
        }
    }

    private _removeComponent(component: Component)
    {
        if (component instanceof DirectionalLight)
        {
            serialization.setValue(this.directionLightIconMap.get(component), { light: null }).object3D.remove();
            this.directionLightIconMap.delete(component);
        }
        else if (component instanceof PointLight)
        {
            serialization.setValue(this.pointLightIconMap.get(component), { light: null }).object3D.remove();
            this.pointLightIconMap.delete(component);
        }
        else if (component instanceof SpotLight)
        {
            serialization.setValue(this.spotLightIconMap.get(component), { light: null }).object3D.remove();
            this.spotLightIconMap.delete(component);
        }
        else if (component instanceof Camera)
        {
            serialization.setValue(this.cameraIconMap.get(component), { camera: null }).object3D.remove();
            this.cameraIconMap.delete(component);
        }
    }

    private directionLightIconMap = new Map<DirectionalLight, DirectionLightIcon>();
    private pointLightIconMap = new Map<PointLight, PointLightIcon>();
    private spotLightIconMap = new Map<SpotLight, SpotLightIcon>();
    private cameraIconMap = new Map<Camera, CameraIcon>();
}

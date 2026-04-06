import { RegisterComponent, Component, Scene, Camera, IEvent, GameObject, DirectionalLight, PointLight, SpotLight, serialization } from 'feng3d';
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

    private _onAddChild(event: IEvent<{ parent: GameObject; child: GameObject; }>)
    {
        const components = event.data.child.getComponentsInChildren();
        components.forEach((v) =>
        {
            this._addComponent(v);
        });
    }

    private _onRemoveChild(event: IEvent<{ parent: GameObject; child: GameObject; }>)
    {
        const components = event.data.child.getComponentsInChildren();
        components.forEach((v) =>
        {
            this._removeComponent(v);
        });
    }

    private _onAddComponent(event: IEvent<{ gameobject: GameObject; component: Component; }>)
    {
        this._addComponent(event.data.component);
    }

    private _onRemoveComponent(event: IEvent<{ gameobject: GameObject; component: Component; }>)
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
            const gameobject = new GameObject();
            gameobject.name = 'DirectionLightIcon';
            const directionLightIcon = gameobject.addComponent(DirectionLightIcon);
            directionLightIcon.light = component;
            directionLightIcon.editorCamera = this.editorCamera;
            this.gameObject.addChild(directionLightIcon.gameObject);
            this.directionLightIconMap.set(component, directionLightIcon);
        }
        else if (component instanceof PointLight)
        {
            const gameobject = new GameObject();
            gameobject.name = 'PointLightIcon';
            const pointLightIcon = gameobject.addComponent(PointLightIcon);
            pointLightIcon.light = component;
            pointLightIcon.editorCamera = this.editorCamera;
            this.gameObject.addChild(pointLightIcon.gameObject);
            this.pointLightIconMap.set(component, pointLightIcon);
        }
        else if (component instanceof SpotLight)
        {
            const gameobject = new GameObject();
            gameobject.name = 'SpotLightIcon';
            const spotLightIcon = gameobject.addComponent(SpotLightIcon);
            spotLightIcon.light = component;
            spotLightIcon.editorCamera = this.editorCamera;
            this.gameObject.addChild(spotLightIcon.gameObject);
            this.spotLightIconMap.set(component, spotLightIcon);
        }
        else if (component instanceof Camera)
        {
            const gameobject = new GameObject();
            gameobject.name = 'CameraIcon';
            const cameraIcon = gameobject.addComponent(CameraIcon);
            cameraIcon.camera = component;
            cameraIcon.editorCamera = this.editorCamera;
            this.gameObject.addChild(cameraIcon.gameObject);
            this.cameraIconMap.set(component, cameraIcon);
        }
    }

    private _removeComponent(component: Component)
    {
        if (component instanceof DirectionalLight)
        {
            serialization.setValue(this.directionLightIconMap.get(component), { light: null }).gameObject.remove();
            this.directionLightIconMap.delete(component);
        }
        else if (component instanceof PointLight)
        {
            serialization.setValue(this.pointLightIconMap.get(component), { light: null }).gameObject.remove();
            this.pointLightIconMap.delete(component);
        }
        else if (component instanceof SpotLight)
        {
            serialization.setValue(this.spotLightIconMap.get(component), { light: null }).gameObject.remove();
            this.spotLightIconMap.delete(component);
        }
        else if (component instanceof Camera)
        {
            serialization.setValue(this.cameraIconMap.get(component), { camera: null }).gameObject.remove();
            this.cameraIconMap.delete(component);
        }
    }

    private directionLightIconMap = new Map<DirectionalLight, DirectionLightIcon>();
    private pointLightIconMap = new Map<PointLight, PointLightIcon>();
    private spotLightIconMap = new Map<SpotLight, SpotLightIcon>();
    private cameraIconMap = new Map<Camera, CameraIcon>();
}

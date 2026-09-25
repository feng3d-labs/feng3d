import { RegisterComponent, PointLight, Camera, watcher, Object3D, BillboardComponent, MeshRenderer, PlaneGeometry, TextureMaterial, SegmentMaterial, PointMaterial, TextureUniforms, Texture2D, TextureFormat, serialization, HideFlags, Renderable, Vector3, Segment, Color4, SegmentGeometry, PointGeometry, shortcut, ticker, reactive, logic } from 'feng3d';
import { EditorData } from '../global/EditorData';
import { EditorScript } from './EditorScript';
import { setBlendEnabled } from '../utils/materialRenderState';

declare global
{
    export interface MixinsComponentMap { PointLightIcon: PointLightIcon; }
}

@RegisterComponent()
export class PointLightIcon extends EditorScript
{
    light: PointLight;

    get editorCamera() { return this._editorCamera; }
    set editorCamera(v) { this._editorCamera = v; this.initicon(); }
    private _editorCamera: Camera;

    init()
    {
        super.init();
        watcher.watch(this as PointLightIcon, 'light', this.onLightChanged, this);
        this.initicon();
        this.on('mousedown', this.onMousedown, this);
    }

    initicon()
    {
        if (!this._editorCamera) return;

        const lightIcon = this._lightIcon = new Object3D();
        lightIcon.name = 'PointLightIcon';
        const billboardComponent = lightIcon.addComponent(BillboardComponent);
        billboardComponent.camera = this.editorCamera;
        const meshRenderer = lightIcon.addComponent(MeshRenderer);
        const geometry = meshRenderer.geometry = new PlaneGeometry();
        geometry.width = 1;
        geometry.height = 1;
        geometry.segmentsW = 1;
        geometry.segmentsH = 1;
        geometry.yUp = false;
        const material = meshRenderer.material = new TextureMaterial();
        const texture = material.s_texture = new Texture2D();
        texture.source = { url: EditorData.editorData.getEditorAssetPath('assets/3d/icons/light.png') };
        texture.format = TextureFormat.RGBA;
        texture.premulAlpha = true;
        setBlendEnabled(material, true);
        this._textureMaterial = material;
        this.object3D.addChild(lightIcon);

        //
        const lightLines = this._lightLines = serialization.setValue(new Object3D(), {
            name: 'Lines', mouseEnabled: false, hideFlags: HideFlags.Hide,
        });
        {
            const mr = lightLines.addComponent(MeshRenderer);
            const segMat = mr.material = new SegmentMaterial();
            reactive(segMat.uniforms).u_segmentColor = new Color4(1, 1, 1, 0.5);
            mr.geometry = new SegmentGeometry();
        }
        this._segmentGeometry = <any>lightLines.getComponent(Renderable).geometry;
        this.object3D.addChild(lightLines);
        //
        const lightpoints = this._lightpoints = serialization.setValue(new Object3D(), {
            name: 'points', mouseEnabled: false, hideFlags: HideFlags.Hide,
        });
        {
            const mr = lightpoints.addComponent(MeshRenderer);
            mr.geometry = serialization.setValue(new PointGeometry(), {
                points: [
                    { position: new Vector3(1, 0, 0), color: new Color4(1, 0, 0, 1) },
                    { position: new Vector3(-1, 0, 0), color: new Color4(1, 0, 0, 1) },
                    { position: new Vector3(0, 1, 0), color: new Color4(0, 1, 0, 1) },
                    { position: new Vector3(0, -1, 0), color: new Color4(0, 1, 0, 1) },
                    { position: new Vector3(0, 0, 1), color: new Color4(0, 0, 1, 1) },
                    { position: new Vector3(0, 0, -1), color: new Color4(0, 0, 1, 1) },
                ],
            });
            mr.material = new PointMaterial();
        }
        this._pointGeometry = <any>lightpoints.getComponent(Renderable).geometry;
        this.object3D.addChild(lightpoints);

        this.enabled = true;
    }

    update()
    {
        if (!this.light) return;
        if (!this.editorCamera) return;

        reactive(this._textureMaterial.uniforms).u_color = this.light.color.toColor4() as any;
        {
            const r1 = reactive(this._lightLines.transform.scale);
            const r2 = reactive(this._lightpoints.transform.scale);
            r1.x = r2.x = this.light.range;
            r1.y = r2.y = this.light.range;
            r1.z = r2.z = this.light.range;
        }

        if (EditorData.editorData.selectedObject3Ds.indexOf(this.light.object3D) !== -1)
        {
            //
            const camerapos = logic(this.object3D.transform).world2localPoint(logic(this.editorCamera.object3D.transform).worldPosition.value);
            //
            const segments: Segment[] = [];
            let alpha = 1;
            const backalpha = 0.5;
            const num = 36;
            let point0: Vector3;
            let point1: Vector3;
            for (let i = 0; i < num; i++)
            {
                const angle = i * Math.PI * 2 / num;
                const x = Math.sin(angle);
                const y = Math.cos(angle);
                const angle1 = (i + 1) * Math.PI * 2 / num;
                const x1 = Math.sin(angle1);
                const y1 = Math.cos(angle1);
                //
                point0 = new Vector3(0, x, y);
                point1 = new Vector3(0, x1, y1);
                if (point0.dot(camerapos) < 0 || point1.dot(camerapos) < 0)
                { alpha = backalpha; }
                else
                { alpha = 1.0; }
                segments.push({ start: point0, end: point1, startColor: new Color4(1, 0, 0, alpha), endColor: new Color4(1, 0, 0, alpha) });
                point0 = new Vector3(x, 0, y);
                point1 = new Vector3(x1, 0, y1);
                if (point0.dot(camerapos) < 0 || point1.dot(camerapos) < 0)
                { alpha = backalpha; }
                else
                { alpha = 1.0; }
                segments.push({ start: point0, end: point1, startColor: new Color4(0, 1, 0, alpha), endColor: new Color4(0, 1, 0, alpha) });
                point0 = new Vector3(x, y, 0);
                point1 = new Vector3(x1, y1, 0);
                if (point0.dot(camerapos) < 0 || point1.dot(camerapos) < 0)
                { alpha = backalpha; }
                else
                { alpha = 1.0; }
                segments.push({ start: point0, end: point1, startColor: new Color4(0, 0, 1, alpha), endColor: new Color4(0, 0, 1, alpha) });
            }
            this._segmentGeometry.segments = segments;

            this._pointGeometry.points = [];
            let point = new Vector3(1, 0, 0);
            if (point.dot(camerapos) < 0)
            { alpha = backalpha; }
            else
            { alpha = 1.0; }
            this._pointGeometry.points.push({ position: point, color: new Color4(1, 0, 0, alpha) });
            point = new Vector3(-1, 0, 0);
            if (point.dot(camerapos) < 0)
            { alpha = backalpha; }
            else
            { alpha = 1.0; }
            this._pointGeometry.points.push({ position: point, color: new Color4(1, 0, 0, alpha) });
            point = new Vector3(0, 1, 0);
            if (point.dot(camerapos) < 0)
            { alpha = backalpha; }
            else
            { alpha = 1.0; }
            this._pointGeometry.points.push({ position: point, color: new Color4(0, 1, 0, alpha) });
            point = new Vector3(0, -1, 0);
            if (point.dot(camerapos) < 0)
            { alpha = backalpha; }
            else
            { alpha = 1.0; }
            this._pointGeometry.points.push({ position: point, color: new Color4(0, 1, 0, alpha) });
            point = new Vector3(0, 0, 1);
            if (point.dot(camerapos) < 0)
            { alpha = backalpha; }
            else
            { alpha = 1.0; }
            this._pointGeometry.points.push({ position: point, color: new Color4(0, 0, 1, alpha) });
            point = new Vector3(0, 0, -1);
            if (point.dot(camerapos) < 0)
            { alpha = backalpha; }
            else
            { alpha = 1.0; }
            this._pointGeometry.points.push({ position: point, color: new Color4(0, 0, 1, alpha) });
            //
            this._lightLines.activeSelf = true;
            this._lightpoints.activeSelf = true;
        }
        else
        {
            this._lightLines.activeSelf = false;
            this._lightpoints.activeSelf = false;
        }
    }

    dispose()
    {
        this.enabled = false;
        this._textureMaterial = null;
        //
        this._lightIcon.dispose();
        this._lightLines.dispose();
        this._lightpoints.dispose();
        this._lightIcon = null;
        this._lightLines = null;
        this._lightpoints = null;
        this._segmentGeometry = null;
        super.dispose();
    }

    //
    private _lightIcon: Object3D;
    private _lightLines: Object3D;
    private _lightpoints: Object3D;
    private _textureMaterial: TextureMaterial;
    private _segmentGeometry: SegmentGeometry;
    private _pointGeometry: PointGeometry;

    private onLightChanged(newValue: PointLight, oldValue: PointLight)
    {
        if (oldValue)
        {
            oldValue.off('scenetransformChanged', this.onScenetransformChanged, this);
        }
        if (newValue)
        {
            this.onScenetransformChanged();
            newValue.on('scenetransformChanged', this.onScenetransformChanged, this);
        }
    }

    private onScenetransformChanged()
    {
        logic(this.transform).setLocal2world(logic(this.light.transform).local2world.value.clone());
    }

    private onMousedown()
    {
        EditorData.editorData.selectObject(this.light.object3D);
        // 防止再次调用鼠标拾取
        shortcut.activityState('selectInvalid');
        ticker.once(100, () =>
        {
            shortcut.deactivityState('selectInvalid');
        });
    }
}

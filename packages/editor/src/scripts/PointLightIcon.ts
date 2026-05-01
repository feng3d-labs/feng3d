import { RegisterComponent, PointLight, Camera, watcher, GameObject, BillboardComponent, MeshRenderer, PlaneGeometry, Material, TextureUniforms, Texture2D, TextureFormat, serialization, HideFlags, RenderMode, Renderable, Vector3, Segment, Color4, SegmentGeometry, PointGeometry, shortcut, ticker } from 'feng3d';
import { EditorData } from '../global/EditorData';
import { EditorScript } from './EditorScript';

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

        const lightIcon = this._lightIcon = new GameObject();
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
        const material = meshRenderer.material = new Material();
        material.shaderName = 'texture';
        const uniforms = material.uniforms as TextureUniforms;
        const texture = uniforms.s_texture = new Texture2D();
        texture.source = { url: EditorData.editorData.getEditorAssetPath('assets/3d/icons/light.png') };
        texture.format = TextureFormat.RGBA;
        texture.premulAlpha = true;
        material.renderParams.enableBlend = true;
        this._textureMaterial = material;
        this.gameObject.addChild(lightIcon);

        //
        const lightLines = this._lightLines = serialization.setValue(new GameObject(), {
            name: 'Lines', mouseEnabled: false, hideFlags: HideFlags.Hide,
            components: [{
                __class__: 'MeshRenderer', material: {
                    __class__: 'Material',
                    shaderName: 'segment',
                    uniforms: {
                        u_segmentColor: { __class__: 'Color4', r: 1, g: 1, b: 1, a: 0.5 },
                    }, renderParams: { renderMode: RenderMode.LINES, enableBlend: true }
                },
                geometry: { __class__: 'SegmentGeometry' },
            }]
        });
        this._segmentGeometry = <any>lightLines.getComponent(Renderable).geometry;
        this.gameObject.addChild(lightLines);
        //
        const lightpoints = this._lightpoints = serialization.setValue(new GameObject(), {
            name: 'points', mouseEnabled: false, hideFlags: HideFlags.Hide,
            components: [{
                __class__: 'MeshRenderer',
                geometry: {
                    __class__: 'PointGeometry',
                    points: [
                        { position: { __class__: 'Vector3', x: 1 }, color: { __class__: 'Color4', r: 1 } },
                        { position: { __class__: 'Vector3', x: -1 }, color: { __class__: 'Color4', r: 1 } },
                        { position: { __class__: 'Vector3', y: 1 }, color: { __class__: 'Color4', g: 1 } },
                        { position: { __class__: 'Vector3', y: -1 }, color: { __class__: 'Color4', g: 1 } },
                        { position: { __class__: 'Vector3', z: 1 }, color: { __class__: 'Color4', b: 1 } },
                        { position: { __class__: 'Vector3', z: -1 }, color: { __class__: 'Color4', b: 1 } }],
                },
                material: {
                    __class__: 'Material', shaderName: 'point', uniforms: { u_PointSize: 5 }, renderParams: { renderMode: RenderMode.POINTS, enableBlend: true },
                },
            }],
        });
        this._pointGeometry = <any>lightpoints.getComponent(Renderable).geometry;
        this.gameObject.addChild(lightpoints);

        this.enabled = true;
    }

    update()
    {
        if (!this.light) return;
        if (!this.editorCamera) return;

        (this._textureMaterial.uniforms as TextureUniforms).u_color = this.light.color.toColor4() as any;
        this._lightLines.transform.scale
            = this._lightpoints.transform.scale
            = new Vector3(this.light.range, this.light.range, this.light.range);

        if (EditorData.editorData.selectedGameObjects.indexOf(this.light.gameObject) !== -1)
        {
            //
            const camerapos = this.gameObject.transform.worldToLocalPoint(this.editorCamera.gameObject.transform.worldPosition);
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
    private _lightIcon: GameObject;
    private _lightLines: GameObject;
    private _lightpoints: GameObject;
    private _textureMaterial: Material;
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
        this.transform.localToWorldMatrix = this.light.transform.localToWorldMatrix;
    }

    private onMousedown()
    {
        EditorData.editorData.selectObject(this.light.gameObject);
        // 防止再次调用鼠标拾取
        shortcut.activityState('selectInvalid');
        ticker.once(100, () =>
        {
            shortcut.deactivityState('selectInvalid');
        });
    }
}

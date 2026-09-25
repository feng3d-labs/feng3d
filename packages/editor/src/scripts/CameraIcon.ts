import { RegisterComponent, Camera, watcher, Object3D, BillboardComponent, MeshRenderer, TextureMaterial, SegmentMaterial, PointMaterial, Texture2D, TextureFormat, PlaneGeometry, HideFlags, SegmentUniforms, Color4, SegmentGeometry, PointUniforms, PointGeometry, PointInfo, Segment, PerspectiveLens, OrthographicLens, Vector3, shortcut, ticker, reactive, transformLogic } from 'feng3d';
import { EditorData } from '../global/EditorData';
import { EditorScript } from './EditorScript';
import { setBlendEnabled, setDepthWrite } from '../utils/materialRenderState';

declare global
{
    export interface MixinsComponentMap { CameraIcon: CameraIcon; }
}

@RegisterComponent()
export class CameraIcon extends EditorScript
{
    camera: Camera;

    get editorCamera() { return this._editorCamera; }
    set editorCamera(v) { this._editorCamera = v; this.initicon(); }
    private _editorCamera: Camera;

    init()
    {
        super.init();
        watcher.watch(this as CameraIcon, 'camera', this.onCameraChanged, this);
        this.initicon();
        this.on('mousedown', this.onMousedown, this);
    }

    initicon()
    {
        if (!this.editorCamera) return;
        if (this._lightIcon) return;

        {
            const lightIcon = this._lightIcon = new Object3D();
            lightIcon.name = 'CameraIcon';
            const billboardComponent = lightIcon.addComponent(BillboardComponent);
            billboardComponent.camera = this.editorCamera;
            const meshRenderer = lightIcon.addComponent(MeshRenderer);
            const material = meshRenderer.material = new TextureMaterial();
            material.s_texture = new Texture2D();
            material.s_texture.source = { url: EditorData.editorData.getEditorAssetPath('assets/3d/icons/camera.png') };
            material.s_texture.format = TextureFormat.RGBA;
            setBlendEnabled(material, true);
            setDepthWrite(material, false);
            const geometry = meshRenderer.geometry = new PlaneGeometry();
            geometry.width = 1;
            geometry.height = 1;
            geometry.segmentsW = 1;
            geometry.segmentsH = 1;
            geometry.yUp = false;
            this.object3D.addChild(lightIcon);
        }

        //
        {
            const lightLines = this._lightLines = new Object3D();
            lightLines.name = 'Lines';
            lightLines.mouseEnabled = false;
            lightLines.hideFlags = HideFlags.Hide;
            const meshRenderer = lightLines.addComponent(MeshRenderer);
            const material = meshRenderer.material = new SegmentMaterial();
            reactive(material.uniforms).u_segmentColor = new Color4(1, 1, 1, 0.5);
            setBlendEnabled(material, true);
            meshRenderer.geometry = new SegmentGeometry();
            this._segmentGeometry = meshRenderer.geometry;
            this.object3D.addChild(lightLines);
        }

        //
        {
            const lightpoints = this._lightpoints = new Object3D();
            lightpoints.name = 'points';
            lightpoints.mouseEnabled = false;
            lightpoints.hideFlags = HideFlags.Hide;
            const meshRenderer = lightpoints.addComponent(MeshRenderer);
            const material = meshRenderer.material = new PointMaterial();
            setBlendEnabled(material, true);
            meshRenderer.geometry = new PointGeometry();
            this._pointGeometry = meshRenderer.geometry;
            this.object3D.addChild(lightpoints);
        }

        this.enabled = true;
    }

    update()
    {
        if (!this.camera) return;

        if (EditorData.editorData.selectedObject3Ds.indexOf(this.camera.object3D) !== -1)
        {
            if (this._lensChanged)
            {
                //
                const points: PointInfo[] = [];
                const segments: Partial<Segment>[] = [];
                const lens = this.camera.lens;
                const near = lens.near;
                const far = lens.far;
                const aspect = lens.aspect;
                let nearLeft: number;
                let nearRight: number;
                let nearTop: number;
                let nearBottom: number;
                let farLeft: number;
                let farRight: number;
                let farTop: number;
                let farBottom: number;
                if (lens instanceof PerspectiveLens)
                {
                    const fov = lens.fov;
                    const tan = Math.tan(fov * Math.PI / 360);
                    //
                    nearLeft = -tan * near * aspect;
                    nearRight = tan * near * aspect;
                    nearTop = tan * near;
                    nearBottom = -tan * near;
                    farLeft = -tan * far * aspect;
                    farRight = tan * far * aspect;
                    farTop = tan * far;
                    farBottom = -tan * far;
                    //
                }
                else if (lens instanceof OrthographicLens)
                {
                    // 正交投影视锥是方盒，near/far 平面边界相同
                    nearLeft = lens.left;
                    nearRight = lens.right;
                    nearTop = lens.top;
                    nearBottom = lens.bottom;
                    farLeft = lens.left;
                    farRight = lens.right;
                    farTop = lens.top;
                    farBottom = lens.bottom;
                }
                points.push({ position: new Vector3(0, farBottom, far) }, { position: new Vector3(0, farTop, far) }, { position: new Vector3(farLeft, 0, far) }, { position: new Vector3(farRight, 0, far) });
                segments.push(
                    { start: new Vector3(nearLeft, nearBottom, near), end: new Vector3(nearRight, nearBottom, near) },
                    { start: new Vector3(nearLeft, nearBottom, near), end: new Vector3(nearLeft, nearTop, near) },
                    { start: new Vector3(nearLeft, nearTop, near), end: new Vector3(nearRight, nearTop, near) },
                    { start: new Vector3(nearRight, nearBottom, near), end: new Vector3(nearRight, nearTop, near) },
                    //
                    { start: new Vector3(nearLeft, nearBottom, near), end: new Vector3(farLeft, farBottom, far) },
                    { start: new Vector3(nearLeft, nearTop, near), end: new Vector3(farLeft, farTop, far) },
                    { start: new Vector3(nearRight, nearBottom, near), end: new Vector3(farRight, farBottom, far) },
                    { start: new Vector3(nearRight, nearTop, near), end: new Vector3(farRight, farTop, far) },
                    //
                    { start: new Vector3(farLeft, farBottom, far), end: new Vector3(farRight, farBottom, far) },
                    { start: new Vector3(farLeft, farBottom, far), end: new Vector3(farLeft, farTop, far) },
                    { start: new Vector3(farLeft, farTop, far), end: new Vector3(farRight, farTop, far) },
                    { start: new Vector3(farRight, farBottom, far), end: new Vector3(farRight, farTop, far) },
                );
                this._pointGeometry.points = points;
                this._segmentGeometry.segments.length = 0;
                segments.forEach((v) =>
                {
                    this._segmentGeometry.addSegment(v);
                });
                this._lensChanged = false;
            }
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
    private _segmentGeometry: SegmentGeometry;
    private _pointGeometry: PointGeometry;
    private _lensChanged = true;

    private onCameraChanged(newValue: Camera, oldValue: Camera)
    {
        if (oldValue)
        {
            oldValue.off('scenetransformChanged', this.onScenetransformChanged, this);
            oldValue.off('lensChanged', this.onLensChanged, this);
        }
        if (newValue)
        {
            this.onScenetransformChanged();
            newValue.on('scenetransformChanged', this.onScenetransformChanged, this);
            newValue.on('lensChanged', this.onLensChanged, this);
        }
    }

    private onLensChanged()
    {
        this._lensChanged = true;
    }

    private onScenetransformChanged()
    {
        transformLogic(this.transform).setLocal2world(transformLogic(this.camera.transform).local2world.value.clone());
    }

    private onMousedown()
    {
        EditorData.editorData.selectObject(this.camera.object3D);
        // 防止再次调用鼠标拾取
        shortcut.activityState('selectInvalid');
        ticker.once(100, () =>
        {
            shortcut.deactivityState('selectInvalid');
        });
    }
}

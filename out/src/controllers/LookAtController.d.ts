declare namespace feng3d {
    class LookAtController extends ControllerBase {
        protected _lookAtPosition: Vector3D;
        protected _lookAtObject: GameObject;
        protected _origin: Vector3D;
        protected _upAxis: Vector3D;
        protected _pos: Vector3D;
        constructor(target?: GameObject, lookAtObject?: GameObject);
        upAxis: Vector3D;
        lookAtPosition: Vector3D;
        lookAtObject: GameObject;
        update(interpolate?: boolean): void;
    }
}

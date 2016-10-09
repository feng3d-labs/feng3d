module feng3d {
    export class LookAtController extends ControllerBase {
        protected _lookAtPosition: Vector3D;
        protected _lookAtObject: Object3D;
        protected _origin: Vector3D = new Vector3D(0.0, 0.0, 0.0);
        protected _upAxis: Vector3D = Vector3D.Y_AXIS;
        private _pos: Vector3D = new Vector3D();

        constructor(targetObject: Object3D = null, lookAtObject: Object3D = null) {
            super(targetObject);

            if (lookAtObject)
                this.lookAtObject = lookAtObject;
            else
                this.lookAtPosition = new Vector3D();
        }

        public get upAxis(): Vector3D {
            return this._upAxis;
        }

        public set upAxis(upAxis: Vector3D) {
            this._upAxis = upAxis;
        }

        public get lookAtPosition(): Vector3D {
            return this._lookAtPosition;
        }

        public set lookAtPosition(val:Vector3D) {
            this._lookAtPosition = val;
        }

        public get lookAtObject(): Object3D {
            return this._lookAtObject;
        }

        public set lookAtObject(value: Object3D) {
            if (this._lookAtObject == value)
                return;

            this._lookAtObject = value;    
        }

        public update(interpolate: boolean = true): void {
            if (this._targetObject) {
                if (this._lookAtPosition) {
                    this._targetObject.space3D.lookAt(this.lookAtPosition, this._upAxis);
                } 
                else if (this._lookAtObject) {
                    this._pos.x = this._lookAtObject.space3D.x;
                    this._pos.y = this._lookAtObject.space3D.y;
                    this._pos.z = this._lookAtObject.space3D.z;
                    this._targetObject.space3D.lookAt(this._pos, this._upAxis);
                }
            }
        }
    }
}

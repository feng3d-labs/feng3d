declare namespace feng3d {
    class HoldSizeComponent extends Component {
        /**
         * 保持缩放尺寸
         */
        holdSize: number;
        /**
         * 相对
         */
        camera: Camera;
        private _holdSize;
        private _camera;
        constructor(gameobject: GameObject);
        private invalidateSceneTransform();
        private updateLocalToWorldMatrix();
        private getDepthScale(camera);
        dispose(): void;
    }
}

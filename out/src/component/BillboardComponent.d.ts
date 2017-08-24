declare namespace feng3d {
    class BillboardComponent extends Component {
        /**
         * 相对
         */
        camera: Camera;
        private _holdSize;
        private _camera;
        constructor(gameobject: GameObject);
        private invalidHoldSizeMatrix();
        private updateLocalToWorldMatrix();
        dispose(): void;
    }
}

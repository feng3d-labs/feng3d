module feng3d {

    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    export class FPSController {

        /**
         * 按键记录
         */
        private keyDownDic: { [key: string]: boolean } = {};

        /**
         * 按键方向字典
         */
        private keyDirectionDic = {};

        /**
         * 加速度
         */
        private acceleration = 0.2;

        /**
         * 速度
         */
        private velocity = new Vector3D();

        /**
         * 控制对象
         */
        private _target: Transform;

        /**
         * 上次鼠标位置
         */
        private preMousePoint: { x: number, y: number };

        constructor(transform: Transform) {
            this._target = transform;
            this.init();
        }

        public get target() {
            return this._target;
        }

        public set target(value: Transform) {

            if (this._target != null) {
                window.removeEventListener("keydown", this.onKeydown.bind(this));
                window.removeEventListener("keyup", this.onKeyup.bind(this));
                window.removeEventListener("mousemove", this.onMouseMove.bind(this));
            }
            this._target = value;
            if (this._target != null) {
                window.addEventListener("keydown", this.onKeydown.bind(this));
                window.addEventListener("keyup", this.onKeyup.bind(this));
                window.addEventListener("mousemove", this.onMouseMove.bind(this));
                this.preMousePoint = null;
                this.velocity.setTo(0, 0, 0);
                this.keyDownDic = {};
            }
        }

        /**
         * 初始化
         */
        private init() {

            this.keyDirectionDic["a"] = new Vector3D(-1, 0, 0);//左
            this.keyDirectionDic["d"] = new Vector3D(1, 0, 0);//右
            this.keyDirectionDic["w"] = new Vector3D(0, 0, 1);//前
            this.keyDirectionDic["s"] = new Vector3D(0, 0, -1);//后
            this.keyDirectionDic["e"] = new Vector3D(0, 1, 0);//上
            this.keyDirectionDic["q"] = new Vector3D(0, -1, 0);//下
        }

        /**
         * 手动应用更新到目标3D对象
         */
        public update(interpolate: boolean = true): void {

            //计算加速度
            var accelerationVec = new Vector3D();
            for (var key in this.keyDirectionDic) {
                if (this.keyDirectionDic.hasOwnProperty(key)) {
                    var element = this.keyDirectionDic[key];
                    accelerationVec.incrementBy(element);
                }
            }
            accelerationVec.scaleBy(this.acceleration);
            //计算速度
            this.velocity.incrementBy(accelerationVec);
            var right = this.target.matrix3d.right;
            var up = this.target.matrix3d.up;
            var forward = this.target.matrix3d.forward;
            right.scaleBy(this.velocity.x);
            up.scaleBy(this.velocity.y);
            forward.scaleBy(this.velocity.z);
            //计算位移
            var displacement = right.clone();
            displacement.incrementBy(up);
            displacement.incrementBy(forward);
            this.target.x += displacement.x;
            this.target.y += displacement.y;
            this.target.z += displacement.x;
        }

        /**
         * 处理鼠标移动事件
         */
        private onMouseMove(event: MouseEvent) {

            if (this.preMousePoint == null) {
                this.preMousePoint = { x: event.clientX, y: event.clientX };
                return;
            }
            //计算旋转
            var offsetPoint = { x: event.clientX - this.preMousePoint.x, y: event.clientY - this.preMousePoint.y };
            var matrix3d = this.target.matrix3d;
            var right = matrix3d.right;
            var position = matrix3d.position;
            matrix3d.appendRotation(offsetPoint.y, right, position);
            matrix3d.appendRotation(offsetPoint.x, Vector3D.Y_AXIS, position);
            this.target.matrix3d = matrix3d;
            //
            this.preMousePoint = { x: event.clientX, y: event.clientX };
        }

        /**
		 * 键盘按下事件
		 */
        private onKeydown(event: KeyboardEvent): void {

            if (!this.keyDownDic[event.keyCode])
                this.stopDirectionVelocity(this.keyDirectionDic[event.keyCode]);
            this.keyDownDic[event.keyCode] = true;
        }

		/**
		 * 键盘弹起事件
		 */
        private onKeyup(event: KeyboardEvent): void {

            this.keyDownDic[event.keyCode] = false;
            this.stopDirectionVelocity(this.keyDirectionDic[event.keyCode]);
        }

        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        private stopDirectionVelocity(direction: Vector3D) {

            if (direction == null)
                return;
            if (direction.x != 0) {
                this.velocity.x = 0;
            }
            if (direction.y != 0) {
                this.velocity.y = 0;
            }
            if (direction.z != 0) {
                this.velocity.z = 0;
            }
        }
    }
}
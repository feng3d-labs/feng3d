module feng3d
{

    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    export class FPSController extends ControllerBase
    {

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
        private velocity: Vector3D;

        /**
         * 上次鼠标位置
         */
        private preMousePoint: Point;

        constructor(transform: Object3D = null)
        {
            super(transform);
            this.init();
        }

        public get target(): Object3D
        {
            return this._target;
        }

        public set target(value: Object3D)
        {
            
            
            if (this._target != null)
            {
                input.removeEventListener(inputType.KEY_DOWN, this.onKeydown, this);
                input.removeEventListener(inputType.KEY_UP, this.onKeyup, this);
                input.removeEventListener(inputType.MOUSE_MOVE, this.onMouseMove, this);
            }
            this._target = value;
            if (this._target != null)
            {
                input.addEventListener(inputType.KEY_DOWN, this.onKeydown, this);
                input.addEventListener(inputType.KEY_UP, this.onKeyup, this);
                input.addEventListener(inputType.MOUSE_MOVE, this.onMouseMove, this);
                this.preMousePoint = null;
                this.velocity = new Vector3D();
                this.keyDownDic = {};
            }
        }

        /**
         * 初始化
         */
        private init()
        {

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
        public update(interpolate: boolean = true): void
        {

            if (this.target == null)
                return;

            //计算加速度
            var accelerationVec = new Vector3D();
            for (var key in this.keyDirectionDic)
            {
                if (this.keyDownDic[key] == true)
                {
                    var element = this.keyDirectionDic[key];
                    accelerationVec.incrementBy(element);
                }
            }
            accelerationVec.scaleBy(this.acceleration);
            //计算速度
            this.velocity.incrementBy(accelerationVec);
            var right = this.target.rightVector;
            var up = this.target.upVector;
            var forward = this.target.forwardVector;
            right.scaleBy(this.velocity.x);
            up.scaleBy(this.velocity.y);
            forward.scaleBy(this.velocity.z);
            //计算位移
            var displacement = right.clone();
            displacement.incrementBy(up);
            displacement.incrementBy(forward);
            this.target.x += displacement.x;
            this.target.y += displacement.y;
            this.target.z += displacement.z;
        }

        /**
         * 处理鼠标移动事件
         */
        private onMouseMove(event: InputEvent)
        {
            if (this.target == null)
                return;

            
            var mousePoint = new Point(input.clientX, input.clientY);

            if (this.preMousePoint == null)
            {
                this.preMousePoint = mousePoint;
                return;
            }
            //计算旋转
            var offsetPoint = mousePoint.subtract(this.preMousePoint)
            offsetPoint.x *= 0.15;
            offsetPoint.y *= 0.15;
            var matrix3d = this.target.transform;
            var right = matrix3d.right;
            var position = matrix3d.position;
            matrix3d.appendRotation(offsetPoint.y, right, position);
            matrix3d.appendRotation(offsetPoint.x, Vector3D.Y_AXIS, position);
            this.target.transform = matrix3d;
            //
            this.preMousePoint = mousePoint;
        }

        /**
		 * 键盘按下事件
		 */
        private onKeydown(event: InputEvent): void
        {

            var boardKey = String.fromCharCode(event.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;

            if (!this.keyDownDic[boardKey])
                this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
            this.keyDownDic[boardKey] = true;
        }

		/**
		 * 键盘弹起事件
		 */
        private onKeyup(event: InputEvent): void
        {
            var boardKey = String.fromCharCode(event.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;

            this.keyDownDic[boardKey] = false;
            this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
        }

        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        private stopDirectionVelocity(direction: Vector3D)
        {

            if (direction == null)
                return;
            if (direction.x != 0)
            {
                this.velocity.x = 0;
            }
            if (direction.y != 0)
            {
                this.velocity.y = 0;
            }
            if (direction.z != 0)
            {
                this.velocity.z = 0;
            }
        }
    }
}
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var feng3d;
(function (feng3d) {
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    var FPSController = (function (_super) {
        __extends(FPSController, _super);
        function FPSController(gameobject) {
            var _this = _super.call(this, gameobject) || this;
            _this.ischange = false;
            return _this;
        }
        Object.defineProperty(FPSController.prototype, "auto", {
            get: function () {
                return this._auto;
            },
            set: function (value) {
                if (this._auto == value)
                    return;
                if (this._auto) {
                    feng3d.input.off("mousedown", this.onMousedown, this);
                    feng3d.input.off("mouseup", this.onMouseup, this);
                    this.onMouseup();
                }
                this._auto = value;
                if (this._auto) {
                    feng3d.input.on("mousedown", this.onMousedown, this);
                    feng3d.input.on("mouseup", this.onMouseup, this);
                }
            },
            enumerable: true,
            configurable: true
        });
        FPSController.prototype.onMousedown = function () {
            this.ischange = true;
            this.preMousePoint = null;
            this.velocity = new feng3d.Vector3D();
            this.keyDownDic = {};
            feng3d.input.on("keydown", this.onKeydown, this);
            feng3d.input.on("keyup", this.onKeyup, this);
            feng3d.input.on("mousemove", this.onMouseMove, this);
        };
        FPSController.prototype.onMouseup = function () {
            this.ischange = false;
            feng3d.input.off("keydown", this.onKeydown, this);
            feng3d.input.off("keyup", this.onKeyup, this);
            feng3d.input.off("mousemove", this.onMouseMove, this);
        };
        /**
         * 初始化
         */
        FPSController.prototype.init = function () {
            this.keyDirectionDic = {};
            this.keyDirectionDic["a"] = new feng3d.Vector3D(-1, 0, 0); //左
            this.keyDirectionDic["d"] = new feng3d.Vector3D(1, 0, 0); //右
            this.keyDirectionDic["w"] = new feng3d.Vector3D(0, 0, 1); //前
            this.keyDirectionDic["s"] = new feng3d.Vector3D(0, 0, -1); //后
            this.keyDirectionDic["e"] = new feng3d.Vector3D(0, 1, 0); //上
            this.keyDirectionDic["q"] = new feng3d.Vector3D(0, -1, 0); //下
            this.keyDownDic = {};
            this.acceleration = 0.05;
            this.auto = true;
            this.enabled = true;
        };
        /**
         * 销毁
         */
        FPSController.prototype.dispose = function () {
            this.auto = false;
        };
        /**
         * 手动应用更新到目标3D对象
         */
        FPSController.prototype.update = function () {
            if (!this.ischange)
                return;
            //计算加速度
            var accelerationVec = new feng3d.Vector3D();
            for (var key in this.keyDirectionDic) {
                if (this.keyDownDic[key] == true) {
                    var element = this.keyDirectionDic[key];
                    accelerationVec.incrementBy(element);
                }
            }
            accelerationVec.scaleBy(this.acceleration);
            //计算速度
            this.velocity.incrementBy(accelerationVec);
            var right = this.transform.rightVector;
            var up = this.transform.upVector;
            var forward = this.transform.forwardVector;
            right.scaleBy(this.velocity.x);
            up.scaleBy(this.velocity.y);
            forward.scaleBy(this.velocity.z);
            //计算位移
            var displacement = right.clone();
            displacement.incrementBy(up);
            displacement.incrementBy(forward);
            this.transform.x += displacement.x;
            this.transform.y += displacement.y;
            this.transform.z += displacement.z;
        };
        /**
         * 处理鼠标移动事件
         */
        FPSController.prototype.onMouseMove = function (event) {
            var mousePoint = new feng3d.Point(feng3d.input.clientX, feng3d.input.clientY);
            if (this.preMousePoint == null) {
                this.preMousePoint = mousePoint;
                return;
            }
            //计算旋转
            var offsetPoint = mousePoint.subtract(this.preMousePoint);
            offsetPoint.x *= 0.15;
            offsetPoint.y *= 0.15;
            // this.targetObject.transform.rotate(Vector3D.X_AXIS, offsetPoint.y, this.targetObject.transform.position);
            // this.targetObject.transform.rotate(Vector3D.Y_AXIS, offsetPoint.x, this.targetObject.transform.position);
            var matrix3d = this.transform.localToWorldMatrix;
            matrix3d.appendRotation(matrix3d.right, offsetPoint.y, matrix3d.position);
            var up = feng3d.Vector3D.Y_AXIS;
            if (matrix3d.up.dotProduct(up) < 0) {
                up = up.clone();
                up.scaleBy(-1);
            }
            matrix3d.appendRotation(up, offsetPoint.x, matrix3d.position);
            this.transform.localToWorldMatrix = matrix3d;
            //
            this.preMousePoint = mousePoint;
        };
        /**
         * 键盘按下事件
         */
        FPSController.prototype.onKeydown = function (event) {
            var inputEvent = event.data;
            var boardKey = String.fromCharCode(inputEvent.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;
            if (!this.keyDownDic[boardKey])
                this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
            this.keyDownDic[boardKey] = true;
        };
        /**
         * 键盘弹起事件
         */
        FPSController.prototype.onKeyup = function (event) {
            var inputEvent = event.data;
            var boardKey = String.fromCharCode(inputEvent.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;
            this.keyDownDic[boardKey] = false;
            this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
        };
        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        FPSController.prototype.stopDirectionVelocity = function (direction) {
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
        };
        return FPSController;
    }(feng3d.Script));
    feng3d.FPSController = FPSController;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=FPSController.js.map
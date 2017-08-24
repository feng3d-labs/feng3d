var feng3d;
(function (feng3d) {
    /**
     * 骨骼数据
     * @author feng 2014-5-20
     */
    var Skeleton = (function () {
        function Skeleton() {
            this.joints = [];
        }
        Object.defineProperty(Skeleton.prototype, "numJoints", {
            get: function () {
                return this.joints.length;
            },
            enumerable: true,
            configurable: true
        });
        return Skeleton;
    }());
    feng3d.Skeleton = Skeleton;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Skeleton.js.map
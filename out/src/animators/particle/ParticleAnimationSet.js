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
    var ParticleAnimationSet = (function (_super) {
        __extends(ParticleAnimationSet, _super);
        function ParticleAnimationSet() {
            var _this = _super.call(this) || this;
            /**
             * 属性数据列表
             */
            _this._attributes = {};
            _this._animations = [];
            /**
             * 生成粒子函数列表，优先级越高先执行
             */
            _this.generateFunctions = [];
            _this.particleGlobal = {};
            /**
             * 粒子数量
             */
            _this.numParticles = 1000;
            _this._isDirty = true;
            _this.createInstanceCount(function () { return _this.numParticles; });
            return _this;
        }
        /**
         * 粒子全局属性，作用于所有粒子元素
         */
        ParticleAnimationSet.prototype.setGlobal = function (property, value) {
            this.particleGlobal[property] = value;
            this.createUniformData(("u_particle_" + property), value);
            this.createBoolMacro(("D_u_particle_" + property), true);
        };
        ParticleAnimationSet.prototype.addAnimation = function (animation) {
            if (this._animations.indexOf(animation) == -1)
                this._animations.push(animation);
        };
        ParticleAnimationSet.prototype.update = function (particleAnimator) {
            if (this._isDirty) {
                this.generateParticles();
                this._isDirty = false;
            }
            this._animations.forEach(function (element) {
                element.setRenderState(particleAnimator);
            });
        };
        /**
         * 生成粒子
         */
        ParticleAnimationSet.prototype.generateParticles = function () {
            var generateFunctions = this.generateFunctions.concat();
            var components = this._animations;
            components.forEach(function (element) {
                generateFunctions.push({ generate: element.generateParticle.bind(element), priority: element.priority });
            });
            //按优先级排序，优先级越高先执行
            generateFunctions.sort(function (a, b) { return b.priority - a.priority; });
            //
            for (var i = 0; i < this.numParticles; i++) {
                var particle = {};
                particle.index = i;
                particle.total = this.numParticles;
                generateFunctions.forEach(function (element) {
                    element.generate(particle);
                });
                this.collectionParticle(particle);
            }
            //更新宏定义
            for (var attribute in this._attributes) {
                this.createBoolMacro(("D_" + attribute), true);
            }
        };
        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        ParticleAnimationSet.prototype.collectionParticle = function (particle) {
            for (var attribute in particle) {
                this.collectionParticleAttribute(attribute, particle);
            }
        };
        /**
         * 收集粒子属性数据
         * @param attributeID       属性编号
         * @param index             粒子编号
         * @param data              属性数据
         */
        ParticleAnimationSet.prototype.collectionParticleAttribute = function (attribute, particle) {
            var attributeID = "a_particle_" + attribute;
            var data = particle[attribute];
            var index = particle.index;
            var numParticles = particle.total;
            //
            var attributeRenderData = this._attributes[attributeID];
            var vector3DData;
            if (typeof data == "number") {
                if (!attributeRenderData) {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(attributeID, new Float32Array(numParticles), 1, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index] = data;
            }
            else if (data instanceof feng3d.Vector3D) {
                if (!attributeRenderData) {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(attributeID, new Float32Array(numParticles * 3), 3, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 3] = data.x;
                vector3DData[index * 3 + 1] = data.y;
                vector3DData[index * 3 + 2] = data.z;
            }
            else if (data instanceof feng3d.Color) {
                if (!attributeRenderData) {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(attributeID, new Float32Array(numParticles * 4), 4, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 4] = data.r;
                vector3DData[index * 4 + 1] = data.g;
                vector3DData[index * 4 + 2] = data.b;
                vector3DData[index * 4 + 3] = data.a;
            }
            else {
                throw new Error("\u65E0\u6CD5\u5904\u7406" + feng3d.ClassUtils.getQualifiedClassName(data) + "\u7C92\u5B50\u5C5E\u6027");
            }
        };
        return ParticleAnimationSet;
    }(feng3d.RenderDataHolder));
    feng3d.ParticleAnimationSet = ParticleAnimationSet;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ParticleAnimationSet.js.map
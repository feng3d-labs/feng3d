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
     * 几何体
     * @author feng 2016-04-28
     */
    var Geometry = (function (_super) {
        __extends(Geometry, _super);
        /**
         * 创建一个几何体
         */
        function Geometry() {
            var _this = _super.call(this) || this;
            /**
             * 属性数据列表
             */
            _this._attributes = {};
            _this._geometryInvalid = true;
            _this._useFaceWeights = false;
            _this._scaleU = 1;
            _this._scaleV = 1;
            return _this;
        }
        Object.defineProperty(Geometry.prototype, "positions", {
            /**
             * 坐标数据
             */
            get: function () {
                return this.getVAData1("a_position");
            },
            set: function (value) {
                this.setVAData("a_position", value, 3);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "uvs", {
            /**
             * uv数据
             */
            get: function () {
                return this.getVAData1("a_uv");
            },
            set: function (value) {
                this.setVAData("a_uv", value, 2);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "normals", {
            /**
             * 法线数据
             */
            get: function () {
                return this.getVAData1("a_normal");
            },
            set: function (value) {
                this.setVAData("a_normal", value, 3);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "tangents", {
            /**
             * 切线数据
             */
            get: function () {
                return this.getVAData1("a_tangent");
            },
            set: function (value) {
                this.setVAData("a_tangent", value, 3);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新渲染数据
         */
        Geometry.prototype.updateRenderData = function (renderContext, renderData) {
            this.updateGrometry();
            _super.prototype.updateRenderData.call(this, renderContext, renderData);
        };
        /**
         * 几何体变脏
         */
        Geometry.prototype.invalidateGeometry = function () {
            this._geometryInvalid = true;
            this.invalidateRenderHolder();
        };
        /**
         * 更新几何体
         */
        Geometry.prototype.updateGrometry = function () {
            if (this._geometryInvalid) {
                this.buildGeometry();
                this._geometryInvalid = false;
                this.invalidateBounds();
            }
        };
        /**
         * 构建几何体
         */
        Geometry.prototype.buildGeometry = function () {
        };
        Object.defineProperty(Geometry.prototype, "indices", {
            /**
             * 索引数据
             */
            get: function () {
                return this._indexBuffer && this._indexBuffer.indices;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新顶点索引数据
         */
        Geometry.prototype.setIndices = function (indices) {
            this._indexBuffer = this.createIndexBuffer(indices);
            this.dispatch("changedIndexData");
        };
        /**
         * 获取顶点数据
         */
        Geometry.prototype.getIndexData = function () {
            return this._indexBuffer;
        };
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param size          顶点数据尺寸
         */
        Geometry.prototype.setVAData = function (vaId, data, size) {
            if (data) {
                if (!this._attributes[vaId])
                    this._attributes[vaId] = this.createAttributeRenderData(vaId, data, size);
                this._attributes[vaId].data = data;
                this._attributes[vaId].updateGrometry = this.updateGrometry.bind(this);
            }
            else {
                delete this._attributes[vaId];
            }
            this.dispatch("changedVAData", vaId);
        };
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        Geometry.prototype.getVAData = function (vaId) {
            this.updateGrometry();
            this.dispatch("getVAData", vaId);
            return this._attributes[vaId];
        };
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        Geometry.prototype.getVAData1 = function (vaId) {
            var attributeRenderData = this.getVAData(vaId);
            return attributeRenderData && attributeRenderData.data;
        };
        Object.defineProperty(Geometry.prototype, "numVertex", {
            /**
             * 顶点数量
             */
            get: function () {
                var numVertex = 0;
                for (var attributeName in this._attributes) {
                    var attributeRenderData = this._attributes[attributeName];
                    numVertex = attributeRenderData.data.length / attributeRenderData.size;
                    break;
                }
                return numVertex;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 添加几何体
         * @param geometry          被添加的几何体
         * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        Geometry.prototype.addGeometry = function (geometry, transform) {
            if (transform === void 0) { transform = null; }
            //更新几何体
            this.updateGrometry();
            geometry.updateGrometry();
            //变换被添加的几何体
            if (transform != null) {
                geometry = geometry.clone();
                geometry.applyTransformation(transform);
            }
            //如果自身为空几何体
            if (!this._indexBuffer) {
                this.cloneFrom(geometry);
                return;
            }
            //
            var attributes = this._attributes;
            var addAttributes = geometry._attributes;
            //当前顶点数量
            var oldNumVertex = this.numVertex;
            //合并索引
            var indices = this._indexBuffer.indices;
            var targetIndices = geometry._indexBuffer.indices;
            var totalIndices = new Uint16Array(indices.length + targetIndices.length);
            totalIndices.set(indices, 0);
            for (var i = 0; i < targetIndices.length; i++) {
                totalIndices[indices.length + i] = targetIndices[i] + oldNumVertex;
            }
            this.setIndices(totalIndices);
            //合并后顶点数量
            var totalVertex = oldNumVertex + geometry.numVertex;
            //合并属性数据
            for (var attributeName in attributes) {
                var stride = attributes[attributeName].size;
                var data = new Float32Array(totalVertex * stride);
                data.set(attributes[attributeName].data, 0);
                data.set(addAttributes[attributeName].data, oldNumVertex * stride);
                this.setVAData(attributeName, data, stride);
            }
        };
        /**
         * 应用变换矩阵
         * @param transform 变换矩阵
         */
        Geometry.prototype.applyTransformation = function (transform) {
            this.updateGrometry();
            var positionRenderData = this.getVAData("a_position");
            var normalRenderData = this.getVAData("a_normal");
            var tangentRenderData = this.getVAData("a_tangent");
            var vertices = positionRenderData.data;
            var normals = normalRenderData.data;
            var tangents = tangentRenderData.data;
            var posStride = positionRenderData.size;
            var normalStride = normalRenderData.size;
            var tangentStride = tangentRenderData.size;
            var len = vertices.length / posStride;
            var i, i1, i2;
            var vector = new feng3d.Vector3D();
            var bakeNormals = normals != null;
            var bakeTangents = tangents != null;
            var invTranspose;
            if (bakeNormals || bakeTangents) {
                invTranspose = transform.clone();
                invTranspose.invert();
                invTranspose.transpose();
            }
            var vi0 = 0;
            var ni0 = 0;
            var ti0 = 0;
            for (i = 0; i < len; ++i) {
                i1 = vi0 + 1;
                i2 = vi0 + 2;
                // bake position
                vector.x = vertices[vi0];
                vector.y = vertices[i1];
                vector.z = vertices[i2];
                vector = transform.transformVector(vector);
                vertices[vi0] = vector.x;
                vertices[i1] = vector.y;
                vertices[i2] = vector.z;
                vi0 += posStride;
                // bake normal
                if (bakeNormals) {
                    i1 = ni0 + 1;
                    i2 = ni0 + 2;
                    vector.x = normals[ni0];
                    vector.y = normals[i1];
                    vector.z = normals[i2];
                    vector = invTranspose.deltaTransformVector(vector);
                    vector.normalize();
                    normals[ni0] = vector.x;
                    normals[i1] = vector.y;
                    normals[i2] = vector.z;
                    ni0 += normalStride;
                }
                // bake tangent
                if (bakeTangents) {
                    i1 = ti0 + 1;
                    i2 = ti0 + 2;
                    vector.x = tangents[ti0];
                    vector.y = tangents[i1];
                    vector.z = tangents[i2];
                    vector = invTranspose.deltaTransformVector(vector);
                    vector.normalize();
                    tangents[ti0] = vector.x;
                    tangents[i1] = vector.y;
                    tangents[i2] = vector.z;
                    ti0 += tangentStride;
                }
            }
            positionRenderData.invalidate();
            normalRenderData.invalidate();
            normalRenderData.invalidate();
        };
        Object.defineProperty(Geometry.prototype, "scaleU", {
            /**
             * 纹理U缩放，默认为1。
             */
            get: function () {
                return this._scaleU;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "scaleV", {
            /**
             * 纹理V缩放，默认为1。
             */
            get: function () {
                return this._scaleV;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 缩放UV
         * @param scaleU 纹理U缩放，默认1。
         * @param scaleV 纹理V缩放，默认1。
         */
        Geometry.prototype.scaleUV = function (scaleU, scaleV) {
            if (scaleU === void 0) { scaleU = 1; }
            if (scaleV === void 0) { scaleV = 1; }
            this.updateGrometry();
            var uvVaData = this.getVAData("a_uv");
            var uvs = uvVaData.data;
            var len = uvs.length;
            var ratioU = scaleU / this._scaleU;
            var ratioV = scaleV / this._scaleV;
            for (var i = 0; i < len; i += 2) {
                uvs[i] *= ratioU;
                uvs[i + 1] *= ratioV;
            }
            this._scaleU = scaleU;
            this._scaleV = scaleV;
            uvVaData.invalidate();
        };
        /**
         * 包围盒失效
         */
        Geometry.prototype.invalidateBounds = function () {
            this.dispatch("boundsInvalid");
        };
        /**
         * 创建顶点法线
         */
        Geometry.prototype.createVertexNormals = function () {
            //生成法线
            var normals = feng3d.GeometryUtils.createVertexNormals(this.indices, this.positions, this._useFaceWeights);
            this.normals = new Float32Array(normals);
        };
        /**
         * 创建顶点切线
         */
        Geometry.prototype.createVertexTangents = function () {
            //生成切线
            var tangents = feng3d.GeometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, this._useFaceWeights);
            this.tangents = new Float32Array(tangents);
        };
        /**
         * 克隆一个几何体
         */
        Geometry.prototype.clone = function () {
            var geometry = new Geometry();
            geometry.cloneFrom(this);
            return geometry;
        };
        /**
         * 从一个几何体中克隆数据
         */
        Geometry.prototype.cloneFrom = function (geometry) {
            geometry.updateGrometry();
            this.setIndices(geometry.indices);
            this._attributes = {};
            for (var key in geometry._attributes) {
                var attributeRenderData = geometry._attributes[key];
                this.setVAData(key, attributeRenderData.data, attributeRenderData.size);
            }
        };
        return Geometry;
    }(feng3d.Feng3dObject));
    feng3d.Geometry = Geometry;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Geometry.js.map
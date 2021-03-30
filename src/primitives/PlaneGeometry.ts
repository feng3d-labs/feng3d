namespace feng3d
{
    export interface GeometryTypes { PlaneGeometry: PlaneGeometry }

    /**
     * 平面几何体
     */
    export class PlaneGeometry extends Geometry
    {

        __class__: "feng3d.PlaneGeometry";

        @AddEntityMenu("Node3D/Plane")
        create(name = "Plane")
        {
            var mesh = new Entity().addComponent(MeshRenderer);
            mesh.name = name;
            mesh.geometry = Geometry.getDefault("Plane");
            return mesh;
        }

        /**
         * 宽度
         */
        @oav()
        @serialize
        @watch("invalidateGeometry")
        width = 1;

        /**
         * 高度
         */
        @oav()
        @serialize
        @watch("invalidateGeometry")
        height = 1;

        /**
         * 横向分割数
         */
        @oav()
        @serialize
        @watch("invalidateGeometry")
        segmentsW = 1;

        /**
         * 纵向分割数
         */
        @oav()
        @serialize
        @watch("invalidateGeometry")
        segmentsH = 1;

        /**
         * 是否朝上
         */
        @oav()
        @serialize
        @watch("invalidateGeometry")
        yUp = true;

        name = "Plane";

        /**
         * 构建几何体数据
         */
        protected buildGeometry()
        {
            var vertexPositionData = this.buildPosition();
            this.positions = vertexPositionData;

            var vertexNormalData = this.buildNormal();
            this.normals = vertexNormalData;

            var vertexTangentData = this.buildTangent();
            this.tangents = vertexTangentData;

            var uvData = this.buildUVs();
            this.uvs = uvData;

            var indices = this.buildIndices();
            this.indices = indices;
        }

        /**
         * 构建顶点坐标
         * @param this.width 宽度
         * @param this.height 高度
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildPosition()
        {
            var vertexPositionData: number[] = [];
            var x: number, y: number;
            var positionIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    x = (xi / this.segmentsW - .5) * this.width;
                    y = (yi / this.segmentsH - .5) * this.height;

                    //设置坐标数据
                    vertexPositionData[positionIndex++] = x;
                    if (this.yUp)
                    {
                        vertexPositionData[positionIndex++] = 0;
                        vertexPositionData[positionIndex++] = y;
                    }
                    else
                    {
                        vertexPositionData[positionIndex++] = y;
                        vertexPositionData[positionIndex++] = 0;
                    }
                }
            }
            return vertexPositionData;
        }

        /**
         * 构建顶点法线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildNormal()
        {
            var vertexNormalData: number[] = [];

            var normalIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {

                    //设置法线数据
                    vertexNormalData[normalIndex++] = 0;
                    if (this.yUp)
                    {
                        vertexNormalData[normalIndex++] = 1;
                        vertexNormalData[normalIndex++] = 0;
                    }
                    else
                    {
                        vertexNormalData[normalIndex++] = 0;
                        vertexNormalData[normalIndex++] = 1;
                    }
                }
            }
            return vertexNormalData;
        }

        /**
         * 构建顶点切线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildTangent()
        {
            var vertexTangentData: number[] = [];
            var tangentIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    if (this.yUp)
                    {
                        vertexTangentData[tangentIndex++] = 1;
                        vertexTangentData[tangentIndex++] = 0;
                        vertexTangentData[tangentIndex++] = 0;
                    }
                    else
                    {
                        vertexTangentData[tangentIndex++] = -1;
                        vertexTangentData[tangentIndex++] = 0;
                        vertexTangentData[tangentIndex++] = 0;
                    }
                }
            }
            return vertexTangentData;
        }

        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices()
        {
            var indices: number[] = [];
            var tw = this.segmentsW + 1;

            var numIndices = 0;
            var base: number;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    //生成索引数据
                    if (xi != this.segmentsW && yi != this.segmentsH)
                    {
                        base = xi + yi * tw;
                        if (this.yUp)
                        {
                            indices[numIndices++] = base;
                            indices[numIndices++] = base + tw;
                            indices[numIndices++] = base + tw + 1;
                            indices[numIndices++] = base;
                            indices[numIndices++] = base + tw + 1;
                            indices[numIndices++] = base + 1;
                        } else
                        {
                            indices[numIndices++] = base;
                            indices[numIndices++] = base + tw + 1;
                            indices[numIndices++] = base + tw;
                            indices[numIndices++] = base;
                            indices[numIndices++] = base + 1;
                            indices[numIndices++] = base + tw + 1;
                        }
                    }
                }
            }

            return indices;
        }

        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        private buildUVs()
        {
            var data: number[] = [];
            var index = 0;

            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    if (this.yUp)
                    {
                        data[index++] = xi / this.segmentsW;
                        data[index++] = 1 - yi / this.segmentsH;
                    } else
                    {
                        data[index++] = 1 - xi / this.segmentsW;
                        data[index++] = 1 - yi / this.segmentsH;
                    }
                }
            }

            return data;
        }
    }

    export interface DefaultGeometry
    {
        Plane: PlaneGeometry;
    }

    Geometry.setDefault("Plane", new PlaneGeometry(), { width: 10, height: 10 });

    Entity.registerPrimitive("Plane", (g) =>
    {
        g.addComponent(MeshRenderer).geometry = Geometry.getDefault("Plane");
    });

    export interface PrimitiveEntity
    {
        Plane: Entity;
    }
}
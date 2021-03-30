namespace feng3d
{
    export interface GeometryTypes { CapsuleGeometry: CapsuleGeometry }

    /**
     * 胶囊体几何体
     */
    export class CapsuleGeometry extends Geometry
    {

        __class__: "feng3d.CapsuleGeometry";

        @AddEntityMenu("Node3D/Capsule")
        create(name = "Capsule")
        {
            var mesh = new Entity().addComponent(MeshRenderer);
            mesh.name = name;
            mesh.geometry = Geometry.getDefault("Capsule");
            return mesh;
        }

        /**
         * 胶囊体半径
         */
        @serialize
        @oav()
        @watch("invalidateGeometry")
        radius = 0.5;

        /**
         * 胶囊体高度
         */
        @serialize
        @oav()
        @watch("invalidateGeometry")
        height = 1

        /**
         * 横向分割数
         */
        @serialize
        @oav()
        @watch("invalidateGeometry")
        segmentsW = 16

        /**
         * 纵向分割数
         */
        @serialize
        @oav()
        @watch("invalidateGeometry")
        segmentsH = 15;

        /**
         * 正面朝向 true:Y+ false:Z+
         */
        @serialize
        @oav()
        @watch("invalidateGeometry")
        yUp = true;

        name = "Capsule";

        /**
         * 构建几何体数据
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        protected buildGeometry()
        {
            var vertexPositionData: number[] = [];
            var vertexNormalData: number[] = [];
            var vertexTangentData: number[] = [];

            var startIndex: number;
            var index = 0;
            var comp1: number, comp2: number, t1: number, t2: number;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                startIndex = index;

                var horangle = Math.PI * yi / this.segmentsH;
                var z = -this.radius * Math.cos(horangle);
                var ringradius = this.radius * Math.sin(horangle);

                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    var verangle = 2 * Math.PI * xi / this.segmentsW;
                    var x = ringradius * Math.cos(verangle);
                    var y = ringradius * Math.sin(verangle);
                    var normLen = 1 / Math.sqrt(x * x + y * y + z * z);
                    var tanLen = Math.sqrt(y * y + x * x);
                    var offset = yi > this.segmentsH / 2 ? this.height / 2 : -this.height / 2;

                    if (this.yUp)
                    {
                        t1 = 0;
                        t2 = tanLen > .007 ? x / tanLen : 0;
                        comp1 = -z;
                        comp2 = y;
                    }
                    else
                    {
                        t1 = tanLen > .007 ? x / tanLen : 0;
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                    }

                    if (xi == this.segmentsW)
                    {
                        vertexPositionData[index] = vertexPositionData[startIndex];
                        vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                        vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];

                        vertexNormalData[index] = (vertexNormalData[startIndex] + x * normLen) * 0.5;
                        vertexNormalData[index + 1] = (vertexNormalData[startIndex + 1] + comp1 * normLen) * 0.5;
                        vertexNormalData[index + 2] = (vertexNormalData[startIndex + 2] + comp2 * normLen) * 0.5;

                        vertexTangentData[index] = (vertexTangentData[startIndex] + tanLen > .007 ? -y / tanLen : 1) * 0.5;
                        vertexTangentData[index + 1] = (vertexTangentData[startIndex + 1] + t1) * 0.5;
                        vertexTangentData[index + 2] = (vertexTangentData[startIndex + 2] + t2) * 0.5;
                    }
                    else
                    {
                        vertexPositionData[index] = x;
                        vertexPositionData[index + 1] = this.yUp ? comp1 - offset : comp1;
                        vertexPositionData[index + 2] = this.yUp ? comp2 : comp2 + offset;

                        vertexNormalData[index] = x * normLen;
                        vertexNormalData[index + 1] = comp1 * normLen;
                        vertexNormalData[index + 2] = comp2 * normLen;

                        vertexTangentData[index] = tanLen > .007 ? -y / tanLen : 1;
                        vertexTangentData[index + 1] = t1;
                        vertexTangentData[index + 2] = t2;
                    }

                    if (xi > 0 && yi > 0)
                    {

                        if (yi == this.segmentsH)
                        {
                            vertexPositionData[index] = vertexPositionData[startIndex];
                            vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                            vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        }
                    }

                    index += 3;
                }
            }
            this.positions = vertexPositionData;
            this.normals = vertexNormalData;
            this.tangents = vertexTangentData;

            var uvData = this.buildUVs();
            this.uvs = uvData;

            this.buildIndices();
        }

        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices()
        {
            var indices: number[] = [];

            var numIndices = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    if (xi > 0 && yi > 0)
                    {
                        var a = (this.segmentsW + 1) * yi + xi;
                        var b = (this.segmentsW + 1) * yi + xi - 1;
                        var c = (this.segmentsW + 1) * (yi - 1) + xi - 1;
                        var d = (this.segmentsW + 1) * (yi - 1) + xi;

                        if (yi == this.segmentsH)
                        {
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                        else if (yi == 1)
                        {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                        }
                        else
                        {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                    }
                }
            }
            this.indices = indices;
        }

        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs()
        {
            var data: number[] = [];
            var index = 0;

            for (var yi = 0; yi <= this.segmentsH; ++yi)
            {
                for (var xi = 0; xi <= this.segmentsW; ++xi)
                {
                    data[index++] = xi / this.segmentsW;
                    data[index++] = yi / this.segmentsH;
                }
            }

            return data;
        }

    }

    export interface DefaultGeometry
    {
        Capsule: CapsuleGeometry;
    }
    Geometry.setDefault("Capsule", new CapsuleGeometry());

    Entity.registerPrimitive("Capsule", (g) =>
    {
        g.addComponent(MeshRenderer).geometry = Geometry.getDefault("Capsule");
    });

    export interface PrimitiveEntity
    {
        Capsule: Entity;
    }
}
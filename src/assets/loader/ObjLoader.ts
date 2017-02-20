module feng3d
{

    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    export class ObjLoader extends Loader
    {

        objData: OBJ_OBJData;
        mtlData: Mtl_Mtl;
        completed: (object3D: Object3D) => void;

        /**
         * 加载资源
         * @param url   路径
         */
        public load(url: string, completed: (object3D: Object3D) => void = null)
        {

            this.url = url
            this.completed = completed;

            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent)
            {

                var objData = this.objData = OBJParser.parser(e.data.content);

                var mtl = objData.mtl;
                if (mtl)
                {
                    var mtlRoot = url.substring(0, url.lastIndexOf("/") + 1);
                    var mtlLoader = new Loader();
                    mtlLoader.loadText(mtlRoot + mtl);
                    mtlLoader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent)
                    {
                        var mtlData = this.mtlData = MtlParser.parser(e.data.content);
                        this.createObj();
                    }, this);
                } else
                {
                    this.createObj();
                }
            }, this)
            loader.loadText(url);
        }

        private createObj()
        {

            var object = new Object3D();
            var objData = this.objData;
            var objs = objData.objs;
            for (var i = 0; i < objs.length; i++)
            {
                var obj = objs[i];
                var object3D = this.createSubObj(obj);
                object.addChild(object3D);
            }
            if (this.completed)
            {
                this.completed(object);
            }
        }

        private createSubObj(obj: OBJ_OBJ)
        {

            var object3D = new Object3D(obj.name);
            var vertex = new Float32Array(obj.vertex);

            var subObjs = obj.subObjs;

            for (var i = 0; i < subObjs.length; i++)
            {

                var materialObj = this.createMaterialObj(vertex, subObjs[i]);
                object3D.addChild(materialObj);
            }
            return object3D;
        }

        private createMaterialObj(vertex: Float32Array, subObj: OBJ_SubOBJ)
        {
            var object3D = new Object3D();
            var mesh = object3D.getOrCreateComponentByClass(MeshFilter);

            var geometry = mesh.geometry = new Geometry();
            geometry.setVAData(GLAttribute.a_position, vertex, 3);

            var faces = subObj.faces;

            var indices: number[] = [];
            for (var i = 0; i < faces.length; i++)
            {
                var vertexIndices = faces[i].vertexIndices;
                indices.push(vertexIndices[0] - 1, vertexIndices[1] - 1, vertexIndices[2] - 1);
                if (vertexIndices.length == 4)
                {
                    indices.push(vertexIndices[2] - 1, vertexIndices[3] - 1, vertexIndices[0] - 1);
                }
            }
            geometry.setIndices(new Uint16Array(indices));
            var material = object3D.getOrCreateComponentByClass(MeshRenderer).material = new ColorMaterial();

            if (this.mtlData && this.mtlData[subObj.material])
            {
                var materialInfo = this.mtlData[subObj.material];
                var kd = materialInfo.kd;
                material.color.r = kd[0];
                material.color.g = kd[1];
                material.color.b = kd[2];
            }
            return object3D;
        }
    }
}
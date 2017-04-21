module feng3d
{
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    export class ObjLoader extends Loader
    {
        private _objData: OBJ_OBJData;
        private _mtlData: Mtl_Mtl;
        private _completed: (object3D: GameObject) => void;

        /**
         * 加载资源
         * @param url   路径
         */
        public load(url: string, completed: (object3D: GameObject) => void = null)
        {
            this._url = url
            this._completed = completed;

            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent)
            {
                var objData = this._objData = OBJParser.parser(e.data.content);

                var mtl = objData.mtl;
                if (mtl)
                {
                    var mtlRoot = url.substring(0, url.lastIndexOf("/") + 1);
                    var mtlLoader = new Loader();
                    mtlLoader.loadText(mtlRoot + mtl);
                    mtlLoader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent)
                    {
                        var mtlData = this._mtlData = MtlParser.parser(e.data.content);
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
            var object = new GameObject();
            var objData = this._objData;
            var objs = objData.objs;
            for (var i = 0; i < objs.length; i++)
            {
                var obj = objs[i];
                var object3D = this.createSubObj(obj);
                object.addChild(object3D);
            }
            if (this._completed)
            {
                this._completed(object);
            }
        }

        private createSubObj(obj: OBJ_OBJ)
        {
            var object3D = new GameObject(obj.name);
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
            var object3D = new GameObject();
            var model = object3D.getOrCreateComponentByClass(Model);

            var geometry = model.geometry = new Geometry();
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
            var material = object3D.getOrCreateComponentByClass(Model).material = new ColorMaterial();

            if (this._mtlData && this._mtlData[subObj.material])
            {
                var materialInfo = this._mtlData[subObj.material];
                var kd = materialInfo.kd;
                material.color.r = kd[0];
                material.color.g = kd[1];
                material.color.b = kd[2];
            }
            return object3D;
        }
    }
}
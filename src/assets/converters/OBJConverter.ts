namespace feng3d
{
    /**
     * OBJ模型转换器
     */
    export var objConverter: OBJConverter;

    /**
     * OBJ模型转换器
     */
    export class OBJConverter
    {
        /**
         * OBJ模型数据转换为游戏对象
         * @param objData OBJ模型数据
         * @param materials 材质列表
         * @param completed 转换完成回调
         */
        convert(objData: OBJ_OBJData, materials: { [name: string]: Material; }, completed: (gameObject: GameObject) => void)
        {
            var object = new GameObject();
            object.name = objData.name;
            var objs = objData.objs;
            for (var i = 0; i < objs.length; i++)
            {
                var obj = objs[i];
                var gameObject = createSubObj(objData, obj, materials);
                object.addChild(gameObject);
            }

            feng3dDispatcher.dispatch("assets.parsed", object);

            completed && completed(object);
        }
    }
    objConverter = new OBJConverter();

    function createSubObj(objData: OBJ_OBJData, obj: OBJ_OBJ, materials: { [name: string]: Material; })
    {
        var gameObject = Object.setValue(new GameObject(), { name: obj.name });

        var subObjs = obj.subObjs;
        for (var i = 0; i < subObjs.length; i++)
        {
            var materialObj = createMaterialObj(objData, subObjs[i], materials);
            gameObject.addChild(materialObj);
        }
        return gameObject;
    }

    var _realIndices: string[];
    var _vertexIndex: number;

    function createMaterialObj(obj: OBJ_OBJData, subObj: OBJ_SubOBJ, materials: { [name: string]: Material; })
    {
        var gameObject = new GameObject();
        gameObject.name = subObj.g || gameObject.name;
        var model = gameObject.addComponent(Model);
        if (materials && materials[subObj.material])
            model.material = materials[subObj.material];

        var geometry = model.geometry = new CustomGeometry();
        geometry.name = subObj.g || geometry.name;
        var vertices: number[] = [];
        var normals: number[] = [];
        var uvs: number[] = [];
        _realIndices = [];
        _vertexIndex = 0;
        var faces = subObj.faces;
        var indices: number[] = [];
        for (var i = 0; i < faces.length; i++)
        {
            var face = faces[i];
            var numVerts = face.indexIds.length - 1;
            for (var j = 1; j < numVerts; ++j)
            {
                translateVertexData(face, j, vertices, uvs, indices, normals, obj);
                translateVertexData(face, 0, vertices, uvs, indices, normals, obj);
                translateVertexData(face, j + 1, vertices, uvs, indices, normals, obj);
            }
        }
        geometry.indices = indices;
        geometry.setVAData("a_position", vertices, 3);

        if (normals.length > 0)
            geometry.setVAData("a_normal", normals, 3);

        if (uvs.length > 0)
            geometry.setVAData("a_uv", uvs, 2);

        feng3dDispatcher.dispatch("assets.parsed", geometry);

        return gameObject;

        function translateVertexData(face: OBJ_Face, vertexIndex: number, vertices: Array<number>, uvs: Array<number>, indices: Array<number>, normals: Array<number>, obj: OBJ_OBJData)
        {
            var index: number;
            var vertex: { x: number; y: number; z: number; };
            var vertexNormal: { x: number; y: number; z: number; };
            var uv: { u: number, v: number, s: number };
            if (!_realIndices[face.indexIds[vertexIndex]])
            {
                index = _vertexIndex;
                _realIndices[face.indexIds[vertexIndex]] = ++_vertexIndex;
                vertex = obj.vertex[parseInt(face.vertexIndices[vertexIndex]) - 1];
                vertices.push(vertex.x, vertex.y, vertex.z);
                if (face.normalIndices && face.normalIndices.length > 0)
                {
                    vertexNormal = obj.vn[parseInt(face.normalIndices[vertexIndex]) - 1];
                    normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);
                }
                if (face.uvIndices && face.uvIndices.length > 0)
                {
                    try 
                    {
                        uv = obj.vt[parseInt(face.uvIndices[vertexIndex]) - 1];
                        uvs.push(uv.u, uv.v);
                    }
                    catch (e)
                    {
                        switch (vertexIndex)
                        {
                            case 0:
                                uvs.push(0, 1);
                                break;
                            case 1:
                                uvs.push(.5, 0);
                                break;
                            case 2:
                                uvs.push(1, 1);
                        }
                    }
                }
            }
            else
                index = _realIndices[face.indexIds[vertexIndex]] - 1;
            indices.push(index);
        }
    }
}
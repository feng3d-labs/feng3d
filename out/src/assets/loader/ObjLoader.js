var feng3d;
(function (feng3d) {
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    feng3d.ObjLoader = {
        /**
         * 加载Obj模型
         */
        load: load
    };
    /**
     * 加载资源
     * @param url   路径
     */
    function load(url, material, completed) {
        if (completed === void 0) { completed = null; }
        feng3d.Loader.loadText(url, function (content) {
            var objData = feng3d.OBJParser.parser(content);
            var mtl = objData.mtl;
            if (mtl) {
                var mtlRoot = url.substring(0, url.lastIndexOf("/") + 1);
                feng3d.Loader.loadText(mtlRoot + mtl, function (content) {
                    var mtlData = feng3d.MtlParser.parser(content);
                    createObj(objData, material, mtlData, completed);
                });
            }
            else {
                createObj(objData, material, null, completed);
            }
        });
    }
    function createObj(objData, material, mtlData, completed) {
        var object = feng3d.GameObject.create();
        var objs = objData.objs;
        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            var object3D = createSubObj(obj, material, mtlData);
            object.addChild(object3D);
        }
        completed && completed(object);
    }
    function createSubObj(obj, material, mtlData) {
        var object3D = feng3d.GameObject.create(obj.name);
        var subObjs = obj.subObjs;
        for (var i = 0; i < subObjs.length; i++) {
            var materialObj = createMaterialObj(obj, subObjs[i], material, mtlData);
            object3D.addChild(materialObj);
        }
        return object3D;
    }
    var _realIndices;
    var _vertexIndex;
    function createMaterialObj(obj, subObj, material, mtlData) {
        var gameObject = feng3d.GameObject.create();
        var model = gameObject.addComponent(feng3d.MeshRenderer);
        model.material = material || new feng3d.ColorMaterial();
        var meshFilter = gameObject.addComponent(feng3d.MeshFilter);
        var geometry = meshFilter.mesh = new feng3d.Geometry();
        var vertices = [];
        var normals = [];
        var uvs = [];
        _realIndices = [];
        _vertexIndex = 0;
        var faces = subObj.faces;
        var indices = [];
        for (var i = 0; i < faces.length; i++) {
            var face = faces[i];
            var numVerts = face.indexIds.length - 1;
            for (var j = 1; j < numVerts; ++j) {
                translateVertexData(face, j, vertices, uvs, indices, normals, obj);
                translateVertexData(face, 0, vertices, uvs, indices, normals, obj);
                translateVertexData(face, j + 1, vertices, uvs, indices, normals, obj);
            }
        }
        geometry.setIndices(new Uint16Array(indices));
        geometry.setVAData("a_position", new Float32Array(vertices), 3);
        geometry.setVAData("a_normal", new Float32Array(normals), 3);
        geometry.setVAData("a_uv", new Float32Array(uvs), 2);
        geometry.createVertexTangents();
        if (mtlData && mtlData[subObj.material]) {
            var materialInfo = mtlData[subObj.material];
            var kd = materialInfo.kd;
            var colorMaterial = new feng3d.ColorMaterial();
            colorMaterial.color.r = kd[0];
            colorMaterial.color.g = kd[1];
            colorMaterial.color.b = kd[2];
            model.material = colorMaterial;
        }
        return gameObject;
        function translateVertexData(face, vertexIndex, vertices, uvs, indices, normals, obj) {
            var index;
            var vertex;
            var vertexNormal;
            var uv;
            if (!_realIndices[face.indexIds[vertexIndex]]) {
                index = _vertexIndex;
                _realIndices[face.indexIds[vertexIndex]] = ++_vertexIndex;
                vertex = obj.vertex[face.vertexIndices[vertexIndex] - 1];
                vertices.push(vertex.x, vertex.y, vertex.z);
                if (face.normalIndices.length > 0) {
                    vertexNormal = obj.vn[face.normalIndices[vertexIndex] - 1];
                    normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);
                }
                if (face.uvIndices.length > 0) {
                    try {
                        uv = obj.vt[face.uvIndices[vertexIndex] - 1];
                        uvs.push(uv.u, uv.v);
                    }
                    catch (e) {
                        switch (vertexIndex) {
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
})(feng3d || (feng3d = {}));
//# sourceMappingURL=ObjLoader.js.map
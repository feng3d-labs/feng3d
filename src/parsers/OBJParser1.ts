module feng3d {

    class ObjData {

        /** 对象组列表 */
        _objects: ObjectGroup[] = [];
        /** 材质编号列表 */
        _materialIDs: string[] = [];
        /** 最后的材质编号 */
        _lastMtlID: string;
        /** 顶点坐标数据 */
        _vertices: Vertex[] = [];
        /** 顶点法线数据 */
        _vertexNormals: Vertex[] = [];
        /** uv数据 */
        _uvs: UV[] = [];
        /** */
        mtl: string;
    }

    /** 当前解析的对象 */
    var _currentObject: ObjectGroup;
    /** 当前组 */
    var _currentGroup: Group;
    /** 当前材质组 */
    var _currentMaterialGroup: MaterialGroup;
    /**  */
    var _mtlLib: boolean;
    /** 材质库是否已加载 */
    var _mtlLibLoaded: boolean = true;
    /** 活动材质编号 */
    var _activeMaterialID: string = "";

    var objData: ObjData;

	/**
	 * Obj模型解析者
	 */
    export class OBJParser1 {

        private parse(content: string) {

            objData = new ObjData();

            //单行数据
            var line: string;
            //换行符
            var creturn: string = String.fromCharCode(10);
            var trunk;

            //删除注释
            content = content.replace(/\\[\r\n]+\s*/gm, ' ');

            if (content.indexOf(creturn) == -1)
                creturn = String.fromCharCode(13);

            /** 字符串数据长度 */
            var stringLength: number = content.length;
            /** 当前读取到的位置 */
            var charIndex: number = content.indexOf(creturn, 0);
            /** 刚才读取到的位置 */
            var oldIndex: number = 0;

            //判断是否解析完毕与是否还有时间
            while (charIndex < stringLength) {
                charIndex = content.indexOf(creturn, oldIndex);

                if (charIndex == -1)
                    charIndex = stringLength;
                //获取单行数据 整理数据格式
                line = content.substring(oldIndex, charIndex);
                line = line.split('\r').join("");
                line = line.replace("  ", " ");
                trunk = line.split(" ");
                oldIndex = charIndex + 1;

                //解析该行数据
                this.parseLine(trunk);
            }
            return objData;
        }

		/**
		 * 解析行
		 */
        private parseLine(trunk) {
            switch (trunk[0]) {
                case "mtllib":
                    _mtlLib = true;
                    _mtlLibLoaded = false;
                    objData.mtl = trunk[1];
                    break;
                case "g":
                    this.createGroup(trunk);
                    break;
                case "o":
                    this.createObject(trunk);
                    break;
                case "usemtl":
                    if (_mtlLib) {
                        if (!trunk[1])
                            trunk[1] = "def000";
                        objData._materialIDs.push(trunk[1]);
                        _activeMaterialID = trunk[1];
                        if (_currentGroup)
                            _currentGroup.materialID = _activeMaterialID;
                    }
                    break;
                case "v":
                    this.parseVertex(trunk);
                    break;
                case "vt":
                    this.parseUV(trunk);
                    break;
                case "vn":
                    this.parseVertexNormal(trunk);
                    break;
                case "f":
                    this.parseFace(trunk);
            }
        }

		/**
		 * 创建对象组
		 * @param trunk 包含材料标记的数据块和它的参数
		 */
        private createObject(trunk) {
            _currentGroup = null;
            _currentMaterialGroup = null;
            objData._objects.push(_currentObject = new ObjectGroup());

            if (trunk)
                _currentObject.name = trunk[1];
        }

		/**
		 * 创建一个组
		 * @param trunk 包含材料标记的数据块和它的参数
		 */
        private createGroup(trunk) {
            if (!_currentObject)
                this.createObject(null);
            _currentGroup = new Group();

            _currentGroup.materialID = _activeMaterialID;

            if (trunk)
                _currentGroup.name = trunk[1];
            _currentObject.groups.push(_currentGroup);

            this.createMaterialGroup(null);
        }

		/**
		 * 创建材质组
		 * @param trunk 包含材料标记的数据块和它的参数
		 */
        private createMaterialGroup(trunk) {
            _currentMaterialGroup = new MaterialGroup();
            if (trunk)
                _currentMaterialGroup.url = trunk[1];
            _currentGroup.materialGroups.push(_currentMaterialGroup);
        }

		/**
		 * 解析顶点坐标数据
		 * @param trunk 坐标数据
		 */
        private parseVertex(trunk) {
            if (trunk.length > 4) {
                var nTrunk = [];
                var val: number;
                for (var i: number = 1; i < trunk.length; ++i) {
                    val = parseFloat(trunk[i]);
                    if (!isNaN(val))
                        nTrunk.push(val);
                }
                objData._vertices.push(new Vertex(nTrunk[0], nTrunk[1], -nTrunk[2]));
            }
            else
                objData._vertices.push(new Vertex(parseFloat(trunk[1]), parseFloat(trunk[2]), -parseFloat(trunk[3])));
        }

		/**
		 * 解析uv
		 * @param trunk uv数据
		 */
        private parseUV(trunk) {
            if (trunk.length > 3) {
                var nTrunk = [];
                var val: number;
                //获取有效数字
                for (var i: number = 1; i < trunk.length; ++i) {
                    val = parseFloat(trunk[i]);
                    if (!isNaN(val))
                        nTrunk.push(val);
                }
                objData._uvs.push(new UV(nTrunk[0], 1 - nTrunk[1]));

            }
            else
                objData._uvs.push(new UV(parseFloat(trunk[1]), 1 - parseFloat(trunk[2])));

        }

		/**
		 * 解析顶点法线
		 * @param trunk 法线数据
		 */
        private parseVertexNormal(trunk) {
            if (trunk.length > 4) {
                var nTrunk = [];
                var val: number;
                //获取有效数字
                for (var i: number = 1; i < trunk.length; ++i) {
                    val = parseFloat(trunk[i]);
                    if (!isNaN(val))
                        nTrunk.push(val);
                }
                objData._vertexNormals.push(new Vertex(nTrunk[0], nTrunk[1], -nTrunk[2]));

            }
            else
                objData._vertexNormals.push(new Vertex(parseFloat(trunk[1]), parseFloat(trunk[2]), -parseFloat(trunk[3])));
        }

		/**
		 * 解析面
		 * @param trunk 面数据
		 */
        private parseFace(trunk) {
            var len: number = trunk.length;
            var face: FaceData = new FaceData();

            if (!_currentGroup)
                this.createGroup(null);

            var indices;
            for (var i: number = 1; i < len; ++i) {
                if (trunk[i] == "")
                    continue;
                //解析单个面数据，分离出顶点坐标左右、uv索引、法线索引
                indices = trunk[i].split("/");
                face.vertexIndices.push(this.parseIndex(parseInt(indices[0]), objData._vertices.length));
                if (indices[1] && String(indices[1]).length > 0)
                    face.uvIndices.push(this.parseIndex(parseInt(indices[1]), objData._uvs.length));
                if (indices[2] && String(indices[2]).length > 0)
                    face.normalIndices.push(this.parseIndex(parseInt(indices[2]), objData._vertexNormals.length));
                face.indexIds.push(trunk[i]);
            }

            _currentMaterialGroup.faces.push(face);
        }

		/**
		 * This is a hack around negative face coords
		 */
        private parseIndex(index: number, length: number): number {
            if (index < 0)
                return index + length + 1;
            else
                return index;
        }

		/**
		 * 解析材质数据
		 * @param data 材质数据
		 */
        public parseMtl(data: string) {
            var materialDefinitions = data.split('newmtl');
            var lines;
            var trunk;
            var j: number;

            var useSpecular: boolean;
            var useColor: boolean;
            var diffuseColor: number;
            var ambientColor: number;
            var specularColor: number;
            var specular: number;
            var alpha: number;
            var mapkd: string;

            for (var i: number = 0; i < materialDefinitions.length; ++i) {

                lines = materialDefinitions[i].split('\r').join("").split('\n');

                if (lines.length == 1)
                    lines = materialDefinitions[i].split(String.fromCharCode(13));

                diffuseColor = ambientColor = specularColor = 0xFFFFFF;
                specular = 0;
                useSpecular = false;
                useColor = false;
                alpha = 1;
                mapkd = "";

                for (j = 0; j < lines.length; ++j) {
                    lines[j] = lines[j].replace(/\s+$/, "");

                    if (lines[j].substring(0, 1) != "#" && (j == 0 || lines[j] != "")) {
                        trunk = lines[j].split(" ");

                        if (String(trunk[0]).charCodeAt(0) == 9 || String(trunk[0]).charCodeAt(0) == 32)
                            trunk[0] = trunk[0].substring(1, trunk[0].length);

                        if (j == 0) {
                            objData._lastMtlID = trunk.join("");
                            objData._lastMtlID = (objData._lastMtlID == "") ? "def000" : objData._lastMtlID;

                        }
                        else {

                            switch (trunk[0]) {

                                case "Ka":
                                    if (trunk[1] && !isNaN(Number(trunk[1])) && trunk[2] && !isNaN(Number(trunk[2])) && trunk[3] && !isNaN(Number(trunk[3])))
                                        ambientColor = trunk[1] * 255 << 16 | trunk[2] * 255 << 8 | trunk[3] * 255;
                                    break;

                                case "Ks":
                                    if (trunk[1] && !isNaN(Number(trunk[1])) && trunk[2] && !isNaN(Number(trunk[2])) && trunk[3] && !isNaN(Number(trunk[3]))) {
                                        specularColor = trunk[1] * 255 << 16 | trunk[2] * 255 << 8 | trunk[3] * 255;
                                        useSpecular = true;
                                    }
                                    break;

                                case "Ns":
                                    if (trunk[1] && !isNaN(Number(trunk[1])))
                                        specular = Number(trunk[1]) * 0.001;
                                    if (specular == 0)
                                        useSpecular = false;
                                    break;

                                case "Kd":
                                    if (trunk[1] && !isNaN(Number(trunk[1])) && trunk[2] && !isNaN(Number(trunk[2])) && trunk[3] && !isNaN(Number(trunk[3]))) {
                                        diffuseColor = trunk[1] * 255 << 16 | trunk[2] * 255 << 8 | trunk[3] * 255;
                                        useColor = true;
                                    }
                                    break;

                                case "tr":
                                case "d":
                                    if (trunk[1] && !isNaN(Number(trunk[1])))
                                        alpha = Number(trunk[1]);
                                    break;

                                case "map_Kd":
                                    mapkd = this.parseMapKdString(trunk);
                                    mapkd = mapkd.replace(/\\/g, "/");
                            }
                        }
                    }
                }
            }

            _mtlLibLoaded = true;
        }

        private parseMapKdString(trunk): string {
            var url: string = "";
            var i: number;
            var breakflag: boolean;

            for (i = 1; i < trunk.length;) {
                switch (trunk[i]) {
                    case "-blendu":
                    case "-blendv":
                    case "-cc":
                    case "-clamp":
                    case "-texres":
                        i += 2; //Skip ahead 1 attribute
                        break;
                    case "-mm":
                        i += 3; //Skip ahead 2 attributes
                        break;
                    case "-o":
                    case "-s":
                    case "-t":
                        i += 4; //Skip ahead 3 attributes
                        continue;
                    default:
                        breakflag = true;
                        break;
                }

                if (breakflag)
                    break;
            }

            //Reconstruct URL/filename
            for (i; i < trunk.length; i++) {
                url += trunk[i];
                url += " ";
            }

            //Remove the extraneous space and/or newline from the right side
            url = url.replace(/\s+$/, "");

            return url;
        }
    }

    class ObjectGroup {
        /** 对象名 */
        public name: string;
        /** 组列表（子网格列表） */
        public groups: Group[] = [];
    }

    class Group {
        public name: string;
        public materialID: string;
        public materialGroups: MaterialGroup[] = [];
    }

    /**
     * 材质组
     */
    class MaterialGroup {
        public url: string;
        public faces: FaceData[] = [];
    }

    /**
     * 面数据
     */
    class FaceData {
        /** 顶点坐标索引数组 */
        public vertexIndices: number[] = [];
        /** 顶点uv索引数组 */
        public uvIndices: number[] = [];
        /** 顶点法线索引数组 */
        public normalIndices: number[] = [];
        /** 顶点Id(原本该值存放了顶点索引、uv索引、发现索引，已经被解析为上面3个数组，剩下的就当做ID使用) */
        public indexIds: string[] = []; // 
    }

    /**
     * 顶点
     */
    export class Vertex {
        x: number;
        y: number;
        z: number;

		/**
		 *
		 * @param x X轴坐标
		 * @param y Y轴坐标
		 * @param z Z轴坐标
		 * @param index 顶点索引
		 */
        constructor(x: number = 0, y: number = 0, z: number = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    /**
     * Texture coordinates value object.
     */
    class UV {
        u: number;
        v: number;
		/**
		 * Creates a new <code>UV</code> object.
		 *
		 * @param    u        [optional]    The horizontal coordinate of the texture value. Defaults to 0.
		 * @param    v        [optional]    The vertical coordinate of the texture value. Defaults to 0.
		 */
        constructor(u: number = 0, v: number = 0) {
            this.u = u;
            this.v = v;
        }
    }
}





module feng3d {

    type Face = {
        vertexIndices: number[];
    };

    type SubOBJ = {
        material: string;
        faces: Face[];
    };

    type OBJ = {
        name: string;
        vertex: number[];
        subObjs: SubOBJ[];
    };

    type OBJData = {
        mtls: string[];
        objs: OBJ[];
    }

	/**
	 * Obj模型解析器
     * @author feng 2017-01-13
	 */
    export class OBJParser {

        mtlReg = /mtllib\s+([\w.]+)/;
        objReg = /o\s+([\w]+)/;
        vertexReg = /v\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
        usemtlReg = /usemtl\s+([\w.]+)/;
        faceReg = /f\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;

        parser(context: string) {

            var objData: OBJData = { mtls: [], objs: [] };
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                this.parserLine(line, objData);
            } while (line);
            currentObj = null;
            currentSubObj = null;
            return objData;
        }

        private createOBJ(name: string) {

            var obj: OBJ = {
                name: name,
                vertex: [],
                subObjs: []
            };
            return obj;
        }

        private createSubObj(material: string) {

            var subObj = {
                material: material,
                faces: []
            };
            return subObj;
        }

        private parserLine(line: string, objData: OBJData) {
            if (!line)
                return;
            line = line.trim();
            if (!line.length)
                return;
            if (line.charAt(0) == "#")
                return;

            var result: RegExpExecArray;
            if ((result = this.mtlReg.exec(line)) && result[0] == line) {
                objData.mtls.push(result[1]);
            } else if ((result = this.objReg.exec(line)) && result[0] == line) {
                currentObj = this.createOBJ(result[1]);
                objData.objs.push(currentObj);
            } else if ((result = this.vertexReg.exec(line)) && result[0] == line) {
                currentObj.vertex.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
            } else if ((result = this.usemtlReg.exec(line)) && result[0] == line) {
                currentSubObj = this.createSubObj(result[1]);
                currentObj.subObjs.push(currentSubObj);
            } else if ((result = this.faceReg.exec(line)) && result[0] == line) {
                currentSubObj.faces.push({
                    vertexIndices: [parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), parseInt(result[4])]
                });
            } else {
                throw new Error(`无法解析${line}`);
            }
        }

    }
    //
    var currentObj: OBJ;
    var currentSubObj: SubOBJ;
}
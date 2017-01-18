module feng3d {

    type MD5_Joint = {
        name: string;
        parentIndex: number;
        position: number[];
        /** 旋转数据 */
        rotation: number[];
    }

    type MD5_Mesh = {
        MD5Version: number;
        commandline: string;
        numJoints: number;
        numMeshes: number;
        joints: MD5_Joint[];
    }

    export class MD5MeshParser {

        static parse(context: string) {

            var md5Mesh = <MD5_Mesh>{};
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                parserLine(line, md5Mesh);
            } while (line);
            return md5Mesh;

        }
    }

    var MD5VersionReg = /MD5Version\s+(\d+)/;
    var commandlineReg = /commandline\s+"([\w\s/.-]+)"/;
    var numJointsReg = /numJoints\s+(\d+)/;
    var numMeshesReg = /numMeshes\s+(\d+)/;
    var jointsStartReg = /joints\s+{/;
    var jointsReg = /"(\w+)"\s+([-\d]+)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)(\s+\/\/(\s+\w+)?)?/;
    var endBlockReg = /}/;
    var meshStartReg = /mesh\s+{/;

    /**
     * 状态
     */
    enum State {
        /** 读取关节 */
        joints,
        mesh
    }

    /** 当前处于状态 */
    var states: State[] = [];

    function parserLine(line: string, md5Mesh: MD5_Mesh) {

        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;

        var result: RegExpExecArray;
        if ((result = MD5VersionReg.exec(line)) && result[0] == line) {
            md5Mesh.MD5Version = parseInt(result[1]);
        } else if ((result = commandlineReg.exec(line)) && result[0] == line) {
            md5Mesh.commandline = result[1];
        } else if ((result = numJointsReg.exec(line)) && result[0] == line) {
            md5Mesh.numJoints = parseInt(result[1]);
        } else if ((result = numMeshesReg.exec(line)) && result[0] == line) {
            md5Mesh.numMeshes = parseInt(result[1]);
        } else if ((result = jointsStartReg.exec(line)) && result[0] == line) {
            states.push(State.joints);
            md5Mesh.joints = [];
        } else if ((result = jointsReg.exec(line)) && result[0] == line) {
            md5Mesh.joints.push({
                name: result[1], parentIndex: parseInt(result[2]),
                position: [parseFloat(result[3]), parseFloat(result[4]), parseFloat(result[5])],
                rotation: [parseFloat(result[3]), parseFloat(result[4]), parseFloat(result[5])]
            });
        } else if ((result = endBlockReg.exec(line)) && result[0] == line) {
            states.pop();
        } else if ((result = meshStartReg.exec(line)) && result[0] == line) {
            states.push(State.mesh);
        } else {
            throw new Error(`无法解析${line}`);
        }

    }
}
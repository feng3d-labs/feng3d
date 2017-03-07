module feng3d
{

    /**
     * 帧数据
     */
    export type MD5_Frame = {
        index: number;
        components: number[];
    }

    /**
     * 基础帧数据
     */
    export type MD5_BaseFrame = {
        /** 位置 */
        position: number[];
        /** 方向 */
        orientation: number[];
    }

    /**
     * 包围盒信息
     */
    export type MD5_Bounds = {
        /** 最小坐标 */
        min: number[];
        /** 最大坐标 */
        max: number[];
    }

    /**
     * 层级数据
     */
    export type MD5_HierarchyData = {
        /** Joint 名字 */
        name: string;
        /** 父节点序号 */
        parentIndex: number;
        /** flag */
        flags: number;
        /** 影响的帧数据起始索引 */
        startIndex: number;
    }

    export type MD5AnimData = {
        MD5Version: number;
        commandline: string;
        numFrames: number;
        numJoints: number;
        frameRate: number;
        numAnimatedComponents: number;
        hierarchy: MD5_HierarchyData[];
        bounds: MD5_Bounds[];
        baseframe: MD5_BaseFrame[];
        frame: MD5_Frame[];
    }

    export class MD5AnimParser
    {
        public static parse(context: string)
        {
            var md5AnimData = <MD5AnimData>{};
            var lines = context.split("\n").reverse();
            do
            {
                var line = lines.pop();
                parserLine(line, md5AnimData);
            } while (line);
            return md5AnimData;
        }
    }

    var MD5VersionReg = /MD5Version\s+(\d+)/;
    var commandlineReg = /commandline\s+"([\w\s/.-]+)"/;
    var numFramesReg = /numFrames\s+(\d+)/;
    var numJointsReg = /numJoints\s+(\d+)/;
    var frameRateReg = /frameRate\s+(\d+)/;
    var numAnimatedComponentsReg = /numAnimatedComponents\s+(\d+)/;
    var hierarchyStartReg = /hierarchy\s+{/;
    var hierarchyReg = /"(\w+)"\s+([\d-]+)\s+(\d+)\s+(\d+)(\s+\/\/(\s+\w+)?(\s+\([\s\w]+\))?)?/;
    var endBlockReg = /}/;
    var boundsStartReg = /bounds\s+{/;
    //2组3个number
    var number32Reg = /\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)/;
    var baseframeStartReg = /baseframe\s+{/;
    var frameStartReg = /frame\s+(\d+)\s+{/;
    var numbersReg = /(-?[\d.]+)(\s+-?[\d.]+){0,}/;

    /**
     * 状态
     */
    enum State
    {
        hierarchy,
        bounds,
        baseframe,
        frame
    }

    /** 当前处于状态 */
    var states: State[] = [];
    var currentFrame: MD5_Frame;

    function parserLine(line: string, md5AnimData: MD5AnimData)
    {

        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;

        var result: RegExpExecArray;
        if ((result = MD5VersionReg.exec(line)) && result[0] == line)
        {
            md5AnimData.MD5Version = parseInt(result[1]);
        } else if ((result = commandlineReg.exec(line)) && result[0] == line)
        {
            md5AnimData.commandline = result[1];
        } else if ((result = numFramesReg.exec(line)) && result[0] == line)
        {
            md5AnimData.numFrames = parseInt(result[1]);
        } else if ((result = numJointsReg.exec(line)) && result[0] == line)
        {
            md5AnimData.numJoints = parseInt(result[1]);
        } else if ((result = frameRateReg.exec(line)) && result[0] == line)
        {
            md5AnimData.frameRate = parseInt(result[1]);
        } else if ((result = numAnimatedComponentsReg.exec(line)) && result[0] == line)
        {
            md5AnimData.numAnimatedComponents = parseInt(result[1]);
        } else if ((result = hierarchyStartReg.exec(line)) && result[0] == line)
        {
            md5AnimData.hierarchy = [];
            states.push(State.hierarchy);
        } else if ((result = hierarchyReg.exec(line)) && result[0] == line)
        {
            switch (states[states.length - 1])
            {
                case State.hierarchy:
                    md5AnimData.hierarchy.push({
                        name: result[1], parentIndex: parseInt(result[2]),
                        flags: parseInt(result[3]), startIndex: parseInt(result[4])
                    });
                    break;
                default:
                    throw new Error("没有对应的数据处理");
            }
        } else if ((result = endBlockReg.exec(line)) && result[0] == line)
        {
            var state = states.pop();
            if (state == State.frame)
            {
                if (currentFrame.components.length != md5AnimData.numAnimatedComponents)
                {
                    throw new Error("frame中数据不对");
                }
                currentFrame = null;
            }
        } else if ((result = boundsStartReg.exec(line)) && result[0] == line)
        {
            md5AnimData.bounds = [];
            states.push(State.bounds);
        } else if ((result = baseframeStartReg.exec(line)) && result[0] == line)
        {
            md5AnimData.baseframe = [];
            states.push(State.baseframe);
        } else if ((result = number32Reg.exec(line)) && result[0] == line)
        {
            switch (states[states.length - 1])
            {
                case State.bounds:
                    md5AnimData.bounds.push({ min: [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])], max: [parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6])] });
                    break;
                case State.baseframe:
                    md5AnimData.baseframe.push({ position: [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])], orientation: [parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6])] });
                    break;
                default:
                    throw new Error("没有对应的数据处理");
            }
        } else if ((result = frameStartReg.exec(line)) && result[0] == line)
        {
            if (!md5AnimData.frame)
            {
                md5AnimData.frame = [];
            }
            currentFrame = { index: parseInt(result[1]), components: [] };
            md5AnimData.frame.push(currentFrame);
            states.push(State.frame);
        } else if ((result = numbersReg.exec(line)) && result[0] == line)
        {
            switch (states[states.length - 1])
            {
                case State.frame:
                    var numbers = line.split(" ");
                    while (numbers.length > 0)
                    {
                        currentFrame.components.push(parseFloat(numbers.shift()));
                    }
                    break;
                default:
                    throw new Error("没有对应的数据处理");
            }
        } else
        {
            throw new Error(`无法解析${line}`);
        }

    }
}
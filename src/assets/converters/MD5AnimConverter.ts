namespace feng3d
{
    /**
     * MD5动画转换器
     */
    export var md5AnimConverter: MD5AnimConverter;

    /**
     * MD5动画转换器
     */
    export class MD5AnimConverter
    {

        /**
         * MD5动画数据转换为引擎动画数据
         * @param md5AnimData MD5动画数据
         * @param completed 转换完成回调
         */
        convert(md5AnimData: MD5AnimData, completed?: (animationClip: AnimationClip) => void)
        {
            var animationClip = new AnimationClip();
            animationClip.name = md5AnimData.name;
            animationClip.length = md5AnimData.numFrames / md5AnimData.frameRate * 1000;
            animationClip.propertyClips = [];

            var __chache__: { [key: string]: PropertyClip } = {};

            for (var i = 0; i < md5AnimData.numFrames; ++i)
            {
                translatePose(md5AnimData, md5AnimData.frame[i], animationClip);
            }

            feng3dDispatcher.dispatch("assets.parsed", animationClip);

            completed && completed(animationClip);

            /**
             * 将一个关键帧数据转换为SkeletonPose
             * @param frameData 帧数据
             * @return 包含帧数据的SkeletonPose对象
             */
            function translatePose(md5AnimData: MD5AnimData, frameData: MD5_Frame, animationclip: AnimationClip)
            {
                var hierarchy: MD5_HierarchyData;
                var base: MD5_BaseFrame;
                var flags: number;
                var j: number;
                //偏移量
                var translation: Vector3 = new Vector3();
                //旋转四元素
                var components: number[] = frameData.components;

                for (var i = 0; i < md5AnimData.numJoints; ++i)
                {
                    //通过原始帧数据与层级数据计算出当前骨骼pose数据
                    j = 0;
                    //层级数据
                    hierarchy = md5AnimData.hierarchy[i];
                    //基础帧数据
                    base = md5AnimData.baseframe[i];
                    //层级标记
                    flags = hierarchy.flags;
                    translation.x = base.position[0];
                    translation.y = base.position[1];
                    translation.z = base.position[2];
                    var orientation: Quaternion = new Quaternion();
                    orientation.x = base.orientation[0];
                    orientation.y = base.orientation[1];
                    orientation.z = base.orientation[2];

                    //调整位移与角度数据
                    if (flags & 1)
                        translation.x = components[hierarchy.startIndex + (j++)];
                    if (flags & 2)
                        translation.y = components[hierarchy.startIndex + (j++)];
                    if (flags & 4)
                        translation.z = components[hierarchy.startIndex + (j++)];
                    if (flags & 8)
                        orientation.x = components[hierarchy.startIndex + (j++)];
                    if (flags & 16)
                        orientation.y = components[hierarchy.startIndex + (j++)];
                    if (flags & 32)
                        orientation.z = components[hierarchy.startIndex + (j++)];

                    //计算四元素w值
                    var w = 1 - orientation.x * orientation.x - orientation.y * orientation.y - orientation.z * orientation.z;
                    orientation.w = w < 0 ? 0 : -Math.sqrt(w);

                    orientation.y = -orientation.y;
                    orientation.z = -orientation.z;
                    translation.x = -translation.x;

                    var eulers = orientation.toEulerAngles();
                    eulers.scaleNumber(180 / Math.PI);

                    var path: PropertyClipPath = [
                        [PropertyClipPathItemType.GameObject, hierarchy.name],
                        [PropertyClipPathItemType.Component, "feng3d.Transform"],
                    ];

                    var time = (frameData.index / md5AnimData.frameRate) * 1000;
                    setPropertyClipFrame(path, "position", time, translation.toArray(), "Vector3");
                    setPropertyClipFrame(path, "orientation", time, orientation.toArray(), "Quaternion");

                }

                function setPropertyClipFrame(path: PropertyClipPath, propertyName: string, time: number, propertyValue: number[], type: string)
                {
                    var propertyClip = getPropertyClip(path, propertyName);
                    propertyClip.type = <any>type;
                    propertyClip.propertyValues.push([time, propertyValue]);
                }

                function getPropertyClip(path: PropertyClipPath, propertyName: string)
                {
                    var key = path.join("-") + propertyName;
                    if (__chache__[key])
                        return __chache__[key];
                    if (!__chache__[key])
                    {
                        var propertyClip = __chache__[key] = new PropertyClip();
                        propertyClip.path = path;
                        propertyClip.propertyName = propertyName;
                        propertyClip.propertyValues = [];
                        animationclip.propertyClips.push(propertyClip);
                    }
                    return __chache__[key];
                }

            }
        }
    }

    md5AnimConverter = new MD5AnimConverter();
}
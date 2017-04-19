module feng3d
{

    /**
     * 获取feng3d运行时间，毫秒为单位
     */
    export function getTimer(): number
    {
        return Date.now() - ticker.startTime;
    }
}
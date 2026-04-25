/**
 * A flag representing each UV channel.
 * 一个代表每个紫外线频道的旗子。
 */
export enum UVChannelFlags
{
    /**
     * 无通道。
     */
    Nothing = 0,
    /**
     * First UV channel.
     * 第一UV通道。
     */
    UV0 = 1,
    /**
     * Second UV channel.
     * 第二UV通道。
     */
    UV1 = 2,
    /**
     * Third UV channel.
     * 第三UV通道。
     */
    UV2 = 4,
    /**
     * Fourth UV channel.
     * 第四UV通道。
     */
    UV3 = 8,
    /**
     * All channel.
     * 所有通道。
     */
    Everything = UV0 | UV1 | UV2 | UV3,
}

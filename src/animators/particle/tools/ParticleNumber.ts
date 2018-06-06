namespace feng3d
{
    /**
     * 粒子数字类型
     */
    export enum ParticleNumberType
    {
        /**
         * 常数
         */
        constant,

        /**
         * 曲线
         */
        curve,

        /**
         * 两个常量之间进行随机
         */
        randomBetweenTwoConstants,

        /**
         * 两个曲线之间进行随机
         */
        randomBetweenTwoCurves,
    }

    /**
     * 粒子数字，被用与生成粒子起始寿命等
     */
    export class ParticleNumber
    {
        /**
         * 类型
         */
        type: ParticleNumberType;

        /**
         * 常量，type 为 ParticleNumberType.constant 与 ParticleNumberType.randomBetweenTwoConstants 时有效。
         */
        constant = 0;

        /**
         * 第二个常量，type 为 ParticleNumberType.randomBetweenTwoConstants 时有效，将与 constant 属性配合使用。
         */
        constant1 = 0;


    }
}
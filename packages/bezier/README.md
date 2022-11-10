### Bézier曲线
https://wardenfeng.github.io/bezier

创建该库的原始目的是为了解决feng3d引擎粒子中时间与常量的变化曲线问题。

制作Bézier曲线这个库忙了整整3天了，感觉要跳进高等代数的坑了，得赶紧爬出这个坑，这坑太深了，以后再来跳。

说了不陷入，结果又制作了 EquationSolving.ts 提供了方程求解功能。

#### 核心文件
1. Bezier.ts  Bézier曲线

##### Bezier.ts
解决任意Bézier曲线的求值求导获取极值等问题。
1. 1次Bézier曲线 
    * 求值 ``` bezier.linear ```
    * 导数 ``` bezier.linearDerivative ```
    * 二阶导数 ``` bezier.linearSecondDerivative ```
1. 2次Bézier曲线 
    * 求值 ``` bezier.quadratic ```
    * 导数 ``` bezier.quadraticDerivative ```
    * 二阶导数 ``` bezier.quadraticSecondDerivative ```
1. 3次Bézier曲线 
    * 求值 ``` bezier.cubic ```
    * 导数 ``` bezier.cubicDerivative ```
    * 二阶导数 ``` bezier.cubicSecondDerivative ```
1. n次Bézier曲线的值  n > 0
    * 求值 ``` bezier.getValue ```
    * 导数 ``` bezier.getDerivative ```
    * 二阶导数 ``` bezier.getSecondDerivative ```
    * N阶导数 ``` bezier.bnND ```
1. n次Bézier曲线的极值列表 ``` bezier.getExtremums ```
1. n次Bézier曲线的区间列表 ``` bezier.getMonotoneIntervals ```
1. 查找区间内极值列表 ```  bezier.getExtremums ```
1. 获取目标值所在的插值度T ```  bezier.getTFromValue ```
1. 分割曲线，在曲线插值度t位置分割为两条连接起来与原曲线完全重合的曲线 ``` bezier.split ```
1. 合并曲线，合并两条连接的曲线为一条曲线并且可以还原为分割前的曲线 ``` bezier.merge ```

##### EquationSolving.ts
解决任意一元函数求导以及方程求解等问题。
1. 获取近似导函数 f'(x) ``` equationSolving.getDerivative ```
1. 二分法 求解 f(x) == 0 ``` equationSolving.binary ```
1. 连线法 求解 f(x) == 0 ``` equationSolving.line ```
1. 切线法 求解 f(x) == 0 ``` equationSolving.tangent ```
1. 割线法（弦截法） 求解 f(x) == 0 ``` equationSolving.secant ```

#### 示例
##### 使用BezierCurve进行模拟canvas提供的 bezierCurveTo方法

[quickstart website](examples/BezierCurveTo.html ':include :type=iframe width=100% height=400px')

##### 随机生成n阶Bézier曲线并且播放插值动画

[quickstart website](examples/BezierCurveAnimation.html ':include :type=iframe width=100% height=400px')

##### Bézier曲线编辑器

[quickstart website](examples/BezierEditor.html ':include :type=iframe width=100% height=400px')

##### 连续三阶Bézier曲线编辑

[quickstart website](examples/CubicBezierSequenceEditor.html ':include :type=iframe width=100% height=400px')

##### 基于时间轴的连续三阶Bézier曲线编辑

该示例已经满足feng3d中曲线编辑器的需求。

[quickstart website](examples/TimeLineCubicBezierSequenceEditor.html ':include :type=iframe width=100% height=400px')

#### 单元测试

[quickstart website](tests/index.html ':include :type=iframe width=100% height=400px')

#### 参考资料
1. https://en.wikipedia.org/wiki/B%C3%A9zier_curve
1. https://baike.baidu.com/item/%E8%B4%9D%E5%A1%9E%E5%B0%94%E6%9B%B2%E7%BA%BF/1091769
1. https://blog.csdn.net/venshine/article/details/51750906
1. https://github.com/venshine/BezierMaker
1. https://github.com/gre/bezier-easing
1. https://github.com/vrk/beziertool
1. https://github.com/gre/bezier-easing-editor
1. 高等数学 第七版上册 第三章第八节 方程的近似解

#### 关于作者

网站：http://feng3d.com/

github：https://github.com/wardenfeng

github：https://github.com/feng3d-labs

getee：https://gitee.com/feng3d

feng3d交流QQ群:519732759
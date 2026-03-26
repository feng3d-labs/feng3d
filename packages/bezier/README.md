# @feng3d/bezier
解决n次Bézier曲线拟合与求解问题。

示例: https://feng3d.com/bezier

源码：https://gitee.com/feng3d/bezier.git

文档：https://feng3d.com/bezier/docs

## 安装
```
npm install @feng3d/bezier
```

## 使用
```typescript
// 引入bezier库
import { bezier } from "@feng3d/bezier";

// 允许误差
const deviation = 0.0000001;

// 生成一个随机数t
const t = Math.random();
// 生成四个随机数作为贝塞尔曲线的控制点
const ps = [Math.random(), Math.random(), Math.random(), Math.random()];
// 计算三次贝塞尔曲线在t处的值
const v0 = bezier.cubic(t, ps[0], ps[1], ps[2], ps[3]);
// 计算贝塞尔曲线在t处的值（使用bn方法）
const v1 = bezier.bn(t, ps);

// 检查v0和v1是否在允许的误差范围内
console.log(Math.abs(v0 - v1) < deviation); // true 

// 计算贝塞尔曲线在t处的值（使用getValue方法）
const v2 = bezier.getValue(t, ps);
// 检查v0和v2是否在允许的误差范围内
console.log(Math.abs(v0 - v2) < deviation);
```

## 核心文件
1. Bezier.ts  Bézier曲线

### Bezier.ts
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

### EquationSolving.ts
解决任意一元函数求导以及方程求解等问题。
1. 获取近似导函数 f'(x) ``` equationSolving.getDerivative ```
1. 二分法 求解 f(x) == 0 ``` equationSolving.binary ```
1. 连线法 求解 f(x) == 0 ``` equationSolving.line ```
1. 切线法 求解 f(x) == 0 ``` equationSolving.tangent ```
1. 割线法（弦截法） 求解 f(x) == 0 ``` equationSolving.secant ```

## 参考资料
1. https://en.wikipedia.org/wiki/B%C3%A9zier_curve
1. https://baike.baidu.com/item/%E8%B4%9D%E5%A1%9E%E5%B0%94%E6%9B%B2%E7%BA%BF/1091769
1. https://blog.csdn.net/venshine/article/details/51750906
1. https://github.com/venshine/BezierMaker
1. https://github.com/gre/bezier-easing
1. https://github.com/vrk/beziertool
1. https://github.com/gre/bezier-easing-editor
1. 高等数学 第七版上册 第三章第八节 方程的近似解

## 关于作者

网站：http://feng3d.com/

getee：https://gitee.com/feng3d

github：https://github.com/feng3d-labs

feng3d交流QQ群:519732759
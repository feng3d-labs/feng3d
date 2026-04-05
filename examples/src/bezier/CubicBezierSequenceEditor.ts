import { bezier } from 'feng3d';
import { clearCanvas, createCanvas, drawPoints, drawPointsCurve } from './Common';

(() =>
{
    // 创建画布
    const canvas = createCanvas(0, 60, window.innerWidth, window.innerHeight - 60);

    // window.addEventListener("click", onMouseClick)
    window.addEventListener('mousedown', onMouseDown);

    /**
     * 点绘制尺寸
     */
    const pointSize = 16;

    // 第一条曲线  [0,3]
    // 第二条曲线  [3,6]
    const xs: number[] = [];
    const ys: number[] = [];
    addPoint(Math.random() * canvas.width, Math.random() * canvas.height);
    addPoint(Math.random() * canvas.width, Math.random() * canvas.height);

    let editIndex = -1;
    let editing = false;
    const mousedownxy = { x: -1, y: -1 };

    function onMouseDown(ev: MouseEvent)
    {
        const rect = canvas.getBoundingClientRect();
        if (!(rect.left < ev.clientX && ev.clientX < rect.right && rect.top < ev.clientY && ev.clientY < rect.bottom))
        { return; }
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        mousedownxy.x = x;
        mousedownxy.y = y;

        editIndex = findPoint(x, y);

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    function onMouseMove(ev: MouseEvent)
    {
        if (editIndex === -1)
        {
            return;
        }
        editing = true;

        const rect = canvas.getBoundingClientRect();
        if (!(rect.left < ev.clientX && ev.clientX < rect.right && rect.top < ev.clientY && ev.clientY < rect.bottom))
        {
            return;
        }
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        if (editIndex % 3 === 0) // 关键点
        {
            const offsetx = x - xs[editIndex];
            const offsety = y - ys[editIndex];

            xs[editIndex] = x;
            ys[editIndex] = y;
            // 同时以移动左边控制点
            if (editIndex > 0)
            {
                xs[editIndex - 1] += offsetx;
                ys[editIndex - 1] += offsety;
            }
            // 同时以移动右边控制点
            if (editIndex + 1 < xs.length)
            {
                xs[editIndex + 1] += offsetx;
                ys[editIndex + 1] += offsety;
            }
        }
        else if (editIndex % 3 === 1) // 右边控制点
        {
            // 改变左边控制点
            if (editIndex - 2 > -1)
            {
                const leftLength = Math.sqrt((xs[editIndex - 2] - xs[editIndex - 1]) * (xs[editIndex - 2] - xs[editIndex - 1]) + (ys[editIndex - 2] - ys[editIndex - 1]) * (ys[editIndex - 2] - ys[editIndex - 1]));
                const rightLength = Math.sqrt((xs[editIndex - 1] - xs[editIndex]) * (xs[editIndex - 1] - xs[editIndex]) + (ys[editIndex - 1] - ys[editIndex]) * (ys[editIndex - 1] - ys[editIndex]));
                //
                if (Math.abs((x - xs[editIndex - 1]) * (y - ys[editIndex - 1])) > 0.01)
                {
                    xs[editIndex - 2] -= (x - xs[editIndex]) * leftLength / rightLength;
                    ys[editIndex - 2] -= (y - ys[editIndex]) * leftLength / rightLength;
                    //
                    xs[editIndex] = x;
                    ys[editIndex] = y;
                }
                // else
                // {
                //     debugger;
                // }
            }
            else
            {
                xs[editIndex] = x;
                ys[editIndex] = y;
            }
        }
        else if (editIndex % 3 === 2) // 左边控制点
        {
            // 改变右边控制点
            if (editIndex + 2 < xs.length)
            {
                const leftLength = Math.sqrt((xs[editIndex + 1] - xs[editIndex]) * (xs[editIndex + 1] - xs[editIndex]) + (ys[editIndex + 1] - ys[editIndex]) * (ys[editIndex + 1] - ys[editIndex]));
                const rightLength = Math.sqrt((xs[editIndex + 2] - xs[editIndex + 1]) * (xs[editIndex + 2] - xs[editIndex + 1]) + (ys[editIndex + 2] - ys[editIndex + 1]) * (ys[editIndex + 2] - ys[editIndex + 1]));
                //
                if (Math.abs((xs[editIndex + 1] - x) * (ys[editIndex + 1] - y)) > 0.01)
                {
                    xs[editIndex + 2] -= (x - xs[editIndex]) * rightLength / leftLength;
                    ys[editIndex + 2] -= (y - ys[editIndex]) * rightLength / leftLength;
                    //
                    xs[editIndex] = x;
                    ys[editIndex] = y;
                }
                // else
                // {
                //     debugger;
                // }
            }
            else
            {
                xs[editIndex] = x;
                ys[editIndex] = y;
            }
        }
    }

    function onMouseUp(ev: MouseEvent)
    {
        if (editing)
        {
            editing = false;
            editIndex = -1;

            return;
        }
        const rect = canvas.getBoundingClientRect();
        if (!(rect.left < ev.clientX && ev.clientX < rect.right && rect.top < ev.clientY && ev.clientY < rect.bottom))
        { return; }
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;

        if (Math.abs(mousedownxy.x - x) > 5 || Math.abs(mousedownxy.y - y) > 5)
        {
            // 有移动鼠标，无效点击
            return;
        }

        const index = findPoint(x, y);
        if (index % 3 === 0)
        {
            deletePoint(index);
        }
        else if (index === -1)
        {
            // 没有选中关键与控制点时，检查是否点击到曲线
            const result = findCurve(x, y);
            if (result !== null)
            {
                addPointAtCurve(result.index, result.t);
            }
            else
            {
                addPoint(x, y);
            }
        }

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    }

    function findPoint(x: number, y: number)
    {
        for (let i = 0; i < xs.length; i++)
        {
            if (Math.abs(xs[i] - x) < pointSize / 2 && Math.abs(ys[i] - y) < pointSize / 2)
            {
                return i;
            }
        }

        return -1;
    }

    /**
     * 查找点所在的曲线
     * @param x x坐标
     * @param y y坐标
     */
    function findCurve(x: number, y: number)
    {
        for (let i = 0, n = xs.length / 3; i < n; i++)
        {
            // 使用 bezierCurve 进行采样曲线点
            if (i > 0)
            {
                const sxs = xs.slice(i * 3 - 3, i * 3 + 1);
                const sys = ys.slice(i * 3 - 3, i * 3 + 1);
                // 先在曲线上找到y再比较x
                const yTs = bezier.getTFromValue(y, sys);
                for (let j = 0; j < yTs.length; j++)
                {
                    const xv = bezier.getValue(yTs[j], sxs);
                    if (Math.abs(xv - x) < pointSize / 2)
                    {
                        return { index: i, t: yTs[j] };
                    }
                }
                // 先在曲线上找到x再比较y
                const xTs = bezier.getTFromValue(x, sxs);
                for (let j = 0; j < xTs.length; j++)
                {
                    const yv = bezier.getValue(xTs[j], sys);
                    if (Math.abs(yv - y) < pointSize / 2)
                    {
                        return { index: i, t: xTs[j] };
                    }
                }
            }
        }

        return null;
    }

    function deletePoint(index: number)
    {
        if (index === 0)
        {
            xs.splice(index, 3);
            ys.splice(index, 3);
        }
        else if (index === xs.length - 1)
        {
            xs.splice(index - 2, 3);
            ys.splice(index - 2, 3);
        }
        else
        {
            const leftLength = Math.sqrt((xs[index - 1] - xs[index]) * (xs[index - 1] - xs[index]) + (ys[index - 1] - ys[index]) * (ys[index - 1] - ys[index]));
            const rightLength = Math.sqrt((xs[index + 1] - xs[index]) * (xs[index + 1] - xs[index]) + (ys[index + 1] - ys[index]) * (ys[index + 1] - ys[index]));
            // 删除点处相当于删除后曲线t值
            const deleteT = leftLength / (leftLength + rightLength);

            // 放大
            xs[index - 2] = xs[index - 3] + (xs[index - 2] - xs[index - 3]) / deleteT;
            ys[index - 2] = ys[index - 3] + (ys[index - 2] - ys[index - 3]) / deleteT;
            //
            xs[index + 2] = xs[index + 3] + (xs[index + 2] - xs[index + 3]) / (1 - deleteT);
            ys[index + 2] = ys[index + 3] + (ys[index + 2] - ys[index + 3]) / (1 - deleteT);
            //
            xs.splice(index - 1, 3);
            ys.splice(index - 1, 3);
        }
    }

    function addPoint(x: number, y: number)
    {
        if (xs.length > 0)
        {
            const lastx = xs[xs.length - 1];
            const lasty = ys[ys.length - 1];
            // 自动新增两个控制点
            let cx0 = bezier.linear(1 / 3, lastx, x);
            let cy0 = bezier.linear(1 / 3, lasty, y);
            if (xs.length - 2 > -1)
            {
                cx0 = lastx * 2 - xs[xs.length - 2];
                cy0 = lasty * 2 - ys[ys.length - 2];
            }
            const cx1 = bezier.linear(2 / 3, cx0, x);
            const cy1 = bezier.linear(2 / 3, cy0, y);
            //
            xs.push(cx0, cx1, x);
            ys.push(cy0, cy1, y);
        }
        else
        {
            xs.push(x);
            ys.push(y);
        }
    }

    /**
     * 在指定曲线上添加点
     * @param curveIndex 曲线编号
     * @param t 曲线插值度
     */
    function addPointAtCurve(curveIndex: number, t: number)
    {
        // 获取当前曲线
        const sxs = xs.slice(curveIndex * 3 - 3, curveIndex * 3 + 1);
        const sys = ys.slice(curveIndex * 3 - 3, curveIndex * 3 + 1);
        const processsx: number[][] = [];
        bezier.bn(t, sxs, processsx);
        const processsy: number[][] = [];
        bezier.bn(t, sys, processsy);

        const nxs: number[] = [];
        const nys: number[] = [];
        processsx;
        for (let i = processsx.length - 1; i >= 0; i--)
        {
            if (i === processsx.length - 1)
            {
                // 添加关键点
                nxs.push(processsx[i][0]);
                nys.push(processsy[i][0]);
            }
            else
            {
                // 添加左右控制点
                nxs.unshift(processsx[i][0]);
                nxs.push(processsx[i].pop());
                nys.unshift(processsy[i][0]);
                nys.push(processsy[i].pop());
            }
        }
        // eslint-disable-next-line prefer-spread
        xs.splice.apply(xs, [curveIndex * 3 - 3, 4].concat(nxs));
        // eslint-disable-next-line prefer-spread
        ys.splice.apply(ys, [curveIndex * 3 - 3, 4].concat(nys));
    }

    requestAnimationFrame(draw);

    function draw()
    {
        clearCanvas(canvas);

        for (let i = 0, n = xs.length / 3; i < n; i++)
        {
            // 使用 bezierCurve 进行采样曲线点
            if (i > 0)
            {
                const sxs = xs.slice(i * 3 - 3, i * 3 + 1);
                const sys = ys.slice(i * 3 - 3, i * 3 + 1);

                const xSamples = bezier.getSamples(sxs);
                const ySamples = bezier.getSamples(sys);
                // 绘制曲线
                drawPointsCurve(canvas, xSamples, ySamples, 'white', 3);
            }

            // 绘制曲线端点
            drawPoints(canvas, xs.slice(i * 3, i * 3 + 1), ys.slice(i * 3, i * 3 + 1), 'red', pointSize);

            // 绘制控制点
            if (i > 0)
            {
                drawPoints(canvas, xs.slice(i * 3 - 1, i * 3 + 0), ys.slice(i * 3 - 1, i * 3 + 0), 'blue', pointSize);
            }
            if (i < n - 1)
            {
                drawPoints(canvas, xs.slice(i * 3 + 1, i * 3 + 2), ys.slice(i * 3 + 1, i * 3 + 2), 'blue', pointSize);
            }

            // 绘制控制点之间的连线
            if (i > 0)
            {
                drawPointsCurve(canvas, xs.slice(i * 3 - 1, i * 3 + 1), ys.slice(i * 3 - 1, i * 3 + 1), 'yellow', 1);
            }
            if (i < n - 1)
            {
                drawPointsCurve(canvas, xs.slice(i * 3 + 0, i * 3 + 2), ys.slice(i * 3 + 0, i * 3 + 2), 'yellow', 1);
            }
        }
        //
        requestAnimationFrame(draw);
    }
})();

/**
 * Tween 工具模块
 * 直接使用 @tweenjs/tween.js
 * 每个 Tween 实例单独管理更新循环：start() 时启动，完成或停止时停止
 * 使用推荐的 Group 方式，而不是过时的 TWEEN.update() 和 TWEEN.getAll()
 */
import { Tween, Group, Easing as TweenEasing } from '@tweenjs/tween.js';

// 创建一个全局 Group 来管理所有 tween
const tweenGroup = new Group();

// 活动的 tween 实例集合
const activeTweens = new Set<Tween<any>>();

// 更新循环管理
let isTweenStarted = false;
let animationFrameId: number | null = null;

/**
 * 启动 TWEEN 更新循环
 */
function startTweenUpdate()
{
    if (isTweenStarted)
    {
        return;
    }
    isTweenStarted = true;

    function animate(time: number)
    {
        // 使用 requestAnimationFrame 的时间戳，确保与浏览器渲染循环同步
        // 注意：requestAnimationFrame 的时间是相对于页面加载的时间（毫秒）
        // 使用推荐的 Group.update() 方法，而不是过时的 TWEEN.update()
        tweenGroup.update(time);

        // 清理已完成的 tween（不在 group 中的 tween 表示已完成）
        // 使用推荐的 group.getAll() 方法，而不是过时的 TWEEN.getAll()
        const allTweens = tweenGroup.getAll();
        const allTweenSet = new Set(allTweens);
        activeTweens.forEach((tween) =>
        {
            if (!allTweenSet.has(tween))
            {
                // tween 已完成，从活动集合移除
                activeTweens.delete(tween);
            }
        });

        // 检查是否还有活动的 tween，如果没有则停止更新循环
        // 使用 group.getAll() 检查，而不是过时的 TWEEN.getAll()
        if (tweenGroup.getAll().length === 0)
        {
            // 没有活动的 tween，停止更新循环
            isTweenStarted = false;
            if (animationFrameId !== null)
            {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            return;
        }

        animationFrameId = requestAnimationFrame(animate);
    }
    animationFrameId = requestAnimationFrame(animate);
}

/**
 * 停止 TWEEN 更新循环（当没有活动的 tween 时）
 */
function stopTweenUpdateIfNeeded()
{
    // 使用推荐的 group.getAll() 方法，而不是过时的 TWEEN.getAll()
    if (tweenGroup.getAll().length === 0 && isTweenStarted)
    {
        isTweenStarted = false;
        if (animationFrameId !== null)
        {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
}

// 保存原始方法
const originalStart = Tween.prototype.start;
const originalStop = Tween.prototype.stop;
const originalEnd = Tween.prototype.end;

// 重写 start 方法：每个实例在 start() 时启动更新循环
Tween.prototype.start = function(time?: number)
{
    // 调用原始的 start 方法
    const result = originalStart.call(this, time);

    // 将当前 tween 添加到 group 和活动集合
    tweenGroup.add(this);
    activeTweens.add(this);

    // 如果有活动的 tween，自动启动更新循环
    if (typeof window !== 'undefined')
    {
        startTweenUpdate();
    }

    return result;
};

// 重写 stop 方法：每个实例在 stop() 时从活动集合移除
Tween.prototype.stop = function()
{
    // 调用原始的 stop 方法
    const result = originalStop.call(this);

    // 从 group 和活动集合移除
    tweenGroup.remove(this);
    activeTweens.delete(this);

    // 检查是否需要停止更新循环
    stopTweenUpdateIfNeeded();

    return result;
};

// 重写 end 方法：每个实例在 end() 时从活动集合移除
Tween.prototype.end = function()
{
    // 调用原始的 end 方法
    const result = originalEnd.call(this);

    // 从 group 和活动集合移除
    tweenGroup.remove(this);
    activeTweens.delete(this);

    // 检查是否需要停止更新循环
    stopTweenUpdateIfNeeded();

    return result;
};

// 监听 tween 完成事件，从活动集合移除
// 由于 Group 在 update 时会自动移除完成的 tween，我们需要在 onComplete 中处理
// 但更好的方式是在 update 后检查，或者重写 onComplete
// 这里我们通过包装 onComplete 来实现
const originalOnComplete = Tween.prototype.onComplete;

Tween.prototype.onComplete = function(callback?: (object: any) => void)
{
    // 调用原始的 onComplete，并包装回调
    return originalOnComplete.call(this, (object: any) =>
    {
        // 从 group 和活动集合移除
        tweenGroup.remove(this);
        activeTweens.delete(this);

        // 检查是否需要停止更新循环
        stopTweenUpdateIfNeeded();

        // 调用用户提供的回调
        if (callback)
        {
            callback(object);
        }
    });
};

// 直接导出，不需要重新包装
export { Tween, Group };
export { TweenEasing as Easing };

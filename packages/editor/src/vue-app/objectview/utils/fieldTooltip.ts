/**
 * 字段标签的悬停提示：把**浏览器原生 `title`** 换成受约束的面板内提示。
 *
 * ## 为什么不能继续用原生 title
 *
 * 原生 title 由浏览器自己画（不在文档流里、也不受 CSS 约束），Chromium 只按**屏幕**边界收，
 * 不按**窗口**边界收。检查器面板恰好贴在窗口右缘，于是提示会跑到窗口外面——
 * 用户看到的就是「tips 超出窗口」。
 *
 * 这里把 `title` 摘下来（原生提示因此不再弹出），改用一个固定在文档里的提示元素，
 * 定位时把右/下边界夹到视口内（放不下就翻到上方），宽度也限制在视口内。
 *
 * ## 显示什么
 *
 * - 标签**被省略号截断**时，显示完整标签文字（这才是用户需要的信息）；
 * - 没截断时显示原 `title` 里的英文字段名（对应 TypeScript 字段名，排查/AI 对齐时有用）；
 * - 两者都没有就不弹。
 *
 * ## 为什么用全局事件委托而不是改 20 个控件
 *
 * 标签由 20 个 OAV 控件各自渲染，逐个改模板既啰嗦又必然漏。这里在捕获阶段监听一次
 * `mouseover`/`mouseout`，对任何 `.oav-label[title]` 生效——**以后新增的控件自动受益**。
 */

/** 提示元素的类名（样式在 styles/object-view.css） */
const TIP_CLASS = 'oav-field-tip';

/** 提示与目标之间的间距（px） */
const GAP = 6;

/** 距视口边缘的最小留白（px） */
const MARGIN = 8;

/** 提示元素（懒创建，单例复用） */
let tip: HTMLDivElement | null = null;

/** 当前正在提示的目标（用于忽略无关的 mouseover / mouseout） */
let currentTarget: HTMLElement | null = null;

/** 是否已安装（重复调用无副作用） */
let installed = false;

/** 取（必要时创建）提示元素 */
function getTip(): HTMLDivElement
{
    if (tip) return tip;

    tip = document.createElement('div');
    tip.className = TIP_CLASS;
    tip.hidden = true;
    document.body.appendChild(tip);

    return tip;
}

/** 隐藏提示 */
function hideTip(): void
{
    currentTarget = null;
    if (tip) tip.hidden = true;
}

/**
 * 找鼠标所在的可提示标签。
 *
 * 注意**不能**用 `[title]` 作选择器：`title` 在渲染时就被摘掉了（见 {@link stripTitles}），
 * 靠它匹配会一个也找不到。这里只看类名，是否需要提示由 {@link showTip} 判断
 * （被截断，或有 `data-tip`）。
 *
 * @param target 事件目标
 * @returns 标签元素；不是标签时返回 null
 */
function findLabel(target: EventTarget | null): HTMLElement | null
{
    if (!(target instanceof HTMLElement)) return null;

    return target.closest<HTMLElement>('.oav-label, .obv-inline-title');
}

/**
 * 显示提示，并把它夹在视口内。
 *
 * @param label 目标标签
 */
function showTip(label: HTMLElement): void
{
    // 兜底：万一有标签漏过 MutationObserver（例如面板在观察者安装前就建好），这里再摘一次
    stripTitles(label);

    // 标签被截断时，完整标签文字信息量最大；否则退回英文字段名
    const truncated = label.scrollWidth > label.clientWidth + 1;
    const text = truncated ? (label.textContent ?? '').trim() : (label.dataset.tip ?? '').trim();
    if (text.length === 0)
    {
        hideTip();

        return;
    }

    const element = getTip();
    element.textContent = text;
    element.hidden = false;
    currentTarget = label;

    // 先放在标签下方左对齐，再按视口夹紧——宽度受 max-width 限制，所以量出来的高度可能换行
    const labelRect = label.getBoundingClientRect();
    const tipRect = element.getBoundingClientRect();

    let left = labelRect.left;
    if (left + tipRect.width > window.innerWidth - MARGIN)
    {
        left = window.innerWidth - MARGIN - tipRect.width;
    }
    left = Math.max(MARGIN, left);

    let top = labelRect.bottom + GAP;
    if (top + tipRect.height > window.innerHeight - MARGIN)
    {
        // 下方放不下就翻到上方；上方也放不下则夹到下边界之内
        top = Math.max(MARGIN, labelRect.top - GAP - tipRect.height);
    }

    element.style.left = `${Math.round(left)}px`;
    element.style.top = `${Math.round(top)}px`;
}

/**
 * 把元素上的 `title` 摘下来存进 `data-tip`。
 *
 * 摘掉的目的是**让浏览器原生提示永不出现**（它不受窗口约束）。不摘的话，
 * 即使 mouseover 时再摘，也可能在某些触发路径（如键盘聚焦、无障碍工具）下漏掉。
 *
 * @param root 在该子树里查找标签（自身也检查）
 * @returns 摘掉 title 的标签数量
 */
function stripTitles(root: ParentNode): number
{
    const labels: Element[] = [];
    if (root instanceof HTMLElement && root.matches('.oav-label[title], .obv-inline-title[title]'))
    {
        labels.push(root);
    }
    labels.push(...root.querySelectorAll('.oav-label[title], .obv-inline-title[title]'));

    for (const label of labels)
    {
        const title = label.getAttribute('title');
        if (title === null) continue;
        (label as HTMLElement).dataset.tip = title;
        label.removeAttribute('title');
    }

    return labels.length;
}

/** 安装字段标签的悬停提示。
 *
 * 幂等：重复调用只装一次。由 `vue-app/main.ts` 在启动时调用一次。
 */
export function installFieldTooltip(): void
{
    if (installed) return;
    installed = true;

    getTip();

    // 属性面板是**按需渲染**的（选中对象/展开分组时才建 DOM），所以不能只在启动时摘一遍：
    // 盯着新加入的子树，标签一出现就摘掉 title
    new MutationObserver((records) =>
    {
        for (const record of records)
        {
            for (const node of record.addedNodes)
            {
                if (node instanceof HTMLElement) stripTitles(node);
            }
        }
    }).observe(document.body, { childList: true, subtree: true });

    // 兼容启动时就已存在的标签
    stripTitles(document.body);

    // 捕获阶段监听：面板里的 DOM 是命令式挂载的，冒泡阶段同样能收到，但捕获更早、不受子元素拦截
    document.addEventListener(
        'mouseover',
        (event) =>
        {
            const label = findLabel(event.target);
            if (!label) return;
            if (label === currentTarget) return;

            showTip(label);
        },
        true,
    );

    document.addEventListener(
        'mouseout',
        (event) =>
        {
            const label = findLabel(event.target);
            if (!label || label !== currentTarget) return;
            // 在标签内部移动（label → 子节点）不算离开
            const related = event.relatedTarget;
            if (related instanceof Node && label.contains(related)) return;

            hideTip();
        },
        true,
    );

    // 滚动/点击/缩放后位置会失效，直接收起来（比跟着追位置简单且不会残留）
    for (const type of ['scroll', 'wheel', 'mousedown', 'resize'])
    {
        window.addEventListener(type, hideTip, true);
    }
}

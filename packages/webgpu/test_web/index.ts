/**
 * WebGPU 测试套件入口
 *
 * 管理所有测试页面，显示测试状态和结果
 */

// 导入自动生成的测试配置
import { tests as testConfigs } from './test-config';

interface TestInfo
{
    name: string;
    description: string;
    htmlFile: string;
    status: 'pending' | 'pass' | 'fail';
    error?: string;
    testName?: string; // 用于匹配 postMessage 中的 testName
    dirPath?: string; // 目录路径（相对于根目录）
    iframe?: HTMLIFrameElement;
}

// 从配置文件初始化测试列表
function initializeTests(): TestInfo[]
{
    return testConfigs.map((config) => ({
        name: config.name,
        description: config.description,
        htmlFile: config.htmlFile,
        testName: config.testName,
        dirPath: config.dirPath,
        status: 'pending' as const,
    }));
}

// 定义所有测试
const tests: TestInfo[] = initializeTests();

// 筛选状态：是否只显示失败的测试
let showFailuresOnly = false;

// 目录展开状态：记录哪些目录是展开的
const expandedDirs = new Set<string>();

// 更新统计信息
function updateSummary()
{
    const total = tests.length;
    const pass = tests.filter(t => t.status === 'pass').length;
    const fail = tests.filter(t => t.status === 'fail').length;
    const pending = tests.filter(t => t.status === 'pending').length;

    const statTotal = document.getElementById('stat-total');
    const statPass = document.getElementById('stat-pass');
    const statFail = document.getElementById('stat-fail');
    const statPending = document.getElementById('stat-pending');

    if (statTotal) statTotal.textContent = total.toString();
    if (statPass) statPass.textContent = pass.toString();
    if (statFail) statFail.textContent = fail.toString();
    if (statPending) statPending.textContent = pending.toString();
}

// 目录树节点接口
interface DirNode
{
    name: string; // 目录名称（最后一级）
    fullPath: string; // 完整路径
    level: number; // 层级深度
    tests: TestInfo[]; // 该目录下的测试
    children: Map<string, DirNode>; // 子目录
}

// 构建目录树
function buildDirTree(filteredTests: TestInfo[]): DirNode
{
    const root: DirNode = {
        name: '',
        fullPath: '.',
        level: 0,
        tests: [],
        children: new Map(),
    };

    filteredTests.forEach((test) =>
    {
        const dirPath = test.dirPath || '.';

        if (dirPath === '.')
        {
            root.tests.push(test);
        }
        else
        {
            const parts = dirPath.split('/');
            let current = root;

            parts.forEach((part, index) =>
            {
                if (!current.children.has(part))
                {
                    current.children.set(part, {
                        name: part,
                        fullPath: parts.slice(0, index + 1).join('/'),
                        level: index + 1,
                        tests: [],
                        children: new Map(),
                    });
                }
                current = current.children.get(part)!;
            });

            current.tests.push(test);
        }
    });

    return root;
}

// 递归收集所有目录路径
function collectAllDirPaths(node: DirNode, paths: Set<string>)
{
    node.children.forEach((child) =>
    {
        paths.add(child.fullPath);
        collectAllDirPaths(child, paths);
    });
}

// 递归渲染目录节点
function renderDirNode(node: DirNode, parentElement: HTMLElement)
{
    // 排序：按名称字母顺序排列
    const sortedChildren = Array.from(node.children.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
    );

    // 渲染子目录
    sortedChildren.forEach((child) =>
    {
        const isExpanded = expandedDirs.has(child.fullPath);

        // 目录标题
        const dirHeader = document.createElement('div');

        dirHeader.className = 'test-dir-header';
        dirHeader.style.cursor = 'pointer';
        dirHeader.style.paddingLeft = `${8 + child.level * 16}px`; // 根据层级缩进
        dirHeader.onclick = () => toggleDir(child.fullPath);

        const icon = document.createElement('span');

        icon.className = 'dir-icon';
        icon.textContent = isExpanded ? '▼' : '▶';
        icon.style.marginRight = '6px';
        icon.style.display = 'inline-block';
        icon.style.width = '10px';
        icon.style.fontSize = '9px';

        const dirName = document.createElement('span');

        dirName.textContent = child.name;

        dirHeader.appendChild(icon);
        dirHeader.appendChild(dirName);

        parentElement.appendChild(dirHeader);

        // 如果目录展开，显示测试项和子目录
        if (isExpanded)
        {
            // 渲染该目录下的测试
            child.tests.forEach((test) =>
            {
                const testIndex = tests.indexOf(test);
                const testItem = document.createElement('div');

                testItem.className = 'test-item';
                testItem.style.marginLeft = `${8 + (child.level + 1) * 16}px`; // 测试项缩进

                const statusClass = test.status;
                const statusText = test.status === 'pending' ? '待测试' : test.status === 'pass' ? '通过' : '失败';

                testItem.innerHTML = `
                    <div class="test-header">
                        <div class="test-title">${test.name}</div>
                        <div class="test-status ${statusClass}">${statusText}</div>
                        <button class="btn btn-primary" onclick="openTest(${testIndex})">查看</button>
                    </div>
                    <div class="test-description">${test.description}</div>
                    ${test.status === 'fail' && test.error ? `<div class="test-error">${test.error}</div>` : ''}
                `;

                parentElement.appendChild(testItem);
            });

            // 递归渲染子目录
            renderDirNode(child, parentElement);
        }
    });

    // 渲染根目录下的测试（如果有）
    if (node.level === 0 && node.tests.length > 0)
    {
        node.tests.forEach((test) =>
        {
            const testIndex = tests.indexOf(test);
            const testItem = document.createElement('div');

            testItem.className = 'test-item';

            const statusClass = test.status;
            const statusText = test.status === 'pending' ? '待测试' : test.status === 'pass' ? '通过' : '失败';

            testItem.innerHTML = `
                <div class="test-header">
                    <div class="test-title">${test.name}</div>
                    <div class="test-status ${statusClass}">${statusText}</div>
                    <button class="btn btn-primary" onclick="openTest(${testIndex})">查看</button>
                </div>
                <div class="test-description">${test.description}</div>
                ${test.status === 'fail' && test.error ? `<div class="test-error">${test.error}</div>` : ''}
            `;

            parentElement.appendChild(testItem);
        });
    }
}

// 渲染测试列表
function renderTestList()
{
    const testList = document.getElementById('test-list');

    if (!testList) return;

    testList.innerHTML = '';

    // 根据筛选条件过滤测试
    const filteredTests = showFailuresOnly
        ? tests.filter(test => test.status === 'fail')
        : tests;

    // 构建目录树
    const dirTree = buildDirTree(filteredTests);

    // 递归渲染目录树
    renderDirNode(dirTree, testList);

    updateSummary();
}

// 打开测试页面
export function openTest(index: number)
{
    const test = tests[index];

    if (test)
    {
        window.open(test.htmlFile, '_blank');
    }
}

// 运行单个测试
function runTest(index: number)
{
    const test = tests[index];

    if (!test) return;

    // 创建 iframe 来运行测试
    // 注意：WebGPU 需要可见的 canvas 才能正常工作
    // 将 iframe 放在一个很小的可见区域（右下角 1x1 像素），确保 canvas 完全可见
    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '400px'; // 保持 canvas 的实际尺寸，确保渲染正常
    iframe.style.height = '300px'; // 保持 canvas 的实际尺寸，确保渲染正常
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.zIndex = '-1'; // 放在最底层，不遮挡其他内容
    iframe.style.transform = 'scale(0.01)'; // 缩小到 1%，几乎看不见但完全可见
    iframe.style.transformOrigin = 'bottom right'; // 从右下角缩放
    iframe.style.pointerEvents = 'none'; // 禁用鼠标事件
    iframe.src = test.htmlFile;
    test.iframe = iframe;

    document.body.appendChild(iframe);

    // 设置超时，如果 30 秒内没有收到结果，标记为失败
    const timeout = setTimeout(() =>
    {
        if (test.status === 'pending')
        {
            test.status = 'fail';
            test.error = '测试超时（30秒内未完成）';
            renderTestList();

            // 移除 iframe
            if (iframe.parentNode)
            {
                iframe.parentNode.removeChild(iframe);
            }
        }
    }, 30000);

    iframe.onerror = () =>
    {
        clearTimeout(timeout);
        test.status = 'fail';
        test.error = 'iframe 加载失败';
        renderTestList();

        if (iframe.parentNode)
        {
            iframe.parentNode.removeChild(iframe);
        }
    };

    // 检查是否被重定向到主页
    iframe.onload = () =>
    {
        try
        {
            if (iframe.contentWindow && iframe.contentWindow.location.pathname === '/index.html')
            {
                clearTimeout(timeout);
                test.status = 'fail';
                test.error = 'iframe 被重定向到主页，可能页面不存在或加载失败。';
                renderTestList();
                if (iframe.parentNode)
                {
                    iframe.parentNode.removeChild(iframe);
                }
            }
        }
        catch (e)
        {
            // 跨域错误，无法访问 iframe.contentWindow.location
            // 忽略此错误，依靠 onerror 或超时处理
        }
    };

    // 监听 iframe 发送的消息
    const messageHandler = (event: MessageEvent) =>
    {
        if (event.data && event.data.type === 'test-result' && event.data.testName === test.testName)
        {
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);

            test.status = event.data.passed ? 'pass' : 'fail';
            if (event.data.message)
            {
                test.error = event.data.message;
            }
            else if (!event.data.passed)
            {
                test.error = '测试失败，但未提供详细错误信息';
            }

            // 延迟移除 iframe，确保测试完全完成
            setTimeout(() =>
            {
                if (iframe.parentNode)
                {
                    iframe.parentNode.removeChild(iframe);
                }
            }, 500);

            renderTestList();
        }
    };

    window.addEventListener('message', messageHandler);
}

// 运行所有测试
function runAllTests()
{
    for (let i = 0; i < tests.length; i++)
    {
        setTimeout(() => runTest(i), i * 500);
    }
}

// 切换目录展开/收拢状态
function toggleDir(dirPath: string)
{
    if (expandedDirs.has(dirPath))
    {
        expandedDirs.delete(dirPath);
    }
    else
    {
        expandedDirs.add(dirPath);
    }
    renderTestList();
}

// 初始化
document.addEventListener('DOMContentLoaded', () =>
{
    // 构建目录树以收集所有目录路径
    const dirTree = buildDirTree(tests);
    const allDirPaths = new Set<string>();

    collectAllDirPaths(dirTree, allDirPaths);

    // 默认展开所有目录
    allDirPaths.forEach((dirPath) =>
    {
        expandedDirs.add(dirPath);
    });

    // 绑定筛选复选框事件
    const filterCheckbox = document.getElementById('filter-failures') as HTMLInputElement;

    if (filterCheckbox)
    {
        filterCheckbox.addEventListener('change', (e) =>
        {
            showFailuresOnly = (e.target as HTMLInputElement).checked;
            renderTestList();
        });
    }

    renderTestList();
    runAllTests();
});

// 将函数暴露到全局作用域，以便 HTML 中的 onclick 可以调用
(window as any).openTest = openTest;


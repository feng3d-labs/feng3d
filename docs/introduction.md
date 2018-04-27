# 简介

## feng3d 是什么？

feng3d是一个用于交互式Web内容的可视化开发平台。 您构建的工具和Web应用程序都由HTML5提供支持。 该平台是网络托管项目所以没有什么需要安装的，您可以从任何运行支持的Web浏览器的设备访问您的工作。

## feng3d 的工作流

使用feng3d构建3D网络应用程序很容易。 为了充分利用feng3d，你需要编写一些代码(特别是一些网络的编程语言，比如Typescript(Javascript))。 但是，feng3d工具集旨在允许您可视化地编辑项目并以令人难以置信的简单性发布。

### 创建和上传素材资源

feng3d将支持各种工业标准资产格式。 例如，上传图片，3D模型，音频文件或自定义文本或二进制文件格式。

### 构造场景

feng3d编辑器是一个可视化建筑工具，用于构建场景。 使用内置组件，如3D模型、碰撞、粒子效果等，构建实体层次结构。

### 添加交互性

使用Typescript为您的实体附加自定义行为。 在任何规模上添加从简单的点击处理程序或轨道摄像机到完全大规模多玩家在线游戏的交互性。

### 发布你的应用

feng3d编辑器提供了导出项目为一个zip压缩包，执行index.html运行项目。

## 主要特征

### 编辑器

feng3d编辑器是一个让您在可记录的时间内构建场景的可视化编辑工具，应用程序和游戏。 使用编辑器管理项目资产，添加交互性。

你可以在 编辑器 部分了解更多。

### 资源

feng3d用于创建和管理交互式Web应用程序所需的所有资产。 PlayCanvas接受所有主要的3D文件格式，以及上传图片，音频和您需要的任何其他资产类型。

你可以在 资源 部分了解更多。

### 发布

feng3d编辑器支持即时下载您的完整项目，准备好在您自己的Web服务器上托管。

更多的细节可以阅读 发布 部分。

## 浏览器支持

feng3d 坚持设计为不需要任何插件在浏览器上原生运行的模式。用户运行时环境为 100% JavaScript 实现，全部通过符合 HTML5 及相关 API (如 WebGL)工作。为什么这样设计如此重要？

* 移动/平板 设备无法提供插件安装的权限，但却在不断完善对 HTML5 规范的支持。
* 不需要任何的安装和额外加载过程。
* 运行在标准的[DOM][2]元素中(一个 Canvas 元素)，可以任意和其他页面元素融合并通过 CSS 添加样式
* 不依赖可能会随着时间变化的第三方部分，仅仅依赖浏览器本身

在撰写本文时，浏览器的要求如下：

<table class="table table-striped table-bordered">
    <tr><th>Browser</th><th>Version</th><th>Win</th><th>MacOS X</th><th>Linux</th><th>Chrome OS</th><th>Android</th><th>iOS</th></tr>
    <tr><td style="text-align:center"><a href="http://www.google.com/chrome/">Chrome</a></td><td style="text-align:center">9.0+</td>
        <td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td>
    </tr>
    <tr><td style="text-align:center"><a href="http://www.mozilla.org/firefox/">Firefox</a></td><td style="text-align:center">4.0+</td>
        <td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td><td style="text-align:center"></td><td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td>
    </tr>
    <tr><td style="text-align:center"><a href="http://windows.microsoft.com/en-us/internet-explorer/download-ie">IE</a></td><td style="text-align:center">11.0+</td>
        <td style="text-align:center">&#x2713;</td><td style="text-align:center"></td><td style="text-align:center"></td><td style="text-align:center"></td><td style="text-align:center"></td><td style="text-align:center"></td>
    </tr>
    <tr><td style="text-align:center"><a href="https://www.microsoft.com/en-gb/windows/microsoft-edge">Edge</a></td><td style="text-align:center">12.0+</td>
        <td style="text-align:center">&#x2713;</td><td style="text-align:center"></td><td style="text-align:center"></td><td style="text-align:center"></td><td style="text-align:center"></td><td style="text-align:center"></td>
    </tr>
    <tr><td style="text-align:center"><a href="http://www.apple.com/safari/">Safari</a></td><td style="text-align:center">8.0+</td>
        <td style="text-align:center"></td><td style="text-align:center">&#x2713;</td><td style="text-align:center"></td><td style="text-align:center"></td><td style="text-align:center"></td><td style="text-align:center">&#x2713;</td>
    </tr>
    <tr><td style="text-align:center"><a href="http://www.opera.com/">Opera</a></td><td style="text-align:center">12.0+</td>
        <td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td><td style="text-align:center">&#x2713;</td><td style="text-align:center"></td><td style="text-align:center">&#x2713;</td><td style="text-align:center"></td>
    </tr>
</table>

如果你对你目前使用的浏览器是否支持 WebGL 有所担心的话( feng3d 依赖 WebGL)，可以试着访问 ![这个网站](https://get.webgl.org/)。如果你在这个网站上看到一个旋转的立方的话，就说明你已经完全准备就绪了！
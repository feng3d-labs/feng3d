# 快速开始

推荐安装 `docsify-cli` 工具，可以方便创建及本地预览文档网站。

```bash
npm i docsify-cli -g
```

## 初始化项目

如果想在项目的 `./docs` 目录里写文档，直接通过 `init` 初始化项目。

```bash
docsify init ./docs
```

feng3d
=======

开始尝试
---------

在[试验台](playground.md)尝试引擎的API，同时提供了一些简单的示例去学习如何使用feng3d引擎。

基于WebGL的3D渲染引擎

* [feng3d](https://gitee.com/feng3d/feng3d) 引擎
* [examples](https://gitee.com/feng3d/examples) 示例

配置项目环境
---------

* 安装 [vscode](https://code.visualstudio.com/)
* 安装 [Nodejs](https://nodejs.org)
* 打开vscode，从菜单 文件->打开文件夹 来打开feng-ts/feng3d文件夹。在vscode中按 Ctrl+` 打开DOS控制台（终端）
* 使用命令 `npm install -g typescript` 安装 TypeScript
* 使用命令 `npm install -g typings` 安装 Tpyings
* 直接运行[compile.cmd](https://github.com/feng3dTS/feng3d-ts/blob/master/compile.cmd) 或者使用 Ctrl+Shift+B 进行执行编译
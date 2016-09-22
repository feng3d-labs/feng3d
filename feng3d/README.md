# feng3d-ts
## 配置项目环境
* 安装 [vscode](https://code.visualstudio.com/)
* 安装 [Nodejs](https://nodejs.org)
* 打开vscode，从菜单 文件->打开文件夹 来打开feng-ts/feng3d文件夹。在vscode中按 Ctrl+` 打开DOS控制台（终端）
* 使用命令 `npm install -g typescript` 安装 TypeScript
* 使用命令 `npm install -g typings` 安装 Tpyings
* 使用 Ctrl+Shift+B 编译项目
## 编译feng3d到examples中
打开tsconfig.json文件更改 `"outFile": "../examples/libs/feng3d.js"` 使feng3d.js编译到examples项目中
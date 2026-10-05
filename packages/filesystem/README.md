# @feng3d/filesystem

一个文件系统模块，提供了文件系统的操作接口。

源码：https://gitee.com/feng3d/filesystem

文档：https://feng3d.com/filesystem

## 安装

```bash
npm install @feng3d/filesystem
```

## 使用

### 通过http请求读取文件
```html
<script type="module">
    import { HttpFS, ReadFS } from "@feng3d/filesystem";

    const readFs = new ReadFS(new HttpFS(""));

    const obj = await readFs.readObject("a.json");   // 读取json文件 a.json {"a":1}
    console.log(obj); // { a: 1 }
</script>
```

### 通过 http 读文件系统

> 决策 ①（2026-10-05）：**不再提供 IndexedDB 后端** —— 每个项目对应一个本地目录、
> 由宿主 Node 侧操作，网页端经 WebSocket 与宿主交互。
```html
<script type="module">
    import { HttpFS, ReadFS } from "@feng3d/filesystem";

    // 
    const httpReadFS = new ReadFS(new HttpFS());

    const obj1 = await httpReadFS.readObject("a.json");  // 读取json文件 a.json {"a":1}
    console.log(obj1); // { a: 1 }
</script>
```

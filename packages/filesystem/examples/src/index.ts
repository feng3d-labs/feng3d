import { HttpFS, ReadFS } from "@feng3d/filesystem";

// 通过Http请求读取文件系统
const httpReadFs = new ReadFS(new HttpFS(""));

const obj = await httpReadFs.readObject("a.json");   // 读取json文件 a.json {"a":1}
console.log(obj); // { a: 1 }

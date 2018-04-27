# 快速开始

## 添加html

在html中添加了feng3d.js
    
```
<!DOCTYPE html>
<html>
	<head>
		<meta charset=utf-8>
		<title>My first feng3d app</title>
		<style>
			body { margin: 0; }
			canvas { width: 100%; height: 100% }
		</style>
	</head>
	<body>
		<script src="http://feng3d.gitee.io/out/feng3d.js"></script>
		<script>
			// Our Javascript will go here.
		</script>
	</body>
</html>
```

## 初始化feng3d

在feng3d.Engine构造时会默认创建场景与摄像机
```
var engine = new feng3d.Engine();
```

## 添加对象到场景

创建一个立方体并添加到场景
```
var cube = feng3d.GameObjectFactory.createCube();
cube.transform.z = 2;
cube.transform.y = -2;
engine.scene.gameObject.addChild(cube);
```

## 添加动画

让立方体每帧进行旋转
```
feng3d.ticker.onframe(() =>
{
    cube.transform.ry++;
});
```

## 完整代码

[filename](_media/quickstart.html ':include :type=code')

## 运行结果

[quickstart website](_media/quickstart.html ':include :type=iframe width=100% height=400px')
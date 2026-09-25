import { computed, ref } from '@feng3d/reactivity';
import { computed as vueComputed, ref as vueRef } from '@vue/reactivity';
import { updateResults } from './tool';
import { 复杂情况取值 } from './复杂情况取值';
import pkg from '../../package.json';

vueComputed;
vueRef;

const count = 10000;

// 显示版本号
document.getElementById('feng3d-version')!.textContent = `@${pkg.dependencies['@feng3d/reactivity']}`;
document.getElementById('vue-version')!.textContent = `@${pkg.dependencies['@vue/reactivity']}`;

// 初始化展示
updateResults({
    code: `复杂情况取值(ref, computed, ${count});\n\n` + 复杂情况取值.toString(),
    feng3dResult: 复杂情况取值(ref, computed, count),
    vueResult: 复杂情况取值(vueRef, vueComputed, count),
    结论: {
        vue: `@vue/reactivity 自上而下的使用版本号进行维护状态，当全局有变化时（ref(1).value++ 标记变化）每次取值时都会遍历整个树的子节点比对版本号判断是否需要重新计算。`,
        feng3d: `@feng3d/reactivity 自下而上的使用脏标记进行维护状态，当发生变化时只会冒泡一次到父节点，全局有变化时（ref(1).value++ 标记变化）并不会触发重新计算。`,
    },
});

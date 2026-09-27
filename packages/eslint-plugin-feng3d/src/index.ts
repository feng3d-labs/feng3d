import reactiveNaming from './rules/reactive-naming.js';
import noReactiveExport from './rules/no-reactive-export.js';
import noReactiveArgument from './rules/no-reactive-argument.js';
import effectAnnotation from './rules/effect-annotation.js';
import noModuleSideEffect from './rules/no-module-side-effect.js';

const rules = {
    'reactive-naming': reactiveNaming,
    'no-reactive-export': noReactiveExport,
    'no-reactive-argument': noReactiveArgument,
    'effect-annotation': effectAnnotation,
    'no-module-side-effect': noModuleSideEffect,
};

export default {
    rules,
};

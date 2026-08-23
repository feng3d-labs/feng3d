import reactiveNaming from './rules/reactive-naming.js';
import noReactiveExport from './rules/no-reactive-export.js';
import noReactiveArgument from './rules/no-reactive-argument.js';
import effectAnnotation from './rules/effect-annotation.js';

const rules = {
    'reactive-naming': reactiveNaming,
    'no-reactive-export': noReactiveExport,
    'no-reactive-argument': noReactiveArgument,
    'effect-annotation': effectAnnotation,
};

export default {
    rules,
};

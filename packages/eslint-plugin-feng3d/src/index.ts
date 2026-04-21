import reactiveNaming from './rules/reactive-naming.js';
import noReactiveExport from './rules/no-reactive-export.js';
import noReactiveArgument from './rules/no-reactive-argument.js';

const rules = {
    'reactive-naming': reactiveNaming,
    'no-reactive-export': noReactiveExport,
    'no-reactive-argument': noReactiveArgument,
};

export default {
    rules,
};

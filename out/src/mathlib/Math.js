Math.DEG2RAD = Math.PI / 180;
Math.RAD2DEG = 180 / Math.PI;
Math.generateUUID = function () {
    // http://www.broofa.com/Tools/Math.uuid.htm
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = new Array(36);
    var rnd = 0, r;
    return function generateUUID() {
        for (var i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                uuid[i] = '-';
            }
            else if (i === 14) {
                uuid[i] = '4';
            }
            else {
                if (rnd <= 0x02)
                    rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                r = rnd & 0xf;
                rnd = rnd >> 4;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
        return uuid.join('');
    };
}();
Math.clamp = function (value, min, max) {
    return Math.max(min, Math.min(max, value));
};
Math.euclideanModulo = function (n, m) {
    return ((n % m) + m) % m;
};
Math.mapLinear = function (x, a1, a2, b1, b2) {
    return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
};
Math.lerp = function (x, y, t) {
    return (1 - t) * x + t * y;
};
Math.smoothstep = function (x, min, max) {
    if (x <= min)
        return 0;
    if (x >= max)
        return 1;
    x = (x - min) / (max - min);
    return x * x * (3 - 2 * x);
};
Math.smootherstep = function (x, min, max) {
    if (x <= min)
        return 0;
    if (x >= max)
        return 1;
    x = (x - min) / (max - min);
    return x * x * x * (x * (x * 6 - 15) + 10);
};
Math.randInt = function (low, high) {
    return low + Math.floor(Math.random() * (high - low + 1));
};
Math.randFloat = function (low, high) {
    return low + Math.random() * (high - low);
};
Math.randFloatSpread = function (range) {
    return range * (0.5 - Math.random());
};
Math.degToRad = function (degrees) {
    return degrees * Math.DEG2RAD;
};
Math.radToDeg = function (radians) {
    return radians * Math.RAD2DEG;
};
Math.isPowerOfTwo = function (value) {
    return (value & (value - 1)) === 0 && value !== 0;
};
Math.nearestPowerOfTwo = function (value) {
    return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
};
Math.nextPowerOfTwo = function (value) {
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;
    return value;
};
Math.toRound = function (source, target, precision) {
    if (precision === void 0) { precision = 360; }
    return source + Math.round((target - source) / precision) * precision;
};
//# sourceMappingURL=Math.js.map
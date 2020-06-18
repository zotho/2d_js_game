const len2d = (x, y) => Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

const lerp = (v0, v1, t) => (1 - t) * v0 + t * v1;

const shortAngleDist = (a0, a1) => {
    var max = Math.PI * 2;
    var da = (a1 - a0) % max;
    return 2 * da % max - da;
}

function angleLerp(a0, a1, t) {
    return a0 + shortAngleDist(a0, a1) * t;
}
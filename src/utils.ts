type TargetArea = 0 | 1;
const G_TARGETING_SINGLE = 0;
const G_TARGETING_3X3 = 1;

const G_utils_getTargets = (
  x: number,
  y: number,
  type: TargetArea
): [number, number][] => {
  if (type === G_TARGETING_SINGLE) {
    return [[x, y]];
  } else {
    const ret: [number, number][] = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        ret.push([x + j, y + i]);
      }
    }
    return ret;
  }
};

const G_utils_randInRange = (n1: number, n2: number): number => {
  return Math.floor(Math.random() * (n2 - n1) + n1);
};
const G_utils_randInArr = (arr: any[]) =>
  arr[G_utils_randInRange(0, arr.length)];

const G_utils_cycleItemInArr = (i: number, arr: any[], dir: -1 | 1): number => {
  let nextI = i + dir;
  if (nextI < 0 || nextI >= arr.length) {
    return i;
  }
  let item = arr[i];
  arr[i] = arr[i + dir];
  arr[i + dir] = item;
  return i + dir;
};

const G_utils_pointRectCollides = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => {
  return x >= x1 && x <= x2 && y >= y1 && y <= y2;
};

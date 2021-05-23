export const LOGISTIC = (x: number, derivate?: boolean) => {
  const fx = 1 / (1 + Math.exp(-x));
  if (!derivate) {
    return fx;
  }
  return fx * (1 - fx);
};

export const TANH = (x: number, derivate?: boolean) => {
  if (derivate) {
    return 1 - Math.pow(Math.tanh(x), 2);
  }
  return Math.tanh(x);
};

export const IDENTITY = (x: number, derivate?: boolean) => {
  return derivate ? 1 : x;
};

export const HLIM = (x: number, derivate?: boolean) => {
  return derivate ? 1 : x > 0 ? 1 : 0;
};

export const RELU = (x: number, derivate?: boolean) => {
  if (derivate) {
    return x > 0 ? 1 : 0;
  }
  return x > 0 ? x : 0;
};

export const CROSS_ENTROPY = (target: number[], output: number[]) => {
  let crossentropy = 0;
  for (const i in output) {
    crossentropy -= (target[i] * Math.log(output[i] + 1e-15)) +
      ((1 - target[i]) * Math.log((1 + 1e-15) - output[i]));
  }
  return crossentropy;
};

export const MSE = (target: number[], output: number[]) => {
  let mse = 0;
  for (let i = 0; i < output.length; i++) {
    mse += Math.pow(target[i] - output[i], 2);
  }
  return mse / output.length;
};

export const BINARY = (target: number[], output: number[]) => {
    let misses = 0;
    for (let i = 0; i < output.length; i++) {
      misses += Number(Math.round(target[i] * 2) != Math.round(output[i] * 2));
    }
    return misses;
};

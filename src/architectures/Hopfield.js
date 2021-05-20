import { Network } from '../Network.js';
import { Trainer } from '../Trainer.js';
import { Layer } from '../Layer.js';

export class Hopfield extends Network {
  constructor(size) {
    super();
    let inputLayer = new Layer(size);
    let outputLayer = new Layer(size);

    inputLayer.project(outputLayer, Layer.connectionType.ALL_TO_ALL);

    this.set({
      input: inputLayer,
      hidden: [],
      output: outputLayer
    });

    this.trainer = new Trainer(this);
  }

  learn(patterns) {
    let set = [];
    for (let p in patterns)
      set.push({
        input: patterns[p],
        output: patterns[p]
      });

    return this.trainer.train(set, {
      iterations: 500000,
      error: .00005,
      rate: 1
    });
  }

  feed(pattern) {
    let output = this.activate(pattern);

    pattern = [];
    for (let i in output)
      pattern[i] = output[i] > .5 ? 1 : 0;

    return pattern;
  }
}
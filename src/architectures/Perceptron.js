import { Network } from '../Network.js';
import { Layer } from '../Layer.js';

export class Perceptron extends Network {
  constructor() {
    super();
    let args = Array.prototype.slice.call(arguments);
    if (args.length < 3)
      throw new Error('not enough layers (minimum 3) !!');

    let inputs = args.shift(); 
    let outputs = args.pop();
    let layers = args; 

    let input = new Layer(inputs);
    let hidden = [];
    let output = new Layer(outputs);

    let previous = input;

    for (let i = 0; i < layers.length; i++) {
      let size = layers[i];
      let layer = new Layer(size);
      hidden.push(layer);
      previous.project(layer);
      previous = layer;
    }
    previous.project(output);

    this.set({
      input: input,
      hidden: hidden,
      output: output
    });
  }
}
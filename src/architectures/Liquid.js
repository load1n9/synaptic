import { Network } from '../Network.js';
import { Layer } from '../Layer.js';

export class Liquid extends Network {
  constructor(inputs, hidden, outputs, connections, gates) {
    super();
    let inputLayer = new Layer(inputs);
    let hiddenLayer = new Layer(hidden);
    let outputLayer = new Layer(outputs);

    let neurons = hiddenLayer.neurons();
    let connectionList = [];

    for (let i = 0; i < connections; i++) {
      let from = Math.random() * neurons.length | 0;
      let to = Math.random() * neurons.length | 0;
      let connection = neurons[from].project(neurons[to]);
      connectionList.push(connection);
    }

    for (let j = 0; j < gates; j++) {
      let gater = Math.random() * neurons.length | 0;
      let connection = Math.random() * connectionList.length | 0;
      neurons[gater].gate(connectionList[connection]);
    }

    inputLayer.project(hiddenLayer);
    hiddenLayer.project(outputLayer);

    this.set({
      input: inputLayer,
      hidden: [hiddenLayer],
      output: outputLayer
    });
  }
}
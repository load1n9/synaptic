import { Network } from '../Network.js';
import { Layer } from '../Layer.js';

export class LSTM extends Network {
  constructor() {
    super();
    let args = Array.prototype.slice.call(arguments);
    if (args.length < 3)
      throw new Error("not enough layers (minimum 3) !!");

    let last = args.pop();
    let option = {
      peepholes: Layer.connectionType.ALL_TO_ALL,
      hiddenToHidden: false,
      outputToHidden: false,
      outputToGates: false,
      inputToOutput: true,
    };
    if (typeof last != 'number') {
      let outputs = args.pop();
      if (last.hasOwnProperty('peepholes'))
        option.peepholes = last.peepholes;
      if (last.hasOwnProperty('hiddenToHidden'))
        option.hiddenToHidden = last.hiddenToHidden;
      if (last.hasOwnProperty('outputToHidden'))
        option.outputToHidden = last.outputToHidden;
      if (last.hasOwnProperty('outputToGates'))
        option.outputToGates = last.outputToGates;
      if (last.hasOwnProperty('inputToOutput'))
        option.inputToOutput = last.inputToOutput;
    } else {
      let outputs = last;
    }

    let inputs = args.shift();
    let layers = args;

    let inputLayer = new Layer(inputs);
    let hiddenLayers = [];
    let outputLayer = new Layer(outputs);

    let previous = null;

    for (let i = 0; i < layers.length; i++) {
      let size = layers[i];

      let inputGate = new Layer(size).set({
        bias: 1
      });
      let forgetGate = new Layer(size).set({
        bias: 1
      });
      let memoryCell = new Layer(size);
      let outputGate = new Layer(size).set({
        bias: 1
      });

      hiddenLayers.push(inputGate);
      hiddenLayers.push(forgetGate);
      hiddenLayers.push(memoryCell);
      hiddenLayers.push(outputGate);

      let input = inputLayer.project(memoryCell);
      inputLayer.project(inputGate);
      inputLayer.project(forgetGate);
      inputLayer.project(outputGate);

      if (previous != null) {
        let cell = previous.project(memoryCell);
        previous.project(inputGate);
        previous.project(forgetGate);
        previous.project(outputGate);
      }

      let output = memoryCell.project(outputLayer);

      let self = memoryCell.project(memoryCell);

      if (option.hiddenToHidden)
        memoryCell.project(memoryCell, Layer.connectionType.ALL_TO_ELSE);

      if (option.outputToHidden)
        outputLayer.project(memoryCell);

      if (option.outputToGates) {
        outputLayer.project(inputGate);
        outputLayer.project(outputGate);
        outputLayer.project(forgetGate);
      }

      memoryCell.project(inputGate, option.peepholes);
      memoryCell.project(forgetGate, option.peepholes);
      memoryCell.project(outputGate, option.peepholes);

      inputGate.gate(input, Layer.gateType.INPUT);
      forgetGate.gate(self, Layer.gateType.ONE_TO_ONE);
      outputGate.gate(output, Layer.gateType.OUTPUT);
      if (previous != null)
        inputGate.gate(cell, Layer.gateType.INPUT);

      previous = memoryCell;
    }

    if (option.inputToOutput)
      inputLayer.project(outputLayer);

    this.set({
      input: inputLayer,
      hidden: hiddenLayers,
      output: outputLayer
    });
  }
}
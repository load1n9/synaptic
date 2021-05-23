import { Layer, Network, Trainer } from "../mod.ts";

class Perceptron extends Network {
  public constructor(input: number, hidden: number, output: number) {
    super();
    const inputLayer = new Layer(input);
    const hiddenLayer = new Layer(hidden);
    const outputLayer = new Layer(output);

    inputLayer.project(hiddenLayer);
    hiddenLayer.project(outputLayer);

    this.set({
      input: inputLayer,
      hidden: [hiddenLayer],
      output: outputLayer,
    });
  }
}

const myPerceptron = new Perceptron(2, 3, 1);

const myTrainer = new Trainer(myPerceptron);

myTrainer.XOR();

console.log(
  myPerceptron.activate([0, 0]), // 0.0268581547421616
  myPerceptron.activate([1, 0]), // 0.9829673642853368
  myPerceptron.activate([0, 1]), // 0.9831714267395621
  myPerceptron.activate([1, 1]), // 0.02128894618097928
);

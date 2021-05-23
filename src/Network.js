import { Neuron } from "./Neuron.js";
import { Layer } from "./Layer.js";
import { Trainer } from "./Trainer.js";

export class Network {
  constructor(layers) {
    if (typeof layers != "undefined") {
      this.layers = {
        input: layers.input || null,
        hidden: layers.hidden || [],
        output: layers.output || null,
      };
      this.optimized = null;
    }
  }

  activate(input) {
    if (this.optimized === false) {
      this.layers.input.activate(input);
      for (var i = 0; i < this.layers.hidden.length; i++) {
        this.layers.hidden[i].activate();
      }
      return this.layers.output.activate();
    } else {
      if (this.optimized == null) {
        this.optimize();
      }
      return this.optimized.activate(input);
    }
  }

  propagate(rate, target) {
    if (this.optimized === false) {
      this.layers.output.propagate(rate, target);
      for (let i = this.layers.hidden.length - 1; i >= 0; i--) {
        this.layers.hidden[i].propagate(rate);
      }
    } else {
      if (this.optimized == null) {
        this.optimize();
      }
      this.optimized.propagate(rate, target);
    }
  }

  project(unit, type, weights) {
    if (this.optimized) {
      this.optimized.reset();
    }

    if (unit instanceof Network) {
      return this.layers.output.project(unit.layers.input, type, weights);
    }

    if (unit instanceof Layer) {
      return this.layers.output.project(unit, type, weights);
    }

    throw new Error(
      "Invalid argument, you can only project connections to LAYERS and NETWORKS!",
    );
  }

  gate(connection, type) {
    if (this.optimized) {
      this.optimized.reset();
    }
    this.layers.output.gate(connection, type);
  }

  clear() {
    this.restore();

    let inputLayer = this.layers.input,
      outputLayer = this.layers.output;

    inputLayer.clear();
    for (let i = 0; i < this.layers.hidden.length; i++) {
      this.layers.hidden[i].clear();
    }
    outputLayer.clear();

    if (this.optimized) {
      this.optimized.reset();
    }
  }

  reset() {
    this.restore();

    let inputLayer = this.layers.input,
      outputLayer = this.layers.output;

    inputLayer.reset();
    for (let i = 0; i < this.layers.hidden.length; i++) {
      this.layers.hidden[i].reset();
    }
    outputLayer.reset();

    if (this.optimized) {
      this.optimized.reset();
    }
  }

  optimize() {
    let that = this;
    let optimized = {};
    let neurons = this.neurons();

    for (let i = 0; i < neurons.length; i++) {
      let neuron = neurons[i].neuron;
      let layer = neurons[i].layer;
      while (neuron.neuron) {
        neuron = neuron.neuron;
      }
      optimized = neuron.optimize(optimized, layer);
    }

    for (let i = 0; i < optimized.propagation_sentences.length; i++) {
      optimized.propagation_sentences[i].reverse();
    }
    optimized.propagation_sentences.reverse();

    let hardcode = "";
    hardcode += "var F = Float64Array ? new Float64Array(" + optimized.memory +
      ") : []; ";
    for (let i in optimized.variables) {
      hardcode += "F[" + optimized.variables[i].id + "] = " +
        (optimized.variables[
          i
        ].value || 0) + "; ";
    }
    hardcode += "var activate = function(input){\n";
    for (let i = 0; i < optimized.inputs.length; i++) {
      hardcode += "F[" + optimized.inputs[i] + "] = input[" + i + "]; ";
    }
    for (let i = 0; i < optimized.activation_sentences.length; i++) {
      if (optimized.activation_sentences[i].length > 0) {
        for (let j = 0; j < optimized.activation_sentences[i].length; j++) {
          hardcode += optimized.activation_sentences[i][j].join(" ");
          hardcode += optimized.trace_sentences[i][j].join(" ");
        }
      }
    }
    hardcode += " var output = []; ";
    for (let i = 0; i < optimized.outputs.length; i++) {
      hardcode += "output[" + i + "] = F[" + optimized.outputs[i] + "]; ";
    }
    hardcode += "return output; }; ";
    hardcode += "var propagate = function(rate, target){\n";
    hardcode += "F[" + optimized.variables.rate.id + "] = rate; ";
    for (let i = 0; i < optimized.targets.length; i++) {
      hardcode += "F[" + optimized.targets[i] + "] = target[" + i + "]; ";
    }
    for (let i = 0; i < optimized.propagation_sentences.length; i++) {
      for (let j = 0; j < optimized.propagation_sentences[i].length; j++) {
        hardcode += optimized.propagation_sentences[i][j].join(" ") + " ";
      }
    }
    hardcode += " };\n";
    hardcode +=
      "var ownership = function(memoryBuffer){\nF = memoryBuffer;\nthis.memory = F;\n};\n";
    hardcode +=
      "return {\nmemory: F,\nactivate: activate,\npropagate: propagate,\nownership: ownership\n};";
    hardcode = hardcode.split(";").join(";\n");

    let constructor = new Function(hardcode);

    let network = constructor();
    network.data = {
      variables: optimized.variables,
      activate: optimized.activation_sentences,
      propagate: optimized.propagation_sentences,
      trace: optimized.trace_sentences,
      inputs: optimized.inputs,
      outputs: optimized.outputs,
      check_activation: this.activate,
      check_propagation: this.propagate,
    };

    network.reset = () => {
      if (that.optimized) {
        that.optimized = null;
        that.activate = network.data.check_activation;
        that.propagate = network.data.check_propagation;
      }
    };

    this.optimized = network;
    this.activate = network.activate;
    this.propagate = network.propagate;
  }

  restore() {
    if (!this.optimized) {
      return;
    }

    let optimized = this.optimized;

    let getValue = () => {
      let args = Array.prototype.slice.call(arguments);

      let unit = args.shift();
      let prop = args.pop();

      let id = prop + "_";
      for (let property in args) {
        id += args[property] + "_";
      }
      id += unit.ID;

      let memory = optimized.memory;
      let variables = optimized.data.variables;

      if (id in variables) {
        return memory[variables[id].id];
      }
      return 0;
    };

    let list = this.neurons();

    for (let i = 0; i < list.length; i++) {
      let neuron = list[i].neuron;
      while (neuron.neuron) {
        neuron = neuron.neuron;
      }

      neuron.state = getValue(neuron, "state");
      neuron.old = getValue(neuron, "old");
      neuron.activation = getValue(neuron, "activation");
      neuron.bias = getValue(neuron, "bias");

      for (let input in neuron.trace.elegibility) {
        neuron.trace.elegibility[input] = getValue(
          neuron,
          "trace",
          "elegibility",
          input,
        );
      }

      for (let gated in neuron.trace.extended) {
        for (let input in neuron.trace.extended[gated]) {
          neuron.trace.extended[gated][input] = getValue(
            neuron,
            "trace",
            "extended",
            gated,
            input,
          );
        }
      }

      for (let j in neuron.connections.projected) {
        let connection = neuron.connections.projected[j];
        connection.weight = getValue(connection, "weight");
        connection.gain = getValue(connection, "gain");
      }
    }
  }

  neurons() {
    let neurons = [];

    let inputLayer = this.layers.input.neurons(),
      outputLayer = this.layers.output.neurons();

    for (let i = 0; i < inputLayer.length; i++) {
      neurons.push({
        neuron: inputLayer[i],
        layer: "input",
      });
    }

    for (let i = 0; i < this.layers.hidden.length; i++) {
      let hiddenLayer = this.layers.hidden[i].neurons();
      for (let j = 0; j < hiddenLayer.length; j++) {
        neurons.push({
          neuron: hiddenLayer[j],
          layer: i,
        });
      }
    }

    for (let i = 0; i < outputLayer.length; i++) {
      neurons.push({
        neuron: outputLayer[i],
        layer: "output",
      });
    }

    return neurons;
  }

  inputs() {
    return this.layers.input.size;
  }

  outputs() {
    return this.layers.output.size;
  }

  set(layers) {
    this.layers = {
      input: layers.input || null,
      hidden: layers.hidden || [],
      output: layers.output || null,
    };
    if (this.optimized) {
      this.optimized.reset();
    }
  }

  setOptimize(bool) {
    this.restore();
    if (this.optimized) {
      this.optimized.reset();
    }
    this.optimized = bool ? null : false;
  }

  toJSON(ignoreTraces) {
    this.restore();

    let list = this.neurons();
    let neurons = [];
    let connections = [];

    let ids = {};
    for (let i = 0; i < list.length; i++) {
      let neuron = list[i].neuron;
      while (neuron.neuron) {
        neuron = neuron.neuron;
      }
      ids[neuron.ID] = i;

      let copy = {
        trace: {
          elegibility: {},
          extended: {},
        },
        state: neuron.state,
        old: neuron.old,
        activation: neuron.activation,
        bias: neuron.bias,
        layer: list[i].layer,
      };

      copy.squash = neuron.squash == Neuron.squash.LOGISTIC
        ? "LOGISTIC"
        : neuron.squash == Neuron.squash.TANH
        ? "TANH"
        : neuron.squash == Neuron.squash.IDENTITY
        ? "IDENTITY"
        : neuron.squash == Neuron.squash.HLIM
        ? "HLIM"
        : neuron.squash == Neuron.squash.RELU
        ? "RELU"
        : null;

      neurons.push(copy);
    }

    for (let i = 0; i < list.length; i++) {
      let neuron = list[i].neuron;
      while (neuron.neuron) {
        neuron = neuron.neuron;
      }

      for (let j in neuron.connections.projected) {
        let connection = neuron.connections.projected[j];
        connections.push({
          from: ids[connection.from.ID],
          to: ids[connection.to.ID],
          weight: connection.weight,
          gater: connection.gater ? ids[connection.gater.ID] : null,
        });
      }
      if (neuron.selfconnected()) {
        connections.push({
          from: ids[neuron.ID],
          to: ids[neuron.ID],
          weight: neuron.selfconnection.weight,
          gater: neuron.selfconnection.gater
            ? ids[neuron.selfconnection.gater.ID]
            : null,
        });
      }
    }

    return {
      neurons: neurons,
      connections: connections,
    };
  }

  toDot(edgeConnection) {
    if (!typeof edgeConnection) {
      edgeConnection = false;
    }
    let code = "digraph nn {\n    rankdir = BT\n";
    let layers = [this.layers.input].concat(
      this.layers.hidden,
      this.layers.output,
    );
    for (let i = 0; i < layers.length; i++) {
      for (let j = 0; j < layers[i].connectedTo.length; j++) { 
        let connection = layers[i].connectedTo[j];
        let layerTo = connection.to;
        let size = connection.size;
        let layerID = layers.indexOf(layers[i]);
        let layerToID = layers.indexOf(layerTo);
        if (edgeConnection) {
          if (connection.gatedfrom.length) {
            let fakeNode = "fake" + layerID + "_" + layerToID;
            code += "    " + fakeNode +
              ' [label = "", shape = point, width = 0.01, height = 0.01]\n';
            code += "    " + layerID + " -> " + fakeNode + " [label = " + size +
              ", arrowhead = none]\n";
            code += "    " + fakeNode + " -> " + layerToID + "\n";
          } else {
            code += "    " + layerID + " -> " + layerToID + " [label = " +
              size + "]\n";
          }
          for (let from in connection.gatedfrom) { // gatings
            let layerfrom = connection.gatedfrom[from].layer;
            let layerfromID = layers.indexOf(layerfrom);
            code += "    " + layerfromID + " -> " + fakeNode +
              " [color = blue]\n";
          }
        } else {
          code += "    " + layerID + " -> " + layerToID + " [label = " + size +
            "]\n";
          for (let from in connection.gatedfrom) { // gatings
            let layerfrom = connection.gatedfrom[from].layer;
            let layerfromID = layers.indexOf(layerfrom);
            code += "    " + layerfromID + " -> " + layerToID +
              " [color = blue]\n";
          }
        }
      }
    }
    code += "}\n";
    return {
      code: code,
      link: "https://chart.googleapis.com/chart?chl=" +
        escape(code.replace("/ /g", "+")) + "&cht=gv",
    };
  }

  standalone() {
    if (!this.optimized) {
      this.optimize();
    }

    let data = this.optimized.data;

    let activation = "function (input) {\n";

    for (let i = 0; i < data.inputs.length; i++) {
      activation += "F[" + data.inputs[i] + "] = input[" + i + "];\n";
    }

    for (let i = 0; i < data.activate.length; i++) { 
      for (let j = 0; j < data.activate[i].length; j++) {
        activation += data.activate[i][j].join("") + "\n";
      }
    }

    activation += "var output = [];\n";
    for (let i = 0; i < data.outputs.length; i++) {
      activation += "output[" + i + "] = F[" + data.outputs[i] + "];\n";
    }
    activation += "return output;\n}";

    let memory = activation.match(/F\[(\d+)\]/g);
    let dimension = 0;
    let ids = {};

    for (let i = 0; i < memory.length; i++) {
      let tmp = memory[i].match(/\d+/)[0];
      if (!(tmp in ids)) {
        ids[tmp] = dimension++;
      }
    }
    let hardcode = "F = {\n";

    for (let i in ids) {
      hardcode += ids[i] + ": " + this.optimized.memory[i] + ",\n";
    }
    hardcode = hardcode.substring(0, hardcode.length - 2) + "\n};\n";
    hardcode = "var run = " +
      activation.replace(/F\[(\d+)]/g, function (index) {
        return "F[" + ids[index.match(/\d+/)[0]] + "]";
      }).replace("{\n", "{\n" + hardcode + "") + ";\n";
    hardcode += "return run";

    return new Function(hardcode)();
  }

  worker(memory, set, options) {
    let workerOptions = {};
    if (options) workerOptions = options;
    workerOptions.rate = workerOptions.rate || .2;
    workerOptions.iterations = workerOptions.iterations || 100000;
    workerOptions.error = workerOptions.error || .005;
    workerOptions.cost = workerOptions.cost || null;
    workerOptions.crossValidate = workerOptions.crossValidate || null;

    let costFunction = "// REPLACED BY WORKER\nvar cost = " +
      (options && options.cost || this.cost || Trainer.cost.MSE) + ";\n";
    let workerFunction = Network.getWorkerSharedFunctions();
    workerFunction = workerFunction.replace(
      /var cost = options && options\.cost \|\| this\.cost \|\| Trainer\.cost\.MSE;/g,
      costFunction,
    );

    workerFunction = workerFunction.replace(
      "return results;",
      'postMessage({action: "done", message: results, memoryBuffer: F}, [F.buffer]);',
    );

    workerFunction = workerFunction.replace(
      "console.log('iterations', iterations, 'error', error, 'rate', currentRate)",
      "postMessage({action: 'log', message: {\n" +
        "iterations: iterations,\n" +
        "error: error,\n" +
        "rate: currentRate\n" +
        "}\n" +
        "})",
    );

    workerFunction = workerFunction.replace(
      "abort = this.schedule.do({ error: error, iterations: iterations, rate: currentRate })",
      "postMessage({action: 'schedule', message: {\n" +
        "iterations: iterations,\n" +
        "error: error,\n" +
        "rate: currentRate\n" +
        "}\n" +
        "})",
    );

    if (!this.optimized) {
      this.optimize();
    }

    let hardcode = "var inputs = " + this.optimized.data.inputs.length + ";\n";
    hardcode += "var outputs = " + this.optimized.data.outputs.length + ";\n";
    hardcode += "var F =  new Float64Array([" +
      this.optimized.memory.toString() + "]);\n";
    hardcode += "var activate = " + this.optimized.activate.toString() + ";\n";
    hardcode += "var propagate = " + this.optimized.propagate.toString() +
      ";\n";
    hardcode += "onmessage = function(e) {\n" +
      "if (e.data.action == 'startTraining') {\n" +
      "train(" + JSON.stringify(set) + "," + JSON.stringify(workerOptions) +
      ");\n" +
      "}\n" +
      "}";

    let workerSourceCode = workerFunction + "\n" + hardcode;
    let blob = new Blob([workerSourceCode]);
    let blobURL = window.URL.createObjectURL(blob);

    return new Worker(blobURL);
  }

  clone() {
    return Network.fromJSON(this.toJSON());
  }

  static getWorkerSharedFunctions() {
    if (typeof Network._SHARED_WORKER_FUNCTIONS !== "undefined") {
      return Network._SHARED_WORKER_FUNCTIONS;
    }
    let train_f = Trainer.prototype.train.toString();
    train_f = train_f.replace(/this._trainSet/g, "_trainSet");
    train_f = train_f.replace(/this.test/g, "test");
    train_f = train_f.replace(/this.crossValidate/g, "crossValidate");
    train_f = train_f.replace("crossValidate = true", "// REMOVED BY WORKER");

    let _trainSet_f = Trainer.prototype._trainSet.toString().replace(
      /this.network./g,
      "",
    );

    let test_f = Trainer.prototype.test.toString().replace(
      /this.network./g,
      "",
    );

    return Network._SHARED_WORKER_FUNCTIONS = train_f + "\n" + _trainSet_f +
      "\n" + test_f;
  }

  static fromJSON(json) {
    let neurons = [];

    let layers = {
      input: new Layer(),
      hidden: [],
      output: new Layer(),
    };

    for (let i = 0; i < json.neurons.length; i++) {
      let config = json.neurons[i];

      let neuron = new Neuron();
      neuron.trace.elegibility = {};
      neuron.trace.extended = {};
      neuron.state = config.state;
      neuron.old = config.old;
      neuron.activation = config.activation;
      neuron.bias = config.bias;
      neuron.squash = config.squash in Neuron.squash
        ? Neuron.squash[config.squash]
        : Neuron.squash.LOGISTIC;
      neurons.push(neuron);

      if (config.layer == "input") {
        layers.input.add(neuron);
      } else if (config.layer == "output") {
        layers.output.add(neuron);
      } else {
        if (typeof layers.hidden[config.layer] == "undefined") {
          layers.hidden[config.layer] = new Layer();
        }
        layers.hidden[config.layer].add(neuron);
      }
    }

    for (let i = 0; i < json.connections.length; i++) {
      let config = json.connections[i];
      let from = neurons[config.from];
      let to = neurons[config.to];
      let weight = config.weight;
      let gater = neurons[config.gater];

      let connection = from.project(to, weight);
      if (gater) {
        gater.gate(connection);
      }
    }

    return new Network(layers);
  }
}

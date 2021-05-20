import { LayerConnection } from "./LayerConnection.ts";
import { Neuron } from "./Neuron.js";
import { Network } from "./Network.js";

const connectionType = {
  ALL_TO_ALL: "ALL TO ALL",
  ONE_TO_ONE: "ONE TO ONE",
  ALL_TO_ELSE: "ALL TO ELSE",
};

const gateType = {
  INPUT: "INPUT",
  OUTPUT: "OUTPUT",
  ONE_TO_ONE: "ONE TO ONE",
};

export class Layer {
  static connectionType = connectionType;
  static gateType = gateType;

  constructor(size) {
    this.size = size | 0;
    this.list = [];

    this.connectedTo = [];

    while (size--) {
      let neuron = new Neuron();
      this.list.push(neuron);
    }
  }

  activate(input) {
    let activations = [];

    if (typeof input != "undefined") {
      if (input.length != this.size) {
        throw new Error(
          "INPUT size and LAYER size must be the same to activate!",
        );
      }

      for (let id in this.list) {
        let neuron = this.list[id];
        let activation = neuron.activate(input[id]);
        activations.push(activation);
      }
    } else {
      for (let id in this.list) {
        let neuron = this.list[id];
        let activation = neuron.activate();
        activations.push(activation);
      }
    }
    return activations;
  }

  propagate(rate, target) {
    if (typeof target != "undefined") {
      if (target.length != this.size) {
        throw new Error(
          "TARGET size and LAYER size must be the same to propagate!",
        );
      }

      for (let id = this.list.length - 1; id >= 0; id--) {
        let neuron = this.list[id];
        neuron.propagate(rate, target[id]);
      }
    } else {
      for (let id = this.list.length - 1; id >= 0; id--) {
        let neuron = this.list[id];
        neuron.propagate(rate);
      }
    }
  }

  project(layer, type, weights) {
    if (layer instanceof Network) {
      layer = layer.layers.input;
    }

    if (layer instanceof Layer) {
      if (!this.connected(layer)) {
        return new LayerConnection(this, layer, type, weights);
      }
    } else {
      throw new Error(
        "Invalid argument, you can only project connections to LAYERS and NETWORKS!",
      );
    }
  }

  gate(connection, type) {
    if (type == Layer.gateType.INPUT) {
      if (connection.to.size != this.size) {
        throw new Error(
          "GATER layer and CONNECTION.TO layer must be the same size in order to gate!",
        );
      }

      for (let id in connection.to.list) {
        let neuron = connection.to.list[id];
        let gater = this.list[id];
        for (let input in neuron.connections.inputs) {
          let gated = neuron.connections.inputs[input];
          if (gated.ID in connection.connections) {
            gater.gate(gated);
          }
        }
      }
    } else if (type == Layer.gateType.OUTPUT) {
      if (connection.from.size != this.size) {
        throw new Error(
          "GATER layer and CONNECTION.FROM layer must be the same size in order to gate!",
        );
      }

      for (var id in connection.from.list) {
        let neuron = connection.from.list[id];
        let gater = this.list[id];
        for (let projected in neuron.connections.projected) {
          let gated = neuron.connections.projected[projected];
          if (gated.ID in connection.connections) {
            gater.gate(gated);
          }
        }
      }
    } else if (type == Layer.gateType.ONE_TO_ONE) {
      if (connection.size != this.size) {
        throw new Error(
          "The number of GATER UNITS must be the same as the number of CONNECTIONS to gate!",
        );
      }

      for (let id in connection.list) {
        let gater = this.list[id];
        let gated = connection.list[id];
        gater.gate(gated);
      }
    }
    connection.gatedfrom.push({ layer: this, type: type });
  }

  selfconnected() {
    for (let id in this.list) {
      let neuron = this.list[id];
      if (!neuron.selfconnected()) {
        return false;
      }
    }
    return true;
  }

  connected(layer) {
    let connections = 0;
    for (let here in this.list) {
      for (let there in layer.list) {
        let from = this.list[here];
        let to = layer.list[there];
        let connected = from.connected(to);
        if (connected.type == "projected") {
          connections++;
        }
      }
    }
    if (connections == this.size * layer.size) {
      return Layer.connectionType.ALL_TO_ALL;
    }

    connections = 0;
    for (let neuron in this.list) {
      let from = this.list[neuron];
      let to = layer.list[neuron];
      let connected = from.connected(to);
      if (connected.type == "projected") {
        connections++;
      }
    }
    if (connections == this.size) {
      return Layer.connectionType.ONE_TO_ONE;
    }
  }

  clear() {
    for (let id in this.list) {
      let neuron = this.list[id];
      neuron.clear();
    }
  }

  reset() {
    for (let id in this.list) {
      let neuron = this.list[id];
      neuron.reset();
    }
  }

  neurons() {
    return this.list;
  }

  add(neuron) {
    neuron = neuron || new Neuron();
    this.list.push(neuron);
    this.size++;
  }

  set(options) {
    options = options || {};

    for (let i in this.list) {
      let neuron = this.list[i];
      if (options.label) {
        neuron.label = options.label + "_" + neuron.ID;
      }
      if (options.squash) {
        neuron.squash = options.squash;
      }
      if (options.bias) {
        neuron.bias = options.bias;
      }
    }
    return this;
  }
}

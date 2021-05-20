import { Layer } from "./Layer.js";

export let connections = 0;

export class LayerConnection {
  public ID: number;
  public from: any;
  public to: any;
  public selfconnection: any;
  public connections: any;
  public list: any;
  public size: number;
  public gatedfrom: any;

  public constructor(
    fromLayer: any,
    toLayer: any,
    public type?: any,
    weights?: any,
  ) {
    this.ID = LayerConnection.uid();
    this.from = fromLayer;
    this.to = toLayer;
    this.selfconnection = toLayer == fromLayer;
    this.connections = {};
    this.list = [];
    this.size = 0;
    this.gatedfrom = [];

    if (typeof this.type == "undefined") {
      if (fromLayer == toLayer) {
        this.type = Layer.connectionType.ONE_TO_ONE;
      } else {
        this.type = Layer.connectionType.ALL_TO_ALL;
      }
    }

    if (
      this.type == Layer.connectionType.ALL_TO_ALL ||
      this.type == Layer.connectionType.ALL_TO_ELSE
    ) {
      for (let here in this.from.list) {
        for (let there in this.to.list) {
          let from = this.from.list[here];
          let to = this.to.list[there];
          if (this.type == Layer.connectionType.ALL_TO_ELSE && from == to) {
            continue;
          }
          let connection = from.project(to, weights);

          this.connections[connection.ID] = connection;
          this.size = this.list.push(connection);
        }
      }
    } else if (this.type == Layer.connectionType.ONE_TO_ONE) {
      for (let neuron in this.from.list) {
        let from = this.from.list[neuron];
        let to = this.to.list[neuron];
        let connection = from.project(to, weights);

        this.connections[connection.ID] = connection;
        this.size = this.list.push(connection);
      }
    }

    fromLayer.connectedTo.push(this);
  }

  static uid() {
    return connections++;
  }
}

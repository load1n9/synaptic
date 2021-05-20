export let connections: number = 0;

export class Connection {
  public ID = Connection.uid();
  public gain: number = 1;
  public gater: any = null;
  public weight: any;
  public constructor(
    public from: any,
    public to: any,
    weight?: any,
  ) {
    this.weight = weight || Math.random() * .2 - .1;
  }

  static uid() {
    return connections++;
  }
}

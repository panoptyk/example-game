export interface Delay {
  avg: number;
  var: number;
}

class HumanDelay {
  // Singleton pattern
  private static _instance: HumanDelay;
  public static get instance() {
    if (!HumanDelay._instance) {
      HumanDelay._instance = new HumanDelay();
    }
    return HumanDelay._instance;
  }

  _delays: Map<string, Delay> = new Map();
  _override = false;

  /**
   * set a new delay on certain actions
   * @param key name for delay
   * @param d delay values
   */
  setDelay(key: string, d: Delay) {
    this._delays.set(key, d);
  }

  getDelayInfo(key: string): Delay {
    if (this._override) {
      return { avg: 0, var: 0 };
    }
    return this._delays.get(key);
  }

  getDelay(key: string): number {
    const d: Delay = this.getDelayInfo(key);
    if (d) {
      return (
        d.avg +
        (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * d.var)
      );
    }
    return 0;
  }

  setOverride(o: boolean) {
    this._override = o;
  }
}

export { HumanDelay };
export default HumanDelay.instance;

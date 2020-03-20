class Decision {
  // Singleton pattern
  private static _instance: Decision;
  public static get instance() {
    if (!Decision._instance) {
      Decision._instance = new Decision();
    }
    return Decision._instance;
  }
  _decisions: Map<string, number> = new Map();

  set(key: string, probability: number) {
    this._decisions.set(key, probability);
  }

  decide(key: string): boolean {
    const val = this._decisions.has(key) ? this._decisions.get(key) : 1.1;
    return Math.random() < val;
  }
}

export { Decision };
export default Decision.instance;
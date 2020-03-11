class KBis {
  // Singleton pattern
  private static _instance: KBis;
  public static get instance() {
    if (!KBis._instance) {
      KBis._instance = new KBis();
    }
    return KBis._instance;
  }

  constructor() {}
}

export default KBis.instance;
export { KBis };

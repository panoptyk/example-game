class AnotherKB {
    // Singleton pattern
    private static _instance: AnotherKB;
    public static get instance {
      if (!AnotherKB._instance) {
          AnotherKB._instance = new AnotherKB();
      }
      return AnotherKB._instance;
    }
    constructor() {
        console.log("I am new KB");
    }
}

export { AnotherKB };
export default AnotherKB.instance;
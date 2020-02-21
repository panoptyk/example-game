import { Strategy } from "../../../../lib";

class CrimeLeader extends Strategy {
  constructor() {
    super();
  }

  public async act() {
    this.currentBehavior.act();
  }
}

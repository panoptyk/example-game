import { Strategy } from "../../lib";


export class ExploreStrategy extends Strategy {

  constructor() {
    super();
    this.currentBehavior = undefined;
  }
}
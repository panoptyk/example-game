import { ActionState, FailureAction } from "../../lib";
import { log } from "../util/log";


export abstract class RetryActionState extends ActionState {
  _timeOut: number;
  /**
   * This extension of ActionState automatically fails after a certain amount of time has passed
   * @param timeOut time till action fails in milliseconds
   * @param nextState optional next state function override
   */
  constructor(timeOut = 0, nextState?: () => ActionState) {
    super(nextState);
    this._timeOut = timeOut;
  }

  async tick() {
    if (this._timeOut && Date.now() - this.startTime > this._timeOut) {
      log("> TimedOut", log.STATE);
      return FailureAction.instance;
    }
    return await super.tick();
  }

}
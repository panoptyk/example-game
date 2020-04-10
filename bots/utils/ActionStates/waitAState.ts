import { ActionState, SuccessAction } from "../../lib";

export class WaitState extends ActionState {
  private _completed = false;
  public get completed() {
    return this._completed;
  }
  private _doneActing = false;
  public get doneActing() {
    return this._doneActing;
  }
  timeout: number;
  nextAction: () => ActionState;

  constructor(
    timeout: number,
    actionAfterWait: () => ActionState,
    nextState?: () => ActionState
  ) {
    super(nextState);
    this.timeout = timeout;
    this.nextAction = actionAfterWait;
  }

  public async act() {
    if (Date.now() - this.startTime >= this.timeout) {
      this._completed = true;
      this._doneActing = true;
    }
  }

  public nextState(): ActionState {
    if (this.completed) {
      return this.nextAction();
    }
    return this;
  }
}

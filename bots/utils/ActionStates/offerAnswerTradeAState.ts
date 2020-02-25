import { ActionState } from "../../lib/ActionStates/actionState";
import { Info, ClientAPI, ValidationResult } from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";
import { FailureAction } from "../../lib/ActionStates/failureAState";

export class OfferAnswerTradeState extends ActionState {
  _answer: Info;
  _question: Info;
  _mask: string[];
  private _completed = false;
  public get completed() {
    return this._completed;
  }
  private _doneActing = false;
  public get doneActing() {
    return this._doneActing;
  }

  constructor(
    answer: Info,
    question: Info,
    mask: string[] = [],
    nextState: () => ActionState = undefined
  ) {
    super(nextState);
    this._answer = answer;
    this._question = question;
    this._mask = mask;
  }

  public async act() {
    if (ClientAPI.playerAgent.trade) {
      await ClientAPI.offerAnswerTrade(this._answer, this._question, this._mask)
        .catch((res: ValidationResult) => {
          console.log(res.message);
        })
        .then(() => {
          this._completed = true;
          this._doneActing = true;
        });
    } else {
      this._doneActing = true;
    }
  }

  public nextState(): ActionState {
    if (this._completed) return SuccessAction.instance;
    else if (this._doneActing) return FailureAction.instance;
    else return this;
  }
}

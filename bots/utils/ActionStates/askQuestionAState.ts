import { ActionState } from "../../lib/ActionStates/actionState";
import {
  Agent,
  ClientAPI,
  ValidationResult,
  Info
} from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";
import { FailureAction } from "../../lib/ActionStates/failureAState";

export class AskQuestionState extends ActionState {
  private question: object;
  private desiredTerms: string[];
  private _completed = false;
  public get completed() {
    return this._completed;
  }
  private _doneActing = false;
  public get doneActing() {
    return this._doneActing;
  }

  constructor(
    question: object,
    desiredTerms: string[] = [],
    nextState: () => ActionState = undefined
  ) {
    super(nextState);
    this.question = question;
    this.desiredTerms = desiredTerms;
  }

  public async act() {
    if (ClientAPI.playerAgent.conversation) {
      await ClientAPI.askQuestion(this.question, this.desiredTerms)
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

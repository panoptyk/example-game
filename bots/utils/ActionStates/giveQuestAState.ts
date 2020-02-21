import { ActionState } from "../../lib/ActionStates/actionState";
import { Agent, ClientAPI, ValidationResult } from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";
import { FailureAction } from "../../lib/ActionStates/failureAState";

export class GiveQuestState extends ActionState {
  private questAgent: Agent;
  private task: object;
  private isQuestion: boolean;
  private _completed = false;
  public get completed() {
    return this._completed;
  }
  private _doneActing = false;
  public get doneActing() {
    return this._doneActing;
  }

  constructor(
    questAgent: Agent,
    task: object,
    isQuestion = false,
    nextState: () => ActionState = undefined
  ) {
    super(nextState);
    this.questAgent = questAgent;
    this.task = task;
    this.isQuestion = isQuestion;
  }

  public async act() {
    if (
      ClientAPI.playerAgent.conversation &&
      ClientAPI.playerAgent.conversation.contains_agent(this.questAgent)
    ) {
      await ClientAPI.giveQuest(this.questAgent, this.task, this.isQuestion)
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

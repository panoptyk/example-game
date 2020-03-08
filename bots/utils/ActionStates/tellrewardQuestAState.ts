import { ActionState } from "../../lib/ActionStates/actionState";
import { Quest, ClientAPI, ValidationResult, Info } from "panoptyk-engine/dist/";
import { SuccessAction } from "../../lib/ActionStates/successAState";
import { FailureAction } from "../../lib/ActionStates/failureAState";

export class TellRewardQuestState extends ActionState {
  private quest: Quest;
  private reward: any;
  private _completed = false;
  public get completed() {
    return this._completed;
  }
  private _doneActing = false;
  public get doneActing() {
    return this._doneActing;
  }

  constructor(quest: Quest, reward: any, nextState: () => ActionState = undefined) {
    super(nextState);
    this.quest = quest;
    this.reward = reward;
  }

  public async act() {
    if (
      ClientAPI.playerAgent.conversation &&
      ClientAPI.playerAgent.conversation.contains_agent(this.quest.receiver) &&
      ClientAPI.playerAgent === this.quest.giver
    ) {
      await ClientAPI.tellRewardQuest(this.quest, this.reward)
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

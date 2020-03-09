import {
  ActionState,
  BehaviorState,
  SuccessAction,
  FailureAction,
  SuccessBehavior,
  FailureBehavior
} from "../../lib";
import { ClientAPI, Agent, Room, Info, Quest } from "panoptyk-engine/dist/";
import * as Helper from "../helper";
import { CompleteQuestState, FailQuestState } from "../";

export class CloseQuestBehavior extends BehaviorState {
  _targetAgent: Agent;
  _targetQuest: Quest;
  _questSuccess: boolean;
  private static _activeInstance: CloseQuestBehavior;
  public static get activeInstance(): CloseQuestBehavior {
    return this._activeInstance;
  }

  constructor(
    targetQuest: Quest,
    questSuccessful = true,
    nextState?: () => BehaviorState
  ) {
    super(nextState);
    this._targetQuest = targetQuest;
    this._questSuccess = questSuccessful;
    this._targetAgent = targetQuest.receiver;

    if (
      ClientAPI.playerAgent.conversation &&
      ClientAPI.playerAgent.conversation.contains_agent(this._targetAgent)
    ) {
      if (this._questSuccess) {
        console.log(
          ClientAPI.playerAgent +
            " marked " +
            this._targetQuest +
            " as complete."
        );
        this.currentActionState = new CompleteQuestState(this._targetQuest);
      } else {
        console.log(
          ClientAPI.playerAgent + " marked " + this._targetQuest + " as failed."
        );
        this.currentActionState = new FailQuestState(this._targetQuest);
      }
    } else {
      this.currentActionState = FailureAction.instance;
    }
  }

  public async act() {
    CloseQuestBehavior._activeInstance = this;
    this.currentActionState = await this.currentActionState.tick();
  }

  public nextState() {
    return this;
  }
}

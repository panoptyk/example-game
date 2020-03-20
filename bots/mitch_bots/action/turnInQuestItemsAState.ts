import { ActionState, SuccessAction } from "../../lib";
import * as KB from "../kb/KBadditions";
import DELAYS from "../util/humanDelay";
import { RetryActionState } from "./retryActionState";
import { ClientAPI, Quest } from "panoptyk-engine/dist/client";
import { log } from "../util/log";


export class TurnInQuestAction extends RetryActionState {
  _quest: Quest;
  _turnIns = [];
  _timeToWait: number;
  _waitTime = 0;

  constructor(quest: Quest, timeout = 3000, nextState?: () => ActionState) {
    super(timeout, nextState);
    this._quest = quest;
    this._turnIns = KB.get.questTurnIns(this._quest);
    this._fail = this._quest.amount === this._turnIns.length;
    this._timeToWait = DELAYS.getDelay("turn-in-quest");
  }

  async act() {
    this._waitTime += this.deltaTime;
    if (!this._complete && this._waitTime < this._timeToWait) {
      return;
    }
    if (this._quest.type === "item") {
      await ClientAPI.turnInQuestItem(this._quest, this._turnIns[0]).then(res => {
        log("Turning in quest items", log.ACT);
        this._turnIns.shift();
        this._waitTime = 0;
      });
    } else {
      await ClientAPI.turnInQuestInfo(this._quest, this._turnIns[0]).then(res => {
        log("Turning in quest info", log.ACT);
        this._turnIns.shift();
        this._waitTime = 0;
      });
    }
    this._success = this._turnIns.length === 0;
  }

  nextState(): ActionState {
    if (this._success) {
      return SuccessAction.instance;
    } else {
      return this;
    }
  }


}
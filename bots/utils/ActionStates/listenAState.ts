import { ActionState } from "../../lib";
import { ClientAPI, Agent } from "panoptyk-engine/dist/";
import { LeaveConersationState } from "..";

export class ListenToOther extends ActionState {
  other: Agent;
  timeout: number;
  lastUpdate: number;
  infoAboutOther = 0;

  constructor(timeout: number, nextState?: () => ActionState) {
    super(nextState);
    this.timeout = timeout;
    this.lastUpdate = Date.now();
    this.other = ClientAPI.playerAgent.conversation.getAgents(
      ClientAPI.playerAgent
    )[0];
    this.infoAboutOther = ClientAPI.playerAgent.getInfoByAgent(
      this.other
    ).length;
  }

  public async act() {
    const currentInfo = ClientAPI.playerAgent.getInfoByAgent(this.other).length;
    if (this.infoAboutOther < currentInfo) {
      this.lastUpdate = Date.now();
      this.infoAboutOther = currentInfo;
    }
  }

  public nextState() {
    if (Date.now() - this.lastUpdate > this.timeout) {
      return new LeaveConersationState();
    }
    return this;
  }
}

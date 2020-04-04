import { Event } from "./event";
import Game from "../../states/game";
import { Agent } from "panoptyk-engine/dist/client";
import { AgentSprite } from "../../prefabs/agent";

export class RemoveAgentEvent extends Event {
  agent: Agent;

  constructor(game: Game, agent) {
    super(game);
    this.agent = agent;
  }

  canProcess(): boolean {
    const sprite = this.GS.agentSpriteMap.get(this.agent.id);
    return !sprite || !sprite.busy();
  }
  process() {
    const sprite = this.GS.agentSpriteMap.get(this.agent.id);
    if (sprite) {
      this.GS.standingLocs.releaseIndex(sprite.standLocIndex);
      sprite.destroy();
      this.GS.agentSpriteMap.delete(this.agent.id);
    }
  }
}

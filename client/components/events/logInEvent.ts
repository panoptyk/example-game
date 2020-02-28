import { Event } from "./event";
import Game from "../../states/game";
import { Agent } from "panoptyk-engine/dist/client";
import { AgentSprite } from "../../prefabs/agent";

export class LogInEvent extends Event {
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
    if (!sprite) {
      const standLoc = this.GS.standingLocs.getRandomLoc();
      const agentSprite = new AgentSprite(
        this.GS.game,
        standLoc.pos.x,
        standLoc.pos.y,
        this.agent
      );
      agentSprite.standLocIndex = standLoc.index;
      agentSprite.inputEnabled = true;
      this.GS.groups.otherAgents.add(agentSprite);
      this.GS.agentSpriteMap.set(this.agent.id, agentSprite);
      this.GS.addConsoleMessage(this.agent.agentName + " logged in.");
    }
  }
}

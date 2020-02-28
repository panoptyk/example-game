import { Event } from "./event";
import Game from "../../states/game";
import { Agent, Room } from "panoptyk-engine/dist/client";
import { AgentSprite } from "../../prefabs/agent";

export class EnterEvent extends Event {
  agent: Agent;
  loc: Room;

  constructor(game: Game, agent, loc) {
    super(game);
    this.agent = agent;
    this.loc = loc;
  }

  canProcess(): boolean {
    const sprite = this.GS.agentSpriteMap.get(this.agent.id);
    return !sprite || !sprite.busy();
  }
  process() {
    if (this.GS.agentSpriteMap.has(this.agent.id)) {
      return;
    }
    const end = this.GS.standingLocs.getRandomLoc();
    let start = end.pos;
    for (const door of this.GS.groups.doorObjects.getAll()) {
      if (door.model.id === this.loc.id) {
        start = door.position;
        break;
      }
    }
    const agentSprite = new AgentSprite(this.GS.game, 0, 0, this.agent);
    agentSprite.visible = false;
    agentSprite.standLocIndex = end.index;
    agentSprite.inputEnabled = true;
    this.GS.groups.otherAgents.add(agentSprite);
    this.GS.agentSpriteMap.set(this.agent.id, agentSprite);
    this.GS.agentsInRoom.add(this.agent.id);
    agentSprite.move(start, end.pos, () => {});
    // Console Message
    const message = this.agent.agentName + " has entered.";
    this.GS.addConsoleMessage(message);
  }
}

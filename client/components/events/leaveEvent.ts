import { Event } from "./event";
import Game from "../../states/game";
import { Agent, Room } from "panoptyk-engine/dist/client";
import { AgentSprite } from "../../prefabs/agent";

export class LeaveEvent extends Event {
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
    const sprite = this.GS.agentSpriteMap.get(this.agent.id);
    if (!sprite) {
      return;
    }
    let end = sprite.position;
    for (const door of this.GS.groups.doorObjects.getAll()) {
      if (door.model.id === this.loc.id) {
        end = door.position;
        break;
      }
    }
    sprite.move(sprite.position, end, () => {
      if (this.GS.agentSpriteMap.has(this.agent.id)) {
        this.GS.standingLocs.releaseIndex(
          this.GS.agentSpriteMap.get(this.agent.id).standLocIndex
        );
        this.GS.agentSpriteMap.get(this.agent.id).destroy();
        this.GS.agentSpriteMap.delete(this.agent.id);
        // Console Message
        const message =
          this.agent.agentName + " left and moved to " + this.loc.roomName;
        this.GS.addConsoleMessage(message);
      }
    });
  }
}

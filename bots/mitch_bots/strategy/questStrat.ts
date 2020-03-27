import { Strategy, BehaviorState } from "../../lib";
import { log } from "../util/log";
import * as KB from "../kb/KBadditions";
import { MoveToRoomBehavior } from "../behavior/moveToRoomBState";
import { IdleBehavior } from "../behavior/idleBState";
import { TurnInQuestBehavior } from "../behavior/turnInQuestBState";
import { Room } from "panoptyk-engine/dist/client";
import { GetQuestBehavior } from "../behavior/getQuestBState";

/**
 * Handles the movement and main functions of questing
 */
export class QuestStrategy extends Strategy {
  // Transition functions
  static createMoveToRoomTransition(
    strat: QuestStrategy
  ): (this: MoveToRoomBehavior) => BehaviorState {
    return function(this: MoveToRoomBehavior): BehaviorState {
      if (this._arrivedAtRoom && KB.is.factionLeaderInRoom()) {
        strat._movingToLeader = false;
        return new TurnInQuestBehavior();
      } else if (this._arrivedAtRoom || this._fail) {
        return IdleBehavior.instance;
      } else {
        return this;
      }
    };
  }

  _onlyAdjacent = false;
  _movingToLeader = false;

  constructor() {
    super();
    this.currentBehavior = IdleBehavior.instance;
  }

  cannotDiscuss() {
    const curB = this.currentBehavior;
    return curB instanceof TurnInQuestBehavior || curB instanceof GetQuestBehavior;
  }

  movingToLeader() {
    return this._movingToLeader;
  }

  async act() {
    log(
      this.currentBehavior.constructor.name +
        " > " +
        (this.currentBehavior.currentActionState
          ? this.currentBehavior.currentActionState.constructor.name
          : "NONE"),
      log.STATE
    );
    await super.act();
    if (this.currentBehavior === IdleBehavior.instance) {
      let room: Room;
      this._movingToLeader = false;
      if (this.goToFactionLeader()) {
        this._movingToLeader = true;
        room = KB.agent.lastSeen(KB.agent.factionLeader);
      } else {
        room = this.findRoomOfInterest();
      }
      log("QuestStrategy::act picked room: " + room, log.ACT);
      this.currentBehavior = new MoveToRoomBehavior(
        room,
        QuestStrategy.createMoveToRoomTransition(this)
      );
    }
  }

  goToFactionLeader(): boolean {
    return (
      KB.agent.factionLeader !== undefined &&
      KB.agent.lastSeen(KB.agent.factionLeader) &&
      (KB.is.newQuestAvailable() || KB.get.completableQuests().length > 0)
    );
  }

  findRoomOfInterest(): Room {
    const needs = KB.get.questNeeds();
    const rooms: Room[] = [];
    // look for item locations to go
    needs.items.forEach(needI => {
      const r = KB.item.lastSeen(needI.item);
      if (r) {
        rooms.push(r);
      }
    });
    // look for people to try and track
    needs.tasks.forEach(needT => {
      const r = KB.agent.lastSeen(needT.info.getTerms().agent);
      if (r) {
        rooms.push(r);
      }
    });
    if (rooms.length > 0) {
      const pick = Math.floor(Math.random() * rooms.length);
      return rooms[pick];
    } else {
      return this.getRandomRoom();
    }
  }

  getRandomRoom(): Room {
    let rooms = KB.roomMap.checkForUnexploredRooms();
    let pick;
    if (rooms.length) {
      pick = Math.floor(Math.random() * rooms.length);
    } else if (this._onlyAdjacent) {
      rooms = KB.get.curRoom.getAdjacentRooms();
      pick = Math.floor(Math.random() * rooms.length);
    } else {
      rooms = Array.from(KB.roomMap.rooms());
      pick = Math.floor(Math.random() * rooms.length);
    }
    return rooms[pick];
  }
}

import * as Assets from "../assets";
import {
  ClientAPI,
  getPanoptykDatetime,
  formatPanoptykDatetime,
  Room,
  Agent,
  Info
} from "panoptyk-engine/dist/client";
import { AgentSprite } from "../prefabs/agent";
import { UI } from "../ui/ui";
import { LocationIndex } from "../components/locationIndex";
import { MapLoader } from "../components/mapLoader";
import { DoorSprite } from "../prefabs/door";
import { ActionSel } from "../prefabs/actionSel";

const offset = Date.UTC(2019, 9, 28); // Current server beginning of time

interface RoomEvent {
  agentID: number;
  type: string;
  data: any;
}

class GameState extends Phaser.State {
  UI: UI;
  mapLoader: MapLoader;

  room: Room;
  previousRoom: Room;

  player: AgentSprite;
  standingLocs: LocationIndex;
  agentSpriteMap: Map<number, AgentSprite> = new Map();
  agentsInRoom: Set<number> = new Set();
  roomEvents: RoomEvent[] = new Array();

  // Groups
  groups: GameState.Groups = {} as any;
  public createGroups() {
    this.groups.gameWorld = this.game.add.group();
    this.groups.mapLayers = this.game.add.group();
    this.groups.otherAgents = this.game.add.group();
    this.groups.doorObjects = this.game.add.group();
    this.groups.gameWorld.add(this.groups.mapLayers);
    this.groups.gameWorld.add(this.groups.otherAgents);
    this.groups.gameWorld.add(this.groups.doorObjects);

    this.groups.HUD = this.game.add.group();
  }

  // PHASER CREATE FUNCTION //
  public create(): void {
    this.mapLoader = new MapLoader(this);

    ActionSel.doorEnterCallback = this.onDoorEnter;

    this.UI = UI.instance;
    (window as any).myUI = this.UI;
    this.UI.addMessage("Welcome to Panoptyk!");
    this.UI.refresh();

    // initialization code
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.input.mouse.capture = true;
    this.createGroups();

    this.room = ClientAPI.playerAgent.room;
    this.createHUD();

    // load map and set gameWorld location
    this.UI.setRoom(this.room);
    this.mapLoader.loadMap(this.room);

    // Initialize player
    const standLoc = this.standingLocs.getRandomLoc();
    const pos = standLoc.pos;
    this.createPlayer(pos.x, pos.y);
    this.player.standLocIndex = standLoc.index;

    // Add other agents
    this.loadAgents();

    ClientAPI.addOnUpdateListener(models => {
      models.Info.forEach(i => {
        this.scheduleRoomEvents(i);
      });
      this.UI.refresh();
    });

    // if not set to true things will break!
    this.game.stage.disableVisibilityChange = true;

    // this.game.onFocus.add(() => {
    //   console.log("Focus!");
    //   this.clearAgents();
    //   this.loadAgents();
    //   this.UI.refresh();
    // });
  }

  // PHASER UPDATE FUNCTION //
  public update(): void {
    // Update time
    this.UI.setTime(getPanoptykDatetime(offset));
    if (!ClientAPI.isUpdating()) {
      this.handleRoomEvents();
      // this.checkForRequests();
      if (ActionSel.currentMenu) {
        ActionSel.currentMenu.update();
      }
    }
    this.updateHUD();
  }

  // onClick server actions //
  private onDoorEnter = (sprite: DoorSprite) => {
    // add a loading image later
    this.groups.doorObjects.inputEnableChildren = false;
    const target = sprite.model;
    ClientAPI.moveToRoom(target)
      .catch(err => this.addConsoleMessage("Failed to move to room!"))
      .then(res => {
        const start = this.player.position;
        const end = sprite.position;
        this.moveAgent(this.player, start, end, () => {
          this.enterNewRoom();
        });
      })
      .catch(err => this.addConsoleMessage(err));
  };

  // HUD code //
  public createHUD() {}

  public updateHUD() {}

  private createPlayer(x: number, y: number): void {
    this.player = new AgentSprite(this.game, x, y, ClientAPI.playerAgent, false);
    this.groups.gameWorld.add(this.player);
  }

  private moveAgent(
    agent: Phaser.Sprite,
    start: Phaser.Point,
    end: Phaser.Point,
    callback = function() {}
  ) {
    agent.visible = false;
    agent.position.set(start.x, start.y);
    const tween = this.game.add.tween(agent).to(
      {
        x: end.x,
        y: end.y
      },
      1000,
      Phaser.Easing.Linear.None,
      true
    );
    tween.onComplete.add(() => {
      callback();
    });
    agent.visible = true;
  }

  private addConsoleMessage(messageString: string): void {
    console.log(messageString);
    this.UI.addMessage(messageString);
  }

  private enterNewRoom(): void {
    this.previousRoom = this.room;
    this.room = ClientAPI.playerAgent.room;
    this.UI.setRoom(this.room);
    this.addConsoleMessage("Moved to " + this.room.roomName);

    this.mapLoader.loadMap(this.room);
    this.clearAgents();
    this.loadAgents();

    const end = this.standingLocs.getRandomLoc();
    let start = end.pos;
    for (const door of this.groups.doorObjects.getAll()) {
      if (door.model.id === this.previousRoom.id) {
        start = door.position;
        break;
      }
    }
    this.player.standLocIndex = end.index;
    this.player.animating = true;
    this.moveAgent(this.player, start, end.pos, () => {
      this.player.animating = false;
    });
  }

  private clearAgents(): void {
    this.agentsInRoom.forEach(agent => {
      if (this.agentSpriteMap.has(agent)) {
        this.agentSpriteMap.get(agent).destroy();
        this.agentSpriteMap.delete(agent);
      }
    });
    Array.from(this.agentSpriteMap.values()).forEach(sprite => {
      sprite.destroy();
    });
    this.groups.otherAgents.getAll().forEach(agent => {
      agent.destroy();
    });
    this.agentSpriteMap = new Map();
    this.agentsInRoom = new Set();
    this.roomEvents = new Array();
  }

  private loadAgents() {
    const currentAgents = ClientAPI.playerAgent.room.getAgents(
      ClientAPI.playerAgent
    );
    currentAgents.forEach((agent: Agent) => {
      const standLoc = this.standingLocs.getRandomLoc();
      const agentSprite = new AgentSprite(
        this.game,
        standLoc.pos.x,
        standLoc.pos.y,
        agent
      );
      agentSprite.standLocIndex = standLoc.index;
      agentSprite.inputEnabled = true;
      this.groups.otherAgents.add(agentSprite);

      this.agentsInRoom.add(agent.id);
      this.agentSpriteMap.set(agent.id, agentSprite);
    });
  }

  private scheduleRoomEvents(info: Info) {
    const playerID = ClientAPI.playerAgent.id;
    if (!info.owner || info.isQuery() || info.owner.id !== playerID) {
      return;
    }
    const curRoomID = ClientAPI.playerAgent.room.id;
    const terms = info.getTerms();
    // MOVE Events
    if (info.action === "MOVE" && terms.agent.id !== playerID) {
      if (curRoomID === terms.loc1.id) {
        this.roomEvents.push({
          agentID: terms.agent.id,
          type: "left",
          data: terms.loc2
        });
      } else if (curRoomID === terms.loc2.id) {
        this.roomEvents.push({
          agentID: terms.agent.id,
          type: "entered",
          data: terms.loc1
        });
      }
    }
  }

  private handleEnter(event: RoomEvent) {
    const end = this.standingLocs.getRandomLoc();
    let start = end.pos;
    for (const door of this.groups.doorObjects.getAll()) {
      if (parseInt(door.name) === event.data.id) {
        start = door.position;
        break;
      }
    }
    const agentSprite = new AgentSprite(this.game, 0, 0, Agent.getByID(event.agentID));
    agentSprite.visible = false;
    agentSprite.standLocIndex = end.index;
    agentSprite.inputEnabled = true;
    this.groups.otherAgents.add(agentSprite);
    this.agentSpriteMap.set(event.agentID, agentSprite);
    this.agentsInRoom.add(event.agentID);
    agentSprite.animating = true;
    this.moveAgent(agentSprite, start, end.pos, () => {
      agentSprite.animating = false;
    });
    // Console Message
    const message =
      "Agent " + Agent.getByID(event.agentID).agentName + " entered the room";
    this.addConsoleMessage(message);
  }

  private handleLeave(agent: AgentSprite, event: RoomEvent) {
    let end = agent.position;
    for (const door of this.groups.doorObjects.getAll()) {
      if (parseInt(door.name) === event.data.id) {
        end = door.position;
        break;
      }
    }
    this.standingLocs.releaseIndex(agent.standLocIndex);
    this.moveAgent(agent, agent.position, end, () => {
      if (this.agentSpriteMap.has(event.agentID)) {
        this.agentSpriteMap.get(event.agentID).destroy();
        this.agentSpriteMap.delete(event.agentID);
        this.agentsInRoom.delete(event.agentID);
      }
    });

    // Console Message
    const message =
      "Agent " + Agent.getByID(event.agentID).agentName + " left the room";
    this.addConsoleMessage(message);
  }

  private checkForRequests() {
    if (this.UI.prompting) {
      return;
    }
    const convoRequesters = ClientAPI.playerAgent.conversationRequesters;
    if (convoRequesters.length > 0) {
      return;
    }
    const tradeRequesters = ClientAPI.playerAgent.tradeRequesters;
    if (tradeRequesters.length > 0) {
      return;
    }
  }

  private handleRoomEvents() {
    const unHandledEvents: RoomEvent[] = [];
    while (this.roomEvents.length) {
      const event = this.roomEvents.shift();
      console.log(event);
      if (event.type === "entered") {
        this.handleEnter(event);
      } else if (event.type === "left") {
        const agent = this.agentSpriteMap.get(event.agentID);
        if (agent && !agent.animating) {
          this.handleLeave(agent, event);
        }
      } else {
        unHandledEvents.push(event);
      }
    }
    this.roomEvents = unHandledEvents;
  }
}

namespace GameState {
  export interface Groups {
    gameWorld: Phaser.Group;
    mapLayers: Phaser.Group;
    otherAgents: Phaser.Group;
    doorObjects: Phaser.Group;
    HUD: Phaser.Group;
  }
}

export default GameState;

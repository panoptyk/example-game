import * as Assets from "../assets";
import {
  ClientAPI,
  getPanoptykDatetime,
  formatPanoptykDatetime,
  Room,
  Agent,
  Info,
  Trade,
  Item
} from "panoptyk-engine/dist/client";
import { AgentSprite } from "../prefabs/agent";
import { UI } from "../ui/ui";
import { LocationIndex } from "../components/locationIndex";
import { MapLoader } from "../components/mapLoader";
import { DoorSprite } from "../prefabs/door";
import { ItemSprite } from "../prefabs/item";
import { ActionSel } from "../prefabs/actionSel";
import { Event } from "../components/events/event";
import { EnterEvent } from "../components/events/enterEvent";
import { LeaveEvent } from "../components/events/leaveEvent";
import { LogOffEvent } from "../components/events/logOffEvent";
import { LogInEvent } from "../components/events/logInEvent";

const offset = Date.UTC(2019, 9, 28); // Current server beginning of time

class GameState extends Phaser.State {
  // idk how good this code is...
  public static instance: GameState;

  UI: UI;
  mapLoader: MapLoader;
  events: Event[] = new Array();

  room: Room;
  previousRoom: Room;
  movingRooms = false;
  standingLocs: LocationIndex;

  convoRequesters = new Set<Agent>();
  tradeRequesters = new Set<Agent>();
  convoRequests = new Set<Agent>();
  tradeRequests = new Set<Agent>();
  arrestableAgents = new Map<Agent, Info>();
  stealItems = new Set<Item>();

  lastActiveTrade: Trade = undefined;

  itemSpriteMap: Map<number, ItemSprite> = new Map();
  itemsInRoom: Set<number> = new Set();

  player: AgentSprite;
  agentSpriteMap: Map<number, AgentSprite> = new Map();
  agentsInRoom: Set<number> = new Set();

  // Groups
  groups: GameState.Groups = {} as any;
  public createGroups() {
    this.groups.gameWorld = this.game.add.group();
    this.groups.mapLayers = this.game.add.group();
    this.groups.otherAgents = this.game.add.group();
    this.groups.doorObjects = this.game.add.group();
    this.groups.items = this.game.add.group();
    this.groups.gameWorld.add(this.groups.mapLayers);
    this.groups.gameWorld.add(this.groups.otherAgents);
    this.groups.gameWorld.add(this.groups.doorObjects);
    this.groups.gameWorld.add(this.groups.items);

    this.groups.HUD = this.game.add.group();
  }

  // PHASER CREATE FUNCTION //
  public create(): void {
    // Link static reference to this
    GameState.instance = this;
    this.mapLoader = new MapLoader(this);

    ActionSel.doorEnterCallback = this.onDoorEnter;

    this.UI = UI.instance;
    (window as any).myUI = this.UI;
    this.UI.addMessage("Welcome to Panoptyk!", true);
    this.UI.refresh();

    // initialization code
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.input.mouse.capture = true;
    this.createGroups();

    this.room = ClientAPI.playerAgent.room;
    this.createUI();

    // load map and set gameWorld location
    this.UI.setRoom(this.room);
    this.mapLoader.loadMap(this.room);
    this.updateItems();

    // Initialize player
    const standLoc = this.standingLocs.getRandomLoc();
    const pos = standLoc.pos;
    this.createPlayer(pos.x, pos.y);
    this.player.standLocIndex = standLoc.index;

    // Add other agents
    this.loadAgents();

    ClientAPI.addOnUpdateListener(models => {
      models.Info.forEach(i => {
        this.scheduleEventsFromInfo(i);
      });
      this.updateItems();
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
    if (ClientAPI.playerAgent && !ClientAPI.isUpdating()) {
      // Schedule/handle events
      if (!this.movingRooms) {
        this.scheduleLogInOffEvents();
      }
      this.handleEvents();
      if (ActionSel.currentMenu) {
        ActionSel.currentMenu.update();
      }
      // log active trade
      if (this.lastActiveTrade && !ClientAPI.playerAgent.trade) {
        if (this.lastActiveTrade.resultStatus === 1) {
          this.addConsoleMessage("Trade successfully completed");
        } else if (this.lastActiveTrade.resultStatus === 0) {
          this.addConsoleMessage("Trade has been cancelled");
        }
        this.lastActiveTrade = undefined;
      } else {
        this.lastActiveTrade = ClientAPI.playerAgent.trade;
      }
      // update any UI
      this.updateUI();
      // update chat bubbles
      this.player.update();
      this.groups.otherAgents.forEach((agent: AgentSprite) => {
        agent.update();
      });
    }
  }

  // onClick server actions //
  private onDoorEnter = (sprite: DoorSprite) => {
    // add a loading image later
    this.groups.doorObjects.inputEnableChildren = false;
    const target = sprite.model;
    this.movingRooms = true;
    ClientAPI.moveToRoom(target)
      .catch(err => {
        this.addConsoleMessage("Failed to move to room!");
        this.movingRooms = false;
      })
      .then(res => {
        const start = this.player.position;
        const end = sprite.position;
        this.player.move(start, end, () => {
          this.convoRequests = new Set();
          this.tradeRequests = new Set();
          this.enterNewRoom();
          this.updateItems();
          this.movingRooms = false;
        });
      });
  };

  // UI code //
  public createUI() {}

  public updateUI() {
    // Check all convo/trade requests' status by player
    const player = ClientAPI.playerAgent;
    // Check for accepts
    if (player.conversation) {
      const otherAgent = player.conversation.getAgents(player)[0];
      if (this.convoRequests.has(otherAgent)) {
        this.addConsoleMessage(
          otherAgent.agentName + " accepted your conversation request"
        );
        this.UI.setRightTab(UI.RTABS.CONVERSATION);
        this.convoRequests = new Set();
      }
    }

    if (player.trade) {
      const otherAgent = player.trade.conversation.getAgents(player)[0];
      if (this.tradeRequests.has(otherAgent)) {
        this.addConsoleMessage(
          otherAgent.agentName + " accepted your trade request"
        );
        this.UI.setRightTab(UI.RTABS.TRADE);
        this.tradeRequests = new Set();
      }
    }

    // Check for decline
    let requests = new Set();
    this.convoRequests.forEach(agent => {
      if (!player.conversationRequested.includes(agent)) {
        this.addConsoleMessage(
          agent.agentName + " has declined your conversation request"
        );
      } else {
        requests.add(agent);
      }
    });
    this.convoRequests = requests;

    requests = new Set();
    this.tradeRequests.forEach(agent => {
      if (!player.tradeRequested.includes(agent)) {
        this.addConsoleMessage(
          agent.agentName + " has declined your trade request"
        );
      } else {
        requests.add(agent);
      }
    });
    this.tradeRequests = requests;

    // Check recieved convo/trade requests
    player.conversationRequesters.forEach(agent => {
      if (!this.convoRequesters.has(agent)) {
        this.addConsoleMessage(
          agent.agentName + " has requested a conversation with you"
        );
      }
    });
    this.convoRequesters = new Set(player.conversationRequesters);

    player.tradeRequesters.forEach(agent => {
      if (!this.tradeRequesters.has(agent)) {
        this.addConsoleMessage(
          agent.agentName + " has requested a trade with you"
        );
      }
    });
    this.tradeRequesters = new Set(player.tradeRequesters);

    if (
      ClientAPI.playerAgent.faction &&
      ClientAPI.playerAgent.faction.factionType === "police"
    ) {
      this.arrestableAgents.clear();
      player.activeAssignedQuests.forEach(quest => {
        if (quest.task.action === Info.ACTIONS.ARRESTED.name) {
          const terms = quest.task.getTerms();
          this.arrestableAgents.set(terms.agent2, terms.info);
        }
      });
    }

    if (
      ClientAPI.playerAgent.faction &&
      ClientAPI.playerAgent.faction.factionType === "criminal"
    ) {
      this.stealItems.clear();
      player.activeAssignedQuests.forEach(quest => {
        const terms = quest.task.getTerms();
        if (quest.type === "command" && terms.item) {
          this.stealItems.add(terms.item);
        }
      });
    }
  }

  private createPlayer(x: number, y: number): void {
    this.player = new AgentSprite(
      this.game,
      x,
      y,
      ClientAPI.playerAgent,
      false
    );
    this.groups.gameWorld.add(this.player);
  }

  public addConsoleMessage(messageString: string): void {
    console.log(messageString);
    this.UI.addMessage(messageString);
  }

  private enterNewRoom(): void {
    this.previousRoom = this.room;
    this.room = ClientAPI.playerAgent.room;
    this.UI.setRoom(this.room);

    this.clearAgents();
    this.clearItems();
    this.events = new Array();
    this.mapLoader.loadMap(this.room);
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
    this.player.move(start, end.pos, () => {});
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
  }

  private loadAgents() {
    const currentAgents = ClientAPI.playerAgent.room.getAgents(
      ClientAPI.playerAgent
    );
    currentAgents.forEach((agent: Agent) => {
      if (!this.agentsInRoom.has(agent.id)) {
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
      }
    });
  }

  private clearItems(): void {
    this.itemsInRoom.forEach(item => {
      if (this.itemSpriteMap.has(item)) {
        this.itemSpriteMap.get(item).destroy();
        this.itemSpriteMap.delete(item);
      }
    });
    Array.from(this.itemSpriteMap.values()).forEach(sprite => {
      sprite.destroy();
    });
    this.groups.items.getAll().forEach(item => {
      item.destroy();
    });
    this.itemSpriteMap = new Map();
    this.itemsInRoom = new Set();
  }

  private updateItems() {
    const inRoom = new Set(this.room.getItems().map(item => item.id));
    const removes = [];
    this.itemsInRoom.forEach(id => {
      if (!inRoom.has(id)) {
        removes.push(id);
      }
    });
    removes.forEach(id => {
      this.itemsInRoom.delete(id);
      const sprite = this.itemSpriteMap.get(id);
      if (sprite) {
        this.standingLocs.releaseIndex(sprite.standLocIndex);
        sprite.destroy();
        this.itemSpriteMap.delete(id);
      }
    });

    this.room.getItems().forEach(item => {
      if (!this.itemsInRoom.has(item.id)) {
        // add item
        this.itemsInRoom.add(item.id);
        const sprite = this.itemSpriteMap.get(item.id);
        if (!sprite) {
          const loc = this.standingLocs.getRandomLoc();
          const itemSprite = new ItemSprite(
            this.game,
            loc.pos.x,
            loc.pos.y,
            item,
            true
          );
          itemSprite.standLocIndex = loc.index;
          this.groups.items.add(itemSprite);
          this.itemSpriteMap.set(item.id, itemSprite);
        }
      }
    });
  }

  // for agents who may have logged out or in
  private scheduleLogInOffEvents() {
    const currentAgents = ClientAPI.playerAgent.room.getAgents(
      ClientAPI.playerAgent
    );
    const theRoom = new Set(currentAgents.map(a => a.id));
    const removes = [];
    // Who logged out?
    this.agentsInRoom.forEach(id => {
      if (!theRoom.has(id)) {
        removes.push(id);
      }
    });
    removes.forEach(id => {
      this.agentsInRoom.delete(id);
      this.events.push(new LogOffEvent(this, Agent.getByID(id)));
    });
    // Who logged in?
    currentAgents.forEach(agent => {
      if (!this.agentsInRoom.has(agent.id)) {
        this.agentsInRoom.add(agent.id);
        this.events.push(new LogInEvent(this, agent));
      }
    });
  }

  private scheduleEventsFromInfo(info: Info) {
    const playerID = ClientAPI.playerAgent.id;
    if (!info.owner || info.isQuery() || info.owner.id !== playerID) {
      return;
    }
    const curRoomID = ClientAPI.playerAgent.room.id;
    const terms = info.getTerms();
    // MOVE Events
    if (info.action === "MOVE" && terms.agent.id !== playerID) {
      if (curRoomID === terms.loc1.id) {
        this.events.push(new LeaveEvent(this, terms.agent, terms.loc2));
      } else if (curRoomID === terms.loc2.id) {
        this.events.push(new EnterEvent(this, terms.agent, terms.loc1));
      }
    }
  }

  private handleEvents() {
    const unHandledEvents: Event[] = [];
    while (this.events.length) {
      const event = this.events.shift();
      // console.log(event);
      if (event.canProcess()) {
        event.process();
      } else {
        unHandledEvents.push(event);
      }
    }
    this.events = unHandledEvents;
  }

  public logConvoRequest(agent: Agent) {
    this.convoRequests.add(agent);
    this.addConsoleMessage("Conversation requested with " + agent.agentName);
  }

  public logTradeRequest(agent: Agent) {
    this.tradeRequests.add(agent);
    this.addConsoleMessage("Trade requested with " + agent.agentName);
  }
}

namespace GameState {
  export interface Groups {
    gameWorld: Phaser.Group;
    mapLayers: Phaser.Group;
    otherAgents: Phaser.Group;
    items: Phaser.Group;
    doorObjects: Phaser.Group;
    HUD: Phaser.Group;
  }
}

export default GameState;

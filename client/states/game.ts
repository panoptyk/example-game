import * as Assets from "../assets";
import {
  ClientAPI,
  getPanoptykDatetime,
  formatPanoptykDatetime,
  Room,
  Agent,
  Info
} from "panoptyk-engine/dist/client";
import { ListView } from "../components/listview";
import { AgentSprite } from "../prefabs/agent";
import { UI } from "../ui/ui";

const offset = Date.UTC(2019, 9, 28); // Current server beginning of time

interface RoomEvent {
  agentID: number;
  type: string;
  data: any;
}

export class Game extends Phaser.State {
  private UI: UI;
  private map: Phaser.Tilemap;

  private room: Room;
  private previousRoom: Room;
  private roomText: Phaser.Text;
  private dateText: Phaser.Text;

  private floorLayer: Phaser.TilemapLayer;
  private wallLayer: Phaser.TilemapLayer;

  private player: AgentSprite;
  private standingLocs = {
    tileWidth: 0,
    tileHeight: 0,
    width: 0,
    height: 0,
    offset: new Phaser.Point(0, 0),
    possible: []
  };
  private agentSpriteMap: Map<number, AgentSprite> = new Map();
  private agentsInRoom: Set<number> = new Set();
  private roomEvents: RoomEvent[] = new Array();

  private listView: ListView;
  private clientConsole: ListView;

  // Groups
  private gameWorld: Phaser.Group;
  private mapLayers: Phaser.Group;
  private otherAgents: Phaser.Group;
  private doorObjects: Phaser.Group;
  private HUD: Phaser.Group;

  public createGroups() {
    this.gameWorld = this.game.add.group();
    this.mapLayers = this.game.add.group();
    this.otherAgents = this.game.add.group();
    this.doorObjects = this.game.add.group();
    this.gameWorld.add(this.mapLayers);
    this.gameWorld.add(this.otherAgents);
    this.gameWorld.add(this.doorObjects);

    this.HUD = this.game.add.group();
  }

  // PHASER CREATE FUNCTION //
  public create(): void {
    this.UI = new UI();
    (window as any).myUI = this.UI;
    // Initialization code
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.input.mouse.capture = true;
    this.createGroups();

    this.room = ClientAPI.playerAgent.room;
    this.createHUD();

    // load map and set gameWorld location
    this.loadMap(ClientAPI.playerAgent.room);
    this.gameWorld.position.set(
      50,
      50
    );
    this.gameWorld.scale.set(2, 2);

    // Initialize player
    const standLoc = this.getStandingLoc();
    const pos = standLoc.pos;
    this.createPlayer(pos.x, pos.y);
    this.player.standLocIndex = standLoc.index;

    // Add other agents
    this.loadAgents();

    ClientAPI.addOnUpdateListener(models => {
      models.Info.forEach(i => {
        this.scheduleRoomEvents(i);
      });
    });

    this.game.onFocus.add(() => {
      console.log("Focus!");
      this.clearAgents();
      this.loadAgents();
    });
  }

  // PHASER UPDATE FUNCTION //
  public update(): void {
    this.updateHUD();
    if (!ClientAPI.isUpdating()) {
      this.handleRoomEvents();
    }
  }

  // HUD code //
  public createHUD() {
    const style = { font: "25px Arial", fill: "#ffffff" };
    const spacing = 10;
    this.roomText = this.game.add.text(
      undefined,
      undefined,
      "Room: " + this.room.roomName,
      style
    );
    this.roomText.position.set(spacing / 2, 0);

    this.dateText = this.game.add.text(undefined, undefined, "", style);
    this.dateText.position.set(this.roomText.width + spacing, 0);
    this.HUD.add(this.roomText);
    this.HUD.add(this.dateText);
    this.HUD.position.set(
      this.game.world.centerX - this.HUD.getLocalBounds().width / 2,
      5
    );
  }

  public updateHUD() {
    const dateTime = formatPanoptykDatetime(getPanoptykDatetime(offset));
    this.dateText.setText(
      "Year: " +
        dateTime.year +
        "  Day: " +
        dateTime.day +
        "   " +
        dateTime.hour +
        ":00"
    );
    this.HUD.position.set(
      this.game.world.centerX - this.HUD.getLocalBounds().width / 2,
      5
    );
  }

  private loadMap(room: Room): void {
    if (this.map) {
      this.map.destroy();
      this.doorObjects.getAll().forEach(child => {
        child.destroy();
      });
      this.mapLayers.getAll().forEach(child => {
        child.destroy();
      });
    }
    this.doorObjects.visible = false;
    this.mapLayers.alpha = 0;
    // Load
    this.map = this.game.add.tilemap(
      Assets.TilemapJSON.TilemapsMapsTemplateRoom.getName()
    );
    this.map.addTilesetImage(
      Assets.Images.TilemapsTilesTilesDungeonV11.getName()
    );
    // create floor layer
    this.floorLayer = this.map.createLayer(
      "Floor",
      this.map.tileWidth * this.map.width,
      this.map.tileHeight * this.map.height,
      this.mapLayers
    );
    this.floorLayer.fixedToCamera = false;

    // create wall layer
    this.wallLayer = this.map.createLayer(
      "Wall",
      this.map.tileWidth * this.map.width,
      this.map.tileHeight * this.map.height,
      this.mapLayers
    );
    this.wallLayer.fixedToCamera = false;

    // create map of room to door
    const roomToDoor = {};
    this.map.objects["Doors"].forEach(door => {
      roomToDoor[door.name] = door;
    });

    // add door objects
    this.doorObjects.inputEnableChildren = true;
    const style = { font: "25px Arial", fill: "#ffffff" };
    let i = 1;
    ClientAPI.playerAgent.room.getAdjacentRooms().forEach((room: Room) => {
      const door = roomToDoor["door" + i];
      const box = this.game.make.sprite(door.x, door.y);
      box.name = "" + room.id;
      box.alpha = 1;
      box.width = door.width;
      box.height = door.height;
      const hoverText = this.game.make.text(0, -28, room.roomName, style);
      hoverText.visible = false;
      box.addChild(hoverText);
      this.game.add.existing(box);
      this.doorObjects.add(box);
      i++;
    });
    this.doorObjects.onChildInputDown.add(this.onDoorClicked, this);
    this.doorObjects.onChildInputOver.add(sprite => {
      sprite.getChildAt(0).visible = true;
    });
    this.doorObjects.onChildInputOut.add(sprite => {
      sprite.getChildAt(0).visible = false;
    });
    this.world.bringToTop(this.doorObjects);
    this.doorObjects.visible = true;
    this.mapLayers.alpha = 1;

    // create possible standing locations
    const standArea = this.map.objects["Areas"][0];
    this.standingLocs.height = Math.floor(
      standArea.height / this.map.tileHeight
    );
    this.standingLocs.width = Math.floor(standArea.width / this.map.tileWidth);
    this.standingLocs.offset.set(standArea.x, standArea.y);
    this.standingLocs.tileHeight = this.map.tileHeight;
    this.standingLocs.tileWidth = this.map.tileWidth;
    this.standingLocs.possible = [];
    for (
      let loc = 0;
      loc < this.standingLocs.height * this.standingLocs.width;
      loc++
    ) {
      this.standingLocs.possible.push(loc);
    }
    console.log(this.standingLocs.possible);
  }

  public getStandingLoc(): { pos: Phaser.Point; index: number } {
    const index = Math.floor(Math.random() * this.standingLocs.possible.length);
    console.log("index chosen: " + index);
    const loc = this.standingLocs.possible[index];
    const x =
      (loc % this.standingLocs.width) * this.standingLocs.tileWidth +
      this.standingLocs.offset.x;
    const y =
      Math.floor(loc / this.standingLocs.width) * this.standingLocs.tileHeight +
      this.standingLocs.offset.y;
    this.standingLocs.possible.splice(index);
    return { pos: new Phaser.Point(x, y), index };
  }

  private createPlayer(x: number, y: number): void {
    this.player = new AgentSprite(this.game, x, y);
    this.gameWorld.add(this.player);
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
  }

  private async onDoorClicked(sprite: Phaser.Sprite): Promise<void> {
    // add a loading image later
    this.doorObjects.inputEnableChildren = false;
    const temp = Room.getByID(parseInt(sprite.name));
    await ClientAPI.moveToRoom(temp)
      .then(res => {
        this.previousRoom = this.room;
        this.room = ClientAPI.playerAgent.room;
        this.roomText.setText("Room: " + this.room.roomName);
        this.addConsoleMessage("Moved to " + this.room.roomName);

        this.loadMap(this.room);
        this.clearAgents();
        this.loadAgents();

        const end = this.getStandingLoc();
        let start = end.pos;
        for (const door of this.doorObjects.getAll()) {
          if (parseInt(door.name) === this.previousRoom.id) {
            start = door.position;
            break;
          }
        }
        this.player.standLocIndex = end.index;
        this.player.animating = true;
        this.moveAgent(this.player, start, end.pos, () => {
          this.player.animating = false;
        });
      })
      .catch(err => this.addConsoleMessage("Failed to move to room!"));
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
    this.otherAgents.getAll().forEach(agent => {
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
      const standLoc = this.getStandingLoc();
      const agentSprite = new AgentSprite(
        this.game,
        standLoc.pos.x,
        standLoc.pos.y
      );
      agentSprite.id = agent.id;
      agentSprite.standLocIndex = standLoc.index;
      agentSprite.inputEnabled = true;
      this.otherAgents.add(agentSprite);

      this.agentsInRoom.add(agent.id);
      this.agentSpriteMap.set(agent.id, agentSprite);
    });
  }

  private scheduleRoomEvents(info: Info) {
    const playerID = ClientAPI.playerAgent.id;
    if (info.owner.id !== playerID) {
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
    const end = this.getStandingLoc();
    let start = end.pos;
    for (const door of this.doorObjects.getAll()) {
      if (parseInt(door.name) === event.data.id) {
        start = door.position;
        break;
      }
    }
    const agentSprite = new AgentSprite(this.game, 0, 0);
    agentSprite.visible = false;
    agentSprite.id = event.agentID;
    agentSprite.standLocIndex = end.index;
    agentSprite.inputEnabled = true;
    this.otherAgents.add(agentSprite);
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
    for (const door of this.doorObjects.getAll()) {
      if (parseInt(door.name) === event.data.id) {
        end = door.position;
        break;
      }
    }
    this.standingLocs.possible.push(agent.standLocIndex);
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

import * as Assets from "../assets";
import {
  ClientAPI,
  getPanoptykDatetime,
  formatPanoptykDatetime,
  Room,
  Agent
} from "panoptyk-engine/dist/client";
import { ListView } from "../components/listview";
import { AgentSprite } from "../prefabs/agent";

const offset = Date.UTC(2019, 9, 28); // Current server beginning of time

interface RoomEvent {
  agentID: number;
  type: string;
}

export class Game extends Phaser.State {
  private map: Phaser.Tilemap;

  private room: Room;
  private roomText: Phaser.Text;
  private dateText: Phaser.Text;

  private floorLayer: Phaser.TilemapLayer;
  private wallLayer: Phaser.TilemapLayer;
  private doorObjects: Phaser.Group;

  private player: Phaser.Sprite;
  private agentSpriteMap: Map<number, AgentSprite> = new Map();
  private agentsInRoom: number[] = new Array();
  private roomEvents: RoomEvent[] = new Array();

  private listView: ListView;
  private clientConsole: ListView;

  public create(): void {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.game.input.mouse.capture = true;

    this.room = ClientAPI.playerAgent.room;
    const style = { font: "35px Arial", fill: "#ffffff" };
    this.roomText = this.game.add.text(
      undefined,
      undefined,
      "Room: " + this.room.roomName,
      style
    );
    this.roomText.position.set(
      this.game.world.centerX - this.roomText.width / 2,
      0
    );

    this.dateText = this.game.add.text(undefined, undefined, "", style);
    this.dateText.position.set(
      this.game.world.centerX - this.roomText.width / 2,
      40
    );

    // add tileset map
    this.map = this.game.add.tilemap(
      Assets.TilemapJSON.TilemapsMapsRoom1.getName()
    );
    this.map.addTilesetImage(
      "dungeon_tileset",
      Assets.Images.TilemapsTilesTilesDungeonV11.getName()
    );
    this.loadMap();

    this.loadPlayer();

    // Add other players
    this.loadAgents();

    this.createClientConsole();

    this.createInventory();
    this.loadInventory();
  }

  private loadMap(): void {
    // create floor layer
    this.floorLayer = this.map.createLayer("Floor");
    this.floorLayer.fixedToCamera = false;
    this.floorLayer.resize(
      this.map.tileWidth * this.map.width,
      this.map.tileHeight * this.map.height
    );
    this.floorLayer.position.set(
      this.game.world.centerX - this.floorLayer.width / 2,
      this.game.world.height / 4
    );

    // create wall layer
    this.wallLayer = this.map.createLayer("Walls");
    this.wallLayer.fixedToCamera = false;
    this.wallLayer.resize(
      this.map.tileWidth * this.map.width,
      this.map.tileHeight * this.map.height
    );
    this.wallLayer.position.set(
      this.game.world.centerX - this.wallLayer.width / 2,
      this.game.world.height / 4 /*- this.wallLayer.height / 2 */
    );

    // add door objects
    this.doorObjects = this.game.add.group();
    this.doorObjects.inputEnableChildren = true;
    this.map.createFromObjects(
      "Doors",
      481,
      Assets.Images.ImagesDoor.getName(),
      undefined,
      true,
      false,
      this.doorObjects
    );
    this.map.createFromObjects(
      "Doors",
      482,
      Assets.Images.ImagesSideDoor.getName(),
      undefined,
      true,
      false,
      this.doorObjects
    );
    this.doorObjects.position.set(
      this.game.world.centerX - this.floorLayer.width / 2,
      this.game.world.height / 4
    );
    this.doorObjects.onChildInputDown.add(this.onDoorClicked, this);
  }

  public update(): void {
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
    this.scheduleAgentRoomEvents();
  }

  private loadPlayer(): void {
    const playerLocation = this.getPlayerPosition();
    this.player = new AgentSprite(
      this.game,
      playerLocation.x,
      playerLocation.y
    );
    this.game.add.existing(this.player);
  }

  // creates a position for the player
  private getPlayerPosition(): any {
    // not done
    const x =
      this.doorObjects.getChildAt(0).position.x +
      this.floorLayer.position.x -
      this.map.tileWidth;
    const y =
      this.doorObjects.getChildAt(0).position.y +
      this.floorLayer.position.y -
      2 * this.map.tileHeight;
    const point = new Phaser.Point(x, y);
    return point;
  }

  private createClientConsole(): void {
    const style = { font: "16px Arial", fill: "#ffffff" };
    const header = this.game.add.text(0, 0, "Console", style);
    this.clientConsole = new ListView(this.game, 350, 150, header);
    this.clientConsole.moveTo(
      this.game.world.centerX - 175,
      this.wallLayer.position.y + this.wallLayer.height + 30
    );
  }

  private addConsoleMessage(messageString: string): void {
    const style = { font: "12px Arial", fill: "#ffffff" };
    const message = this.game.add.text(0, 0, messageString, style);
    this.clientConsole.add(message);
  }

  private createInventory(): void {
    const style = { font: "16px Arial", fill: "#ffffff" };
    const header = this.game.add.text(0, 0, "Inventory", style);
    this.listView = new ListView(this.game, 200, 400, header);
    this.listView.moveTo(
      this.game.world.centerX + this.map.widthInPixels / 2 + 30,
      this.game.world.centerY / 4
    );
  }

  private loadInventory(): void {
    ClientAPI.playerAgent.inventory.forEach(item => {
      const rowString = item.itemName;
      this.createInventoryRow(this.listView, rowString);
    });
  }

  private createInventoryRow(listview: ListView, rowString: string): void {
    const group = this.game.add.group();
    const fill = this.game.add.graphics(0, 0);
    fill.beginFill(0xffffff).drawRect(0, 0, listview.width, 25);

    const style = { font: "16px Arial", fill: "#000000" };
    const text = this.game.add.text(0, 0, rowString, style);

    group.add(fill);
    group.add(text);

    listview.add(group);
  }

  private async onDoorClicked(sprite: Phaser.Sprite): Promise<void> {
    // add a loading image later

    const temp = ClientAPI.playerAgent.room.getAdjacentRooms()[
      this.doorObjects.getChildIndex(sprite)
    ];
    await ClientAPI.moveToRoom(temp)
      .then(res => {
        this.room = ClientAPI.playerAgent.room;
        this.roomText.setText("Room: " + this.room.roomName);
        this.addConsoleMessage("Room changed to " + temp.roomName);

        this.clearAgents();
        this.loadAgents();
      })
      .catch(err => this.addConsoleMessage("Room change fail!"));
  }

  private clearAgents(): void {
    this.agentsInRoom.forEach(agent => {
      if (this.agentSpriteMap.has(agent)) {
        this.agentSpriteMap.get(agent).kill();
        this.agentSpriteMap.delete(agent);
      }
    });
    this.agentsInRoom = new Array();
    this.roomEvents = new Array();
  }

  // creates a random point for an agent
  private createAgentPosition(): any {
    const x =
      Math.floor(Math.random() * this.floorLayer.width) -
      this.floorLayer.width / 2;
    const y = Math.floor(Math.random() * this.floorLayer.height);
    return new Phaser.Point(
      x + this.game.world.centerX,
      y + this.game.world.height / 4
    );
  }

  private loadAgents() {
    const currentAgents = ClientAPI.playerAgent.room.getAgents(
      ClientAPI.playerAgent
    );
    currentAgents.forEach((agent: Agent) => {
      const agentPosition = this.createAgentPosition();
      const agentSprite = new AgentSprite(
        this.game,
        agentPosition.x,
        agentPosition.y
      );
      agentSprite.inputEnabled = true;
      this.game.add.existing(agentSprite);
      this.agentsInRoom.push(agent.id);
      this.agentSpriteMap.set(agent.id, agentSprite);
    });
  }

  private scheduleAgentRoomEvents() {
    const currentAgents = ClientAPI.playerAgent.room.getAgents(
      ClientAPI.playerAgent
    );
    const agentsLeft = [...this.agentsInRoom];
    currentAgents.forEach((agent: Agent) => {
      const index = agentsLeft.indexOf(agent.id);
      if (index !== -1) {
        // remove agents who are in room to see who is left
        agentsLeft.splice(index);
      } else {
        // else new agent entered room
        this.agentsInRoom.push(agent.id);
        this.roomEvents.push({ agentID: agent.id, type: "entered" });
      }
    });
    agentsLeft.forEach(agentID => {
      this.roomEvents.push({ agentID, type: "left" });
      const index = this.agentsInRoom.indexOf(agentID);
      if (index !== -1) {
        this.agentsInRoom.splice(index);
      }
    });
  }

  private handleRoomEvents() {
    const unHandledEvents: RoomEvent[] = [];
    while (this.roomEvents.length) {
      const event = this.roomEvents.pop();
      if (event.type === "entered") {
         // This can be replaced with animation code
         const pos = this.createAgentPosition();
         const agentSprite = new AgentSprite(this.game, pos.x, pos.y);
         agentSprite.inputEnabled = true;
         this.game.add.existing(agentSprite);
         this.agentSpriteMap.set(event.agentID, agentSprite);
         // Console Message
         const message = "Agent " + Agent.getByID(event.agentID).agentName + " entered the room";
         this.addConsoleMessage(message);
      }
      else if (event.type === "left") {
         if (this.agentSpriteMap.has(event.agentID)) {
            this.agentSpriteMap.get(event.agentID).kill();
            this.agentSpriteMap.delete(event.agentID);
         }
         // Console Message
         const message = "Agent " + Agent.getByID(event.agentID).agentName + " left the room";
         this.addConsoleMessage(message);
      }
      else {
         unHandledEvents.push(event);
      }
    }
    this.roomEvents = unHandledEvents;
  }
}

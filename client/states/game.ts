import * as Assets from "../assets";
import { ClientAPI, Room } from "panoptyk-engine/dist/client";
import { ListView } from "../components/listview";

export class Game extends Phaser.State {
  private map: Phaser.Tilemap;

  private room: Room;
  private roomText: Phaser.Text;

  private floorLayer: Phaser.TilemapLayer;
  private wallLayer: Phaser.TilemapLayer;
  private doorObjects: Phaser.Group;

  private listView: ListView;

  public create(): void {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    this.game.input.mouse.capture = true;

    this.room = ClientAPI.playerAgent.room;

    const style = { font: "65px Arial", fill: "#ffffff" };
    this.roomText = this.game.add.text(undefined, undefined, "Room: " + this.room.roomName, style);
    this.roomText.position.set(this.game.world.centerX - this.roomText.width / 2, 0);

    // add tileset map
    this.map = this.game.add.tilemap(Assets.TilemapJSON.TilemapsMapsRoom1.getName());
    this.map.addTilesetImage("dungeon_tileset", Assets.Images.TilemapsTilesTilesDungeonV11.getName());

    // create floor layer
    this.floorLayer = this.map.createLayer("Floor");
    this.floorLayer.fixedToCamera = false;
    this.floorLayer.resize(this.map.tileWidth * this.map.width, this.map.tileHeight * this.map.height);
    this.floorLayer.position.set(this.game.world.centerX - this.floorLayer.width / 2, this.game.world.height / 4);

    // create wall layer
    this.wallLayer = this.map.createLayer("Walls");
    this.wallLayer.fixedToCamera = false;
    this.wallLayer.resize(this.map.tileWidth * this.map.width, this.map.tileHeight * this.map.height);
    this.wallLayer.position.set(this.game.world.centerX - this.wallLayer.width / 2, this.game.world.height / 4 /*- this.wallLayer.height / 2 */);

    // add door objects
    this.doorObjects = this.game.add.group();
    this.doorObjects.inputEnableChildren = true;
    this.map.createFromObjects("Doors", 481, Assets.Images.ImagesDoor.getName(), undefined, true, false, this.doorObjects);
    this.map.createFromObjects("Doors", 482, Assets.Images.ImagesSideDoor.getName(), undefined, true, false, this.doorObjects);
    this.doorObjects.position.set(this.game.world.centerX - this.floorLayer.width / 2, this.game.world.height / 4);
    this.doorObjects.onChildInputDown.add(this.onDoorClicked, this);

    this.createInventory();
    this.loadInventory();
   }

   public createInventory(): void {
      this.listView = new ListView(this.game);
      this.listView.moveTo(this.game.world.centerX + this.map.widthInPixels / 2 + 30, this.game.world.centerY / 4);
   }

   public loadInventory(): void {
      ClientAPI.playerAgent.inventory.forEach(item => {
         const rowString = item.itemName;
         this.createInventoryRow(this.listView, rowString);
      });
   }

   public createInventoryRow(listview: ListView, rowString: string): void {
      const group = this.game.add.group();
      const fill = this.game.add.graphics(0, 0);
      fill.beginFill(0xffffff).drawRect(0, 0, listview.width, 25);

      const style = { font: "16px Arial", fill: "#000000" };
      const text = this.game.add.text(0, 0 , rowString, style);

      group.add(fill);
      group.add(text);

      listview.add(group);
   }

  public async onDoorClicked(sprite: Phaser.Sprite): Promise<void> {
    // add a loading image later

    const temp = ClientAPI.playerAgent.room.getAdjacentRooms()[this.doorObjects.getChildIndex(sprite)];
    await ClientAPI.moveToRoom(temp).then(res => {
      this.room = ClientAPI.playerAgent.room;
      this.roomText.setText("Room: " + this.room.roomName);
      console.log("room changed");
    })
    .catch(err => console.log("room change fail!"));
  }
}

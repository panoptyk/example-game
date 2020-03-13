import * as Assets from "../assets";
import {
  ClientAPI,
  getPanoptykDatetime,
  formatPanoptykDatetime,
  Room,
  Agent,
  Info
} from "panoptyk-engine/dist/client";
import Game from "../states/game";
import { LocationIndex } from "./locationIndex";
import { DoorSprite } from "../prefabs/door";

// map from Room.prototype.roomName to actual tilemap (if different)
const MapKey = {
  "East Bentham": Assets.TilemapJSON.TilemapsMapsEastBentham.getName(),
  "West Bentham": Assets.TilemapJSON.TilemapsMapsWestBentham.getName(),
  "South Bentham": Assets.TilemapJSON.TilemapsMapsSouthBentham.getName(),
  "North Bentham": Assets.TilemapJSON.TilemapsMapsNorthBentham.getName(),
  "North Bentham Gate": Assets.TilemapJSON.TilemapsMapsNorthBenthamGate.getName(),
  "Redbrick Cafe": Assets.TilemapJSON.TilemapsMapsRedbrickCafe.getName(),
  "Straw Roof Inn": Assets.TilemapJSON.TilemapsMapsStrawRoofInn.getName(),
  "Crooked Sword Tavern (main)": Assets.TilemapJSON.TilemapsMapsCSTavern.getName(),
  "Crooked Sword Tavern (back room)": Assets.TilemapJSON.TilemapsMapsCSTavernBack.getName(),
  "Crooked Sword Tavern (upper)": Assets.TilemapJSON.TilemapsMapsCSTavernUpper.getName(),
  "Crooked Sword Back Alley": Assets.TilemapJSON.TilemapsMapsBackAlley.getName(),
  "Town Watch": Assets.TilemapJSON.TilemapsMapsGuild1.getName(),
  "Shady Den": Assets.TilemapJSON.TilemapsMapsGuild2.getName(),
  "***'s House": Assets.TilemapJSON.TilemapsMapsPlayerHouseA.getName()
};
// map from Room.prototype.roomName to door label (if different)
const DoorKey = {
  "Redbrick Cafe": "Cafe#1",
  "Straw Roof Inn": "Inn#1",
  "Crooked Sword Tavern (main)": "Tavern#1",
  "Crooked Sword Tavern (back room)": "Tavern#1:back",
  "Crooked Sword Tavern (upper)": "Tavern#1:upper",
  "Crooked Sword Back Alley": "BackAlley#1",
  "Town Watch": "Guild#1",
  "Shady Den": "Guild#2",
  "***'s House": "PlayerHouse#1"
};

const ToTileMapName = function(room: Room) {
  const tileMapName = MapKey[room.roomName];
  if (tileMapName) {
    return tileMapName;
  }
  return Assets.TilemapJSON["TilemapsMaps" + room.roomName].getName();
};
const ToDoorName = function(room: Room) {
  const doorName = DoorKey[room.roomName];
  if (doorName) {
    return doorName;
  }
  // default
  return room.roomName;
};

export class MapLoader {
  GS: Game;
  map: Phaser.Tilemap;
  groups: Game.Groups;
  game: Phaser.Game;
  world: Phaser.World;

  constructor(gameState: Game) {
    this.GS = gameState;
    this.groups = gameState.groups;
    this.game = gameState.game;
    this.world = gameState.world;
  }

  public loadMap(room: Room): void {
    if (this.map) {
      this.map.destroy();
      this.groups.doorObjects.getAll().forEach(child => {
        child.destroy();
      });
      this.groups.mapLayers.getAll().forEach(child => {
        child.destroy();
      });
      this.GS.player.position.set(0);
      this.groups.doorObjects.position.set(0);
      this.groups.mapLayers.position.set(0);
    }
    // Load tilemap
    this.map = this.game.add.tilemap(
      ToTileMapName(room)
    );

    this.groups.gameWorld.width = this.map.widthInPixels;
    this.groups.gameWorld.height = this.map.heightInPixels;
    this.groups.gameWorld.position.set(0);

    this.map.tilesets.forEach(set => {
      this.map.addTilesetImage(set.name);
    });

    this.map.layers.forEach(layerObj => {
      const index = this.map.getLayerIndex(layerObj.name);
      const layer = new Phaser.TilemapLayer(
        this.game,
        this.map,
        index,
        this.map.widthInPixels,
        this.map.heightInPixels
      );
      layer.fixedToCamera = false;
      this.groups.mapLayers.add(layer);
    });

    // create map of room to door
    const roomToDoor = {};
    this.map.objects["Doors"].forEach(door => {
      roomToDoor[door.name] = door;
    });

    // add door objects
    this.groups.doorObjects.inputEnableChildren = true;
    ClientAPI.playerAgent.room.getAdjacentRooms().forEach((room: Room) => {
      const door = roomToDoor[ToDoorName(room)];
      const box = new DoorSprite(
        this.game,
        door.x,
        door.y,
        door.width,
        door.height,
        room
      );
      box.name = "" + room.id;
      this.game.add.existing(box);
      this.groups.doorObjects.add(box);
    });
    this.world.bringToTop(this.groups.doorObjects);

    // create possible standing locations
    this.GS.standingLocs = new LocationIndex(
      this.map.objects["Standing_Area"],
      this.map.tileWidth,
      this.map.tileHeight
    );

    // Scale and set position
    const scale = Math.min(
      (this.world.width * 0.98) / this.map.widthInPixels,
      (this.world.height * 0.98) / this.map.heightInPixels
    );
    this.groups.gameWorld.scale.set(Math.fround(scale));
    this.groups.gameWorld.position.set(
      this.world.centerX - this.groups.gameWorld.width / 2,
      this.world.centerY - this.groups.gameWorld.height / 2
    );

    // For things post-scaling (apparently takes time for Phaser to latch scale)
    // tslint:disable-next-line: ban
    setTimeout(() => {
      // Create hover text
      this.groups.doorObjects.getAll().forEach((door: DoorSprite) => {
        door.createHoverText();
      });
    }, 300);
  }

}

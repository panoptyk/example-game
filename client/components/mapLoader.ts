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

const RoomKey = {
  "Downtown": Assets.TilemapJSON.TilemapsMapsDowntown.getName(),
  "House1": Assets.TilemapJSON.TilemapsMapsHouse1.getName(),
  "Inn": Assets.TilemapJSON.TilemapsMapsInn.getName(),
  

  "room1": Assets.TilemapJSON.TilemapsMapsRoom1.getName(),
  "room2": Assets.TilemapJSON.TilemapsMapsRoom2.getName(),
  "room3": Assets.TilemapJSON.TilemapsMapsRoom3.getName(),
  "room4": Assets.TilemapJSON.TilemapsMapsRoom4.getName(),
  "room5": Assets.TilemapJSON.TilemapsMapsRoom5.getName(),
  "room6": Assets.TilemapJSON.TilemapsMapsRoom6.getName(),
  "room7": Assets.TilemapJSON.TilemapsMapsRoom7.getName(),
  "room8": Assets.TilemapJSON.TilemapsMapsRoom8.getName(),
  "room9": Assets.TilemapJSON.TilemapsMapsRoom9.getName(),
  "room10": Assets.TilemapJSON.TilemapsMapsRoom10.getName()
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
      RoomKey[room.roomName]
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
      const door = roomToDoor[room.roomName];
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
      this.map.objects["Areas"],
      this.map.tileWidth,
      this.map.tileHeight
    );

    // Scale and set position
    const scale = Math.min(
      (this.world.width * 0.95) / this.map.widthInPixels,
      (this.world.height * 0.95) / this.map.heightInPixels
    );
    this.groups.gameWorld.scale.set(scale);
    this.groups.gameWorld.position.set(
      this.world.centerX - this.groups.gameWorld.width / 2,
      this.world.centerY - this.groups.gameWorld.height / 2
    );
  }

}

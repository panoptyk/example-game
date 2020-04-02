import { Room, Item, Controller } from "panoptyk-engine";

class Spawner {
  private _spawns: Spawner.SpawnData[];
  constructor() {
    this._spawns = [];
  }

  public addNewSpawn(
    room: Room,
    master: Item,
    max: number,
    ratePerSec: number
  ) {
    this._spawns.push({
      room,
      master,
      maxQuantity: max,
      elapsedTime: Math.floor(Math.random() * 500),
      msToNextCheck: Math.floor(1000 / ratePerSec)
    });
  }

  public checkSpawns(deltaT: number) {
    this._spawns.forEach(data => {
      const quantity = data.room.getItems().filter(i => {
        return i.sameAs(data.master);
      }).length;
      if (quantity !== data.maxQuantity) {
        data.elapsedTime += deltaT;
      }
      if (
        quantity < data.maxQuantity &&
        data.elapsedTime > data.msToNextCheck
      ) {
        data.elapsedTime -= data.msToNextCheck;
        this.spawn(data);
      }
    });
  }

  private spawn(data: Spawner.SpawnData) {
    const controller = new Controller();
    const item = data.master.copy(1);
    controller.addItemsToRoom(data.room, [item]);
    controller.sendUpdates();
  }
}

namespace Spawner {
  export interface SpawnData {
    room: Room;
    master: Item;
    maxQuantity: number;
    elapsedTime: number;
    msToNextCheck: number;
  }
}

export { Spawner };

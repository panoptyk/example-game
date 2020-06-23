import { Agent, Room, ClientAPI, Item } from "panoptyk-engine/dist/client";
import { RoomMap } from "../lib";
import { Key } from "phaser-ce";

class ItemPrices {
    // Singleton Patten
    private static _instance: ItemPrices;

    public static get instance(): ItemPrices {
      if (!ItemPrices._instance) {
        ItemPrices._instance = new ItemPrices();
      }
      return ItemPrices._instance;
    }

    // constructor() {
    //     this.setPrices();
    // }

    private priceMap: Map<Item, number> = new Map<Item, number>();

    // TODO: Figure out why the map is busted completely
    public getPrice(item: Item): number {
        // console.log (item);
        // console.log(this.priceMap);
        // console.log(this.priceMap.has(item));
        return 20;
        let found = false;
        let price = -1;
        const keys = Array.from(this.priceMap.keys());
        for (const key of keys) {
            if (key.id === item.id) {
                price = this.priceMap.get(key);
            }
        }
        return price;
        if (found) {
            console.log(this.priceMap.get(item));
            return this.priceMap.get(item);
        }
        return -1;
    }

    // ----- TEMP -----
    public setPrices(): void {
        this.priceMap.set(Item.getByID(1), 4);
        this.priceMap.set(Item.getByID(3), 7);
        this.priceMap.set(Item.getByID(5) as Item, 10);
        // console.log(this.priceMap);
    }

}

export { ItemPrices };
export default ItemPrices.instance;
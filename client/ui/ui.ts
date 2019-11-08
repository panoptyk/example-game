import Vue from "vue";
import App from "./App.vue";
import { Agent, Info, Room, Item, formatPanoptykDatetime } from "panoptyk-engine/dist/client";

// useful formats
interface InfoTableEntry {
  id: number;
  action;
  time: string;
  agent1;
  loc1;
  loc2;
  agent2;
  item;
}

export class UI {
  // Singleton pattern
  private static _instance: UI;
  public static get instance() {
    if (!UI._instance) {
      UI._instance = new UI();
    }
    return UI._instance;
  }

  private vm: Vue;
  private main: Vue;
  constructor() {
    this.vm = new Vue({
      render: h => h(App)
    }).$mount("#app");
    this.main = this.vm.$children[0];
    // set up info table column headers
    this.main.$data.infoCols = [
      {
        field: "id",
        label: "ID",
        width: "40",
        numeric: true
      },
      {
        field: "action",
        label: "Action"
      },
      {
        field: "time",
        label: "Time"
      },
      {
        field: "agent1",
        label: "Agent1"
      },
      {
        field: "loc1",
        label: "Location1"
      },
      {
        field: "loc2",
        label: "Location2"
      },
      {
        field: "agent2",
        label: "Agent2"
      },
      {
        field: "item",
        label: "Item"
      }
    ];
  }

  public setTime(time) {
    this.main.$data.time = time;
  }

  public setRoom(room: Room) {
    this.main.$data.room = room.roomName;
  }

  public clearInfoTable() {
    this.main.$data.allInfo = [];
  }

  public addInfoToTable(info: Info) {
    const time = formatPanoptykDatetime(info.time);
    const infoEntry: InfoTableEntry = {
      id: info.id,
      action: info.action,
      agent1: (Agent.getByID(info.agents[0]) as Agent),
      agent2: (Agent.getByID(info.agents[1]) as Agent),
      loc1: (Room.getByID(info.locations[0]) as Room),
      loc2: (Room.getByID(info.locations[1]) as Room),
      item: (Item.getByID(info.items[0]) as Item),
      time: "" + time.dayName + " day " + time.day + " year " + time.year
    };
    infoEntry.agent1 = infoEntry.agent1 ? infoEntry.agent1.agentName : undefined;
    infoEntry.agent2 = infoEntry.agent2 ? infoEntry.agent2.agentName : undefined;
    infoEntry.loc1 = infoEntry.loc1 ? infoEntry.loc1.roomName : undefined;
    infoEntry.loc2 = infoEntry.loc2 ? infoEntry.loc2.roomName : undefined;
    infoEntry.item = infoEntry.item ? infoEntry.item.itemName : undefined;

    (this.main.$data.allInfo as InfoTableEntry[]).push(infoEntry);
  }
}

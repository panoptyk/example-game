import Vue from "vue";
import { DialogProgrammatic as Dialog } from "Buefy";
import App from "./App.vue";
import {
  Agent,
  Info,
  Room,
  Item,
  formatPanoptykDatetime,
  ClientAPI,
} from "panoptyk-engine/dist/client";

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

const verbMap = {
  "???": "what someone did",
  MOVE: "who moved",
  PICKUP: "who picked up what",
  DROP: "who dropped what",
  KNOW: "who knows what",
  CONVERSE: "who conversed with who",
  GREET: "who greeted who",
  ASK: "who asked what",
  TOLD: "who told what",
  GAVE: "who gave what",
  QUEST: "who assigned a quest to who",
  QUEST_COMPLETE: "who completed a quest",
  QUEST_FAILED: "who failed a quest",
  LOCATED_IN: "where an item is",
};

export class UI {
  // Singleton pattern
  private static _instance: UI;
  public static get instance() {
    if (!UI._instance) {
      UI._instance = new UI();
    }
    return UI._instance;
  }

  public static readonly RTABS = {
    REQUESTS: 0,
    CONVERSATION: 1,
    TRADE: 2,
  };

  public static readonly LTABS = {
    INSPECT: 0,
    ITEMS: 1,
    INFO: 2,
    QUEST: 3,
  };

  private lastLeftTab: typeof UI.LTABS;
  private lastRightTab: typeof UI.RTABS;

  private vm: Vue;
  public main: Vue;
  private trigger = 0;
  public prompting = false;
  constructor() {
    this.vm = new Vue({
      render: (h) => h(App),
    }).$mount("#app");
    this.main = this.vm.$children[0];
    // set up console data
    this.maxMsgs = this.main.$data.maxMsgs;
    // set up list of actions
    const acts = ["???"];
    for (const act in Info.ACTIONS) {
      acts.push(Info.ACTIONS[act].name);
    }
    const temp = [];
    acts.forEach(val => {
      if (verbMap[val]) {
        temp.push({value: val, display: verbMap[val]});
      }
    });
    this.main.$data.listOfActions = temp;
    // initial tabs positions
    this.setLeftTab(UI.LTABS.INFO);
  }

  public setTime(time) {
    this.main.$data.time = time;
  }

  public setRoom(room: Room) {
    this.main.$data.room = room.roomName;
  }

  public setInspectTarget(model) {
    this.main.$data.inspectTarget = model;
    if (model === undefined) {
      this.goBackLeftTab();
    }
  }

  public refresh() {
    this.trigger = (this.trigger + 1) % 2;
    this.main.$data.trigger = this.trigger;
  }

  // Console management
  private msgID = 0;
  private maxMsgs;
  public addMessage(m: string, consoleLog = false) {
    if (consoleLog) {
      console.log(m);
    }
    this.main.$data.messages.push({ msg: m, id: this.msgID++ });
    this.msgID = this.msgID % (this.maxMsgs * 2);
  }

  public setLeftTab(index) {
    this.lastLeftTab = this.main.$data.activeLSideBarTab;
    this.main.$data.activeLSideBarTab = index;
  }

  public goBackLeftTab() {
    this.setLeftTab(this.lastLeftTab);
  }

  public setRightTab(index) {
    this.lastRightTab = this.main.$data.activeRSideBarTab;
    this.main.$data.activeRSideBarTab = index;
  }

  public goBackRightTab() {
    this.setRightTab(this.lastRightTab);
  }
}

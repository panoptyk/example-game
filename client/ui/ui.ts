import Vue from "vue";
import { DialogProgrammatic as Dialog } from "Buefy";
import App from "./App.vue";
import {
  Agent,
  Info,
  Room,
  Item,
  formatPanoptykDatetime,
  ClientAPI
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
  private trigger = 0;
  public prompting = false;
  constructor() {
    this.vm = new Vue({
      render: h => h(App)
    }).$mount("#app");
    this.main = this.vm.$children[0];
    // set up console data
    this.maxMsgs = this.main.$data.maxMsgs;
    // set up list of actions
    this.main.$data.listOfActions = ["???"];
    for (const act in Info.ACTIONS) {
      this.main.$data.listOfActions.push(Info.ACTIONS[act].name);
    }
  }

  public setTime(time) {
    this.main.$data.time = time;
  }

  public setRoom(room: Room) {
    this.main.$data.room = room.roomName;
  }

  public refresh() {
    this.trigger = (this.trigger + 1) % 2;
    this.main.$data.trigger = this.trigger;
  }

  public convoRequest(requester: Agent) {
    this.prompting = true;
    Dialog.confirm({
      title: "Conversation Requested",
      message:
        (requester ? requester.agentName : "Unknown") +
        " has requested a conversation with you.",
      cancelText: "Decline",
      confirmText: "Accept",
      trapFocus: true,
      onCancel: () => {
        ClientAPI.rejectConversation(requester).finally(() => {
          this.prompting = false;
        });
      },
      onConfirm: () => {
        ClientAPI.acceptConversation(requester).finally(() => {
          this.prompting = false;
        });
      }
    });
  }

  // Console management
  private msgID = 0;
  private maxMsgs;
  public addMessage(m: string) {
    this.main.$data.messages.push({ msg: m, id: this.msgID++ });
    this.msgID = this.msgID % this.maxMsgs;
  }
}

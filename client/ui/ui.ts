import Vue from "vue";
import App from "./App.vue";
import { Info } from "panoptyk-engine/dist/client";

// components();

export class UI {
  private vm: Vue;
  private main: Vue;
  constructor() {
    this.vm = new Vue({
        render: h => h(App)
    }).$mount("#ui-overlay");
    this.main = this.vm.$children[0];
  }

  public addInfoItem(info: Info) {
      (this.main.$refs.infoItems as any).infos.push({message: "Dummy Sentence that is information"});
  }
}

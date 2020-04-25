<template>
  <div id="quest-tab" class="game-tab">
    <h3>Active Quests</h3>
    <template v-for="q of openQuests">
      <div class="quest-box" v-bind:key="q.id">
        <div class="quest-id">#{{ q.id }}</div>
        <div class="quest-text">
          <quest-entry v-bind:quest="q"></quest-entry>
        </div>
      </div>
    </template>
    <h3>Completed Quests</h3>
    <template v-for="q of closedQuests">
      <div class="quest-box" v-bind:key="q.id">
        <div class="quest-id">#{{ q.id }}</div>
        <div class="quest-text">
          <quest-entry v-bind:quest="q"></quest-entry>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import {
  ClientAPI,
  Agent,
  Room,
  Item,
  Info,
  Quest,
} from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import QuestEntry from "./questEntry.vue";
import { UI } from "./../ui";

@Component({
  components: {
    "quest-entry": QuestEntry,
  },
})
export default class QuestTab extends Vue {
  @Prop({ default: 0 }) trigger: number;

  openQuests = [];
  closedQuests = [];

  @Watch("trigger")
  updateInfo() {
    if (!ClientAPI.playerAgent) {
      return;
    }

    this.openQuests = ClientAPI.playerAgent.activeAssignedQuests;
    this.closedQuests = ClientAPI.playerAgent.closedAssignedQuests.reverse();
    const pastVal = UI.instance.main.$data.activeQuest;
    UI.instance.main.$data.activeQuests = this.openQuests.length;
    if (pastVal < this.openQuests.length) {
      UI.instance.addMessage("You have recieved a new quest!", true);
    }
  }
}
</script>

<style>
.quest-box {
  border: 2px;
  border-style: solid;
  border-color: var(--item-border);
  background-color: var(--item-background);
  display: flex;
  margin-top: 5px;
  margin-bottom: 5px;
}
.quest-id {
  flex: 0;
  text-align: left;
  padding-left: 10px;
  min-width: 75px;
}
.quest-text {
  flex: 1;
}
</style>

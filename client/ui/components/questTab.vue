<template>
  <div id="quest-tab" class="game-tab">
    <div class="container">
      Filters: NONE
    </div>
    <template v-for="q of subsetQuests">
      <div class="quest-box" v-bind:key="q.id">
        <div class="quest-id">#{{ q.id }}</div>
        <div class="quest-text">
          <quest-entry v-bind:quest="q"></quest-entry>
        </div>
      </div>
    </template>
    <b-pagination
      :total="total"
      :current="curPage"
      :per-page="perPage"
      @change="onPageChange"
      aria-next-label="Next page"
      aria-previous-label="Previous page"
      aria-page-label="Page"
      aria-current-label="Current page"
    ></b-pagination>
  </div>
</template>

<script lang="ts">
import {
  ClientAPI,
  Agent,
  Room,
  Item,
  Info,
  Quest
} from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import QuestEntry from "./questEntry.vue";

@Component({
  components: {
    "quest-entry": QuestEntry
  }
})
export default class QuestTab extends Vue {
  @Prop({ default: 0 }) trigger: number;

  quests = [];
  subsetQuests = [];

  total = 0;
  curPage = 1;
  perPage = 10;
  onPageChange(page) {
    this.curPage = page;
  }

  @Watch("trigger")
  updateInfo() {
    if (!ClientAPI.playerAgent) {
      this.quests = [];
      return;
    }

    this.quests = ClientAPI.playerAgent.activeAssignedQuests;
  }

  @Watch("quests")
  updateTotal() {
    this.total = this.quests.length;
  }

  @Watch("curPage")
  @Watch("total")
  portionOfInfo() {
    const start = (this.curPage - 1) * this.perPage;
    const end = Math.min(start + this.perPage, this.total);
    this.subsetQuests = this.quests
      .slice(0)
      .sort((a, b) => {
        return b - a;
      })
      .slice(start, end);
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
  min-width: 100px;
}
.quest-text {
  flex: 1;
}
</style>

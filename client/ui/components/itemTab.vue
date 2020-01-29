<template>
  <div id="item-tab" class="game-tab">
    <div class="container">
      Filters: NONE
    </div>
    <template v-for="i of subsetItems">
      <div class="item-box" v-bind:key="i.id">
        <div class="item-id">#{{ i.id }}</div>
        <div class="item-text">
          <item-entry v-bind:info="i.item"></item-entry>
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
  Info
} from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import ItemEntry from "./itemEntry.vue";

@Component({
  components: {
    "item-entry": ItemEntry
  }
})
export default class ItemTab extends Vue {
  @Prop({ default: 0 }) trigger: number;

  items = [];
  subsetItems = [];

  total = 1;
  curPage = 1;
  perPage = 10;
  onPageChange(page) {
    this.curPage = page;
  }

  @Watch("trigger")
  updateInfo() {
    if (!ClientAPI.playerAgent) {
      this.items = [];
      return;
    }

    this.items = ClientAPI.playerAgent.inventory;
  }

  @Watch("items")
  updateTotal() {
    this.total = this.items.length;
  }

  @Watch("curPage")
  @Watch("total")
  portionOfInfo() {
    const start = (this.curPage - 1) * this.perPage;
    const end = Math.min(start + this.perPage, this.total);
    this.subsetItems = this.items
      .sort((a, b) => {
        return b - a;
      })
      .slice(0)
      .splice(start, this.perPage)
      .map(this.processItem);
  }
  processItem(id) {
    const item = Item.getByID(id);
    if (!item) {
      return { id };
    }

    return {
      id,
      item: {
        id
      }
    };
  }
}
</script>

<style>
</style>
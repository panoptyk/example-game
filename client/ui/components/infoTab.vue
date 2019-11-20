<template>
  <div id="info-tab" class="game-tab">
    <template v-for="i of subsetInfo">
      <div class="info-box" v-bind:key="i.id">
        <info-entry v-bind:action="i.action" v-bind:terms="i.terms"></info-entry>
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
import { ClientAPI, Info } from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import infoEntry from "./infoEntry.vue";

@Component({
  components: {
    "info-entry": infoEntry
  }
})
export default class InfoTab extends Vue {
  @Prop() trigger = 0;
  info = [];
  subsetInfo = [];
  total = 6;
  curPage = 1;
  perPage = 5;
  onPageChange(page) {
    this.curPage = page;
  }

  @Watch("info")
  updateTotal() {
    this.total = this.info.length;
  }
  @Watch("trigger")
  updateInfo() {
    this.info = ClientAPI.playerAgent
      ? Array.from((ClientAPI.playerAgent as any)._knowledge)
      : [];
  }
  @Watch("curPage")
  @Watch("trigger")
  portionOfInfo() {
    const start = (this.curPage - 1) * this.perPage;
    const end = Math.min(start + this.perPage, this.total);
    this.subsetInfo = this.info.slice(0).splice(start, this.perPage).map(this.processInfo);
  }
  processInfo(id) {
    const info = Info.getByID(id);
    if (!info) {
      return {id};
    }
    
    return {
      id,
      action: info.action,
      terms: info.getTerms()
    };
  }
}
</script>

<style>
.info-box {
  border: 2px;
  border-style: solid;
  border-color: antiquewhite;
  margin-top: 2px;
  background-color: dimgrey;
}
</style>
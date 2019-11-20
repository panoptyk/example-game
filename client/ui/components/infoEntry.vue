<template>
  <div class="info-entry">
      <template v-if="info.action === 'MOVE'">
        {{ agent }} <span class="action">moved</span> from {{ loc1 }} to {{ loc2 }}.
      </template>
      <template v-else-if="info.action === 'PICKUP'">

      </template>
      <template v-else-if="info.action === 'DROP'">
        
      </template>
      <template v-else>
        .
      </template>
  </div>
</template>

<script lang="ts">
import { Info } from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

@Component({
  
})
export default class ItemEntry extends Vue {
  @Prop() info = {
    action: "",
    terms: {} as any
  }
  @Watch("info")
  update() {
    this.$forceUpdate();
  }
  get agent() {
    return this.info.terms.agent ? this.info.terms.agent.agentName : "???";
  }
  get agent1() {
    return this.info.terms.agent1 ? this.info.terms.agent1.agentName : "???";
  }
  get agent2() {
    return this.info.terms.agent2 ? this.info.terms.agent2.agentName : "???";
  }
  get loc() {
    return this.info.terms.loc ? this.info.terms.loc.roomName : "???";
  }
  get loc1() {
    return this.info.terms.loc1 ? this.info.terms.loc1.roomName : "???";
  }
  get loc2() {
    return this.info.terms.loc2 ? this.info.terms.loc2.roomName : "???";
  }
  get item() {
    return this.info.terms.item ? this.info.terms.item.itemName : "???";
  }
}
</script>

<style>
</style>
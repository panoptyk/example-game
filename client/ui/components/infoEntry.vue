<template>
  <div class="info-entry">
    <template v-if="info.action === 'MOVE'">
      <span class="agent"> {{ agent }}</span>
      <span class="action">moved</span>
      from {{ loc1 }} to {{ loc2 }}
      at <span class="time"> {{ time }}</span>.
    </template>
    <template v-else-if="info.action === 'PICKUP'">
      <span class ="agent"> {{ agent }}</span>
      <span class="action">picked up</span>
      <span class="item"> {{ item }}</span> at the {{ loc }}
      at <span class="time"> {{ time }}</span>.
    </template>
    <template v-else-if="info.action === 'DROP'">
      <span class ="agent"> {{ agent }}</span>
      <span class="action">dropped</span>
      <span class="item"> {{ item }}</span> in {{ loc }}
      at <span class="time"> {{ time }}</span>.
    </template>
    <template v-else-if="info.action === 'CONVERSE'">
      <span class="agent"> {{ agent1 }}</span>
      <span class="action">conversed</span>
      with <span class="agent"> {{ agent2 }}</span> in {{ loc }}
      at <span class="time"> {{ time }}</span>.
    </template>
    <template v-else-if="info.action === 'TOLD'">
      <span class="agent"> {{ agent1 }}</span>
      <span class="action">told</span>
      <span class="agent"> {{ agent2 }}</span> 
      <span class="info"> {{ infoItem }}</span> in {{ loc }}
      at <span class="time"> {{ time }}</span>.
    </template>
  </div>
</template>

<script lang="ts">
import { Info } from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

@Component({})
export default class InfoEntry extends Vue {
  @Prop({ default: { id: 0, action: "", terms: {} } }) info: {
    id: number;
    action: string;
    terms: any;
  };
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
  get infoItem() {
    return this.info.terms.info ? "about info #" + this.info.terms.info.id : "???";
  }
  get time() {
    return this.info.terms.time ? this.info.terms.time : "??";
  }
}
</script>

<style></style>

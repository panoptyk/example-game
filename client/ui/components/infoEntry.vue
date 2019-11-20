<template>
  <div class="info-entry">
      <template v-if="action === 'MOVE'">
        {{ agent }} <span class="action">moved</span> from {{ loc1 }} to {{ loc2 }}.
      </template>
      <template v-else-if="action === 'PICKUP'">

      </template>
      <template v-else-if="action === 'DROP'">
        
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
  @Prop() action = "";
  @Prop() terms = {} as any;
  get agent() {
    return this.terms.agent ? this.terms.agent.agentName : "???";
  }
  get agent1() {
    return this.terms.agent1 ? this.terms.agent1.agentName : "???";
  }
  get agent2() {
    return this.terms.agent2 ? this.terms.agent2.agentName : "???";
  }
  get loc() {
    return this.terms.loc ? this.terms.loc.roomName : "???";
  }
  get loc1() {
    return this.terms.loc1 ? this.terms.loc1.roomName : "???";
  }
  get loc2() {
    return this.terms.loc2 ? this.terms.loc2.roomName : "???";
  }
  get item() {
    return this.terms.item ? this.terms.item.itemName : "???";
  }
}
</script>

<style>
</style>
<template>
  <div id="inspect-tab" class="game-tab">
    INSPECT TAB
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

@Component({
  components: {
    
  }
})
export default class InspectTab extends Vue {
  @Prop({ default: 0 }) trigger: number;

}
</script>

<style>

</style>
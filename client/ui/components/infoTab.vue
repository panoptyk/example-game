<template>
  <div id="info-tab" class="game-tab">
      <b-table :data="allInfo" :columns="infoCols" :paginated="true" :per-page="5"></b-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

@Component({
  
})
export default class InfoTab extends Vue {
  @Prop() allInfo;
  @Prop() infoCols;
}
</script>

<style>
</style>
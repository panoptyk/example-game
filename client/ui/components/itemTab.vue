<template>
  <div id="item-tab" class="game-tab">
      ITEM TAB
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

@Component({
  
})
export default class ItemTab extends Vue {
  @Prop() allItems;
}
</script>

<style>
</style>
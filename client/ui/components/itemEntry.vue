<template>
  <div class="item-entry">
      {{ item.itemName }}
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Item } from "panoptyk-engine/dist/client";

@Component({
  
})
export default class ItemEntry extends Vue {
  @Prop({ default: {} }) item: Item;
}
</script>

<style>
</style>
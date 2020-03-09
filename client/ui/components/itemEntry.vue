<template>
  <div class="item-entry">
      <span class="item"> {{ item.itemName }} </span> <br />
      Item Tags: {{ itemTags }}
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Item } from "panoptyk-engine/dist/client";

@Component({
  
})
export default class ItemEntry extends Vue {
  @Prop({ default: {} }) item: Item;

  get itemTags() {
    if (this.item.itemTags.size > 0) {
      const tags = Array.from(this.item.itemTags);
      let sentence = tags.pop();
      for (const tag in tags) {
        sentence += ", " + tag;
      }
      return sentence;
    }
    return "None";
  }
}
</script>

<style>
</style>
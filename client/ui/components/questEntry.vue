<template>
  <div class="quest-entry">
      {{ quest.type }}
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Quest } from "panoptyk-engine/dist/client";

@Component({
  
})
export default class QuestEntry extends Vue {
  @Prop({ default: {} }) quest: Quest;
}
</script>

<style>
</style>
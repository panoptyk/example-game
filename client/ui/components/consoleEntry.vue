<template>
  <b-notification
    class="console-entry"
    style="margin-bottom: 5px;"
    aria-close-label="Close notification"
    v-on:close="removeIndex"
  >
  <slot></slot>
  </b-notification>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

@Component({})
export default class ConsoleEntry extends Vue {
  @Prop() index;
  removeIndex() {
    (this.$parent as any).messages.splice(this.index, 1);
  }
}
</script>

<style>
</style>
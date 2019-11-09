<template>
  <b-notification
    class="console-entry"
    style="margin-bottom: 5px;"
    aria-close-label="Close notification"
  ><slot></slot></b-notification>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

@Component({})
export default class ConsoleEntry extends Vue {}
</script>

<style>
</style>
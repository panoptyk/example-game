<template>
  <div id="console">
    <console-entry
      v-for="(message, index) in messages.slice().reverse()"
      v-bind:key="message.id"
      v-bind:index="messages.length - index - 1"
      >{{ message.msg }}</console-entry
    >
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import consoleEntry from "./consoleEntry.vue";

@Component({
  components: {
    "console-entry": consoleEntry
  }
})
export default class Console extends Vue {
  @Prop({ default: 5 }) max;
  @Prop({ default: [] }) messages;
  @Watch("messages")
  enforceMaxNotifications() {
    while (this.messages.length > this.max) {
      this.messages.shift();
    }
  }
}
</script>

<style>
#console {
  width: 100%;
  height: auto;
  max-width: auto;
  max-height: auto;
  overflow-y: scroll;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  padding: 10px;

  border: 0px;
  border-top: 2px;
  border-color: var(--borders);
  border-style: solid;
}
#console::-webkit-scrollbar {
  width: 0;
  height: 0;
}
</style>

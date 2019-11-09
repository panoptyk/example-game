<template>
  <div id="console">
    <console-entry v-for="test in tests.slice().reverse()" v-bind:key="test" > {{ test }}</console-entry>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import consoleEntry from "./consoleEntry.vue";

@Component({
  components: {
    "console-entry": consoleEntry
  }
})
export default class Console extends Vue {
  @Prop() tests = [];
}
</script>

<style>
#console {
  width: 100%;
  max-width: auto;
  max-height: 250px;
  overflow-y: scroll;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  margin-top: 10px;
  padding: 10px;

  border: 5px;
  border-color: antiquewhite;
  border-style: solid;
}
#console::-webkit-scrollbar {
    width: 0;
    height: 0;
}
</style>
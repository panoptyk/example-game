<template>
  <div id="app">
    <div id="game-top-row">
      <div id="game-outline">
        <div id="game-top-bar">
          <div
            v-if="showTopBar"
          >Room: {{ room }} | Year: {{ time.year }} | Day: {{ time.day }} | Hour: {{ time.hour }}</div>
        </div>
        <div id="phaser-game"></div>
      </div>
      <div id="game-sidebar">
        <b-tabs v-model="activeSideBarTab" type="is-boxed" position="is-centered">
          <b-tab-item label="Items">
            <item-tab></item-tab>
          </b-tab-item>
          <b-tab-item label="Info">
            <info-tab v-bind:allInfo="allInfo" v-bind:infoCols="infoCols"></info-tab>
          </b-tab-item>
          <b-tab-item label="Conversation">
            <convo-tab></convo-tab>
          </b-tab-item>
          <b-tab-item label="Trade">
            <trade-tab></trade-tab>
          </b-tab-item>
        </b-tabs>
      </div>
    </div>
    <console></console>
  </div>
</template>

<script lang="ts">
import "buefy/dist/buefy.css";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import infoTab from "./components/infoTab.vue";
import itemTab from "./components/itemTab.vue";
import conversationTab from "./components/conversationTab.vue";
import tradeTab from "./components/tradeTab.vue";
import Console from "./components/console.vue";

@Component({
  components: {
    "info-tab": infoTab,
    "item-tab": itemTab,
    "convo-tab": conversationTab,
    "trade-tab": tradeTab,
    console: Console
  }
})
export default class App extends Vue {
  // Top Bar logic
  showTopBar = false;
  @Watch("room")
  @Watch("time")
  displayTopBar() {
    this.showTopBar = true;
  }
  room = "";
  time = {
    year: "",
    day: "",
    hour: ""
  };
  // Sidebar data
  activeSideBarTab = 0;
  allInfo = [];
  infoCols = [];
}
</script>

<style lang="scss">
// Import Bulma's core
@import "~bulma/sass/utilities/_all";

// Set your colors
$primary: #8c67ef;
$primary-invert: findColorInvert($primary);
$twitter: #4099ff;
$twitter-invert: findColorInvert($twitter);

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: (
  "white": (
    $white,
    $black
  ),
  "black": (
    $black,
    $white
  ),
  "light": (
    $light,
    $light-invert
  ),
  "dark": (
    $dark,
    $dark-invert
  ),
  "primary": (
    $primary,
    $primary-invert
  ),
  "info": (
    $info,
    $info-invert
  ),
  "success": (
    $success,
    $success-invert
  ),
  "warning": (
    $warning,
    $warning-invert
  ),
  "danger": (
    $danger,
    $danger-invert
  ),
  "twitter": (
    $twitter,
    $twitter-invert
  )
);

// Links
$link: $primary;
$link-invert: $primary-invert;
$link-focus-border: $primary;

// Notification element
$notification-padding: .25rem .25rem .5rem .5rem;

// Import Bulma and Buefy styles
// Latches changes made above
@import "~bulma";
@import "~buefy/src/scss/buefy";

body {
  width: 100%;
  text-align: center;
  background-color: black;
}
#app {
  width: 1600px;
  margin-left: auto;
  margin-right: auto;
}
#game-top-row {
  width: inherit;
  height: auto;
  display: flex;
  align-items: stretch;
}
#game-outline {
  margin-right: 5px;
  border: 5px;
  border-color: antiquewhite;
  border-style: solid;
}
#phaser-game {
  display: inline-block;
}
#game-top-bar {
  height: 30px;
  border: 0px;
  border-bottom: 2px;
  border-color: antiquewhite;
  border-style: solid;
  color: aliceblue;
}
#game-sidebar {
  width: 100%;
  margin-left: 5px;
  padding-top: 10px;
  flex: 1;

  border: 5px;
  border-color: antiquewhite;
  border-style: solid;
}
.game-tab {
  color: antiquewhite;
}
</style>
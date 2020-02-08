<template>
  <div id="app">
    <div id="game-top-row">
      <div id="game-leftbar" class="game-sidebar">
        <b-tabs v-model="activeLSideBarTab" type="is-boxed" position="is-centered">
          <b-tab-item label="Items">
            <item-tab
              v-bind:trigger="trigger"
              ></item-tab>
          </b-tab-item>

          <b-tab-item label="Info">
            <info-tab
              v-bind:trigger="trigger"
              v-bind:defaultActions="listOfActions"
              v-bind:agents="agents"
              v-bind:rooms="rooms"
              v-bind:items="items"
            ></info-tab>
          </b-tab-item>

        </b-tabs>
      </div>
      <div id="game-outline">
        <div id="game-top-bar">
          <div
            v-if="showTopBar"
          >Room: {{ room }} | Year: {{ time.year }} | Day: {{ time.day }} | Hour: {{ time.hour }}</div>
        </div>
        <div id="phaser-game"></div>
        <console id="console" v-bind:messages="messages" v-bind:max="maxMsgs"></console>
      </div>
      <div id="game-rightbar" class="game-sidebar">
        <b-tabs v-model="activeRSideBarTab" type="is-boxed" position="is-centered">
          <b-tab-item label="Requests">
            <request-tab
              v-bind:trigger="trigger"
            ></request-tab>
          </b-tab-item>

          <b-tab-item label="Conversation">
            <convo-tab
              ref="convo"
              v-bind:trigger="trigger"
              v-bind:defaultActions="listOfActions"
              v-bind:agents="agents"
              v-bind:rooms="rooms"
              v-bind:items="items"
            ></convo-tab>
          </b-tab-item>

          <b-tab-item label="Trade">
            <trade-tab></trade-tab>
          </b-tab-item>
        </b-tabs>
      </div>
    </div>
    
  </div>
</template>

<script lang="ts">
import "buefy/dist/buefy.css";
import { ClientAPI, Agent, Room, Item } from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import requestTab from "./components/requestTab.vue";
import infoTab from "./components/infoTab.vue";
import itemTab from "./components/itemTab.vue";
import conversationTab from "./components/conversationTab.vue";
import tradeTab from "./components/tradeTab.vue";
import Console from "./components/console.vue";

@Component({
  components: {
    "request-tab": requestTab,
    "info-tab": infoTab,
    "item-tab": itemTab,
    "convo-tab": conversationTab,
    "trade-tab": tradeTab,
    console: Console
  }
})
export default class App extends Vue {
  trigger = 0;
  agents = [];
  rooms = [];
  items = [];
  @Watch("trigger")
  updateSeenLists() {
    this.agents = ClientAPI.seenAgents.map((v: Agent) => {
      return { name: v.agentName, id: v.id };
    });
    this.rooms = ClientAPI.seenRooms.map((v: Room) => {
      return { name: v.roomName, id: v.id };
    });
    this.items = ClientAPI.seenItems.map((v: Item) => {
      return { name: v.itemName, id: v.id };
    });
  }
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
  activeLSideBarTab = 0;
  activeRSideBarTab = 0;
  listOfActions = [];
  // Console data
  maxMsgs = 5;
  messages = [];
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

// Panoptyk Colors
$action: #073269;
$action-invert: findColorInvert($action);
$agent: #5b7a38;
$agent-invert: findColorInvert($action);

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: (
  "action": (
    $action,
    $action-invert
  ),
  "agent": (
    $agent,
    $agent-invert
  ),
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
$notification-padding: 0.25rem 0.25rem 0.5rem 0.5rem;

// Import Bulma and Buefy styles
// Latches changes made above
@import "~bulma";
@import "~buefy/src/scss/buefy";

span.action {
  color: $action;
  font-weight: bold;
}
span.agent {
  color: $agent;
  font-weight: bold;
}

body {
  width: 100%;
  text-align: center;
  background-color: black;
}
#app {
  width: 1600px;
  margin-left: auto;
  margin-right: auto;
  padding-top: 25px;
}
#game-top-row {
  width: inherit;
  height: auto;
  display: flex;
  align-items: stretch;
}
#game-top-bar {
  height: 30px;
  border: 0px;
  border-bottom: 2px;
  border-color: antiquewhite;
  border-style: solid;
  color: aliceblue;
}
#game-outline {
  margin-right: 5px;
  margin-left: 5px;
  border: 5px;
  border-color: antiquewhite;
  border-style: solid;
}
#phaser-game {
  display: inline-block;
}
#game-leftbar {
  margin-right: 5px;
}
#game-rightbar {
  margin-left: 5px;
}
.game-sidebar {
  width: 100%;
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
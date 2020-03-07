<template>
  <div id="app">
    <div id="game-top-row">
      <div id="game-leftbar" class="game-sidebar">
        <b-tabs
          v-model="activeLSideBarTab"
          type="is-boxed"
          position="is-centered"
        >
          <b-tab-item label="Inspect">
            <inspect-tab v-bind:trigger="trigger" v-bind:target="inspectTarget"></inspect-tab>
          </b-tab-item>

          <b-tab-item label="Items">
            <item-tab v-bind:trigger="trigger"></item-tab>
          </b-tab-item>

          <b-tab-item label="Info">
            <info-tab
              v-bind:trigger="trigger"
              v-bind:defaultActions="listOfActions"
              v-bind:agents="agents"
              v-bind:rooms="rooms"
              v-bind:items="items"
              v-bind:knowledge="knowledge"
            ></info-tab>
          </b-tab-item>

          <b-tab-item v-bind:label="'Quests [' + activeQuests + ']'">
            <quest-tab v-bind:trigger="trigger"></quest-tab>
          </b-tab-item>
        </b-tabs>
      </div>
      <div id="game-outline">
        <div id="game-top-bar">
          <div v-if="showTopBar"><span class="room">{{ room }}</span> | <span class="time">{{ dateString }}</span></div>
        </div>
        <div id="phaser-game"></div>
        <console
          id="console"
          v-bind:messages="messages"
          v-bind:max="maxMsgs"
        ></console>
      </div>
      <div id="game-rightbar" class="game-sidebar">
        <b-tabs
          v-model="activeRSideBarTab"
          type="is-boxed"
          position="is-centered"
        >
          <b-tab-item v-bind:label="'Requests [' + requestsTally + ']'">
            <request-tab v-bind:trigger="trigger"></request-tab>
          </b-tab-item>

          <b-tab-item label="Conversation">
            <convo-tab
              ref="convo"
              v-bind:trigger="trigger"
              v-bind:defaultActions="listOfActions"
              v-bind:agents="agents"
              v-bind:rooms="rooms"
              v-bind:items="items"
              v-bind:knowledge="knowledge"
            ></convo-tab>
          </b-tab-item>

          <b-tab-item label="Trade">
            <trade-tab
              v-bind:trigger="trigger"
              v-bind:items="items"
              v-bind:knowledge="knowledge"
            ></trade-tab>
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
import questTab from "./components/questTab.vue";
import inspectTab from "./components/inspectTab.vue";
import Console from "./components/console.vue";

@Component({
  components: {
    "request-tab": requestTab,
    "info-tab": infoTab,
    "item-tab": itemTab,
    "convo-tab": conversationTab,
    "trade-tab": tradeTab,
    "quest-tab": questTab,
    "inspect-tab": inspectTab,
    console: Console
  }
})
export default class App extends Vue {
  trigger = 0;
  agents = [];
  rooms = [];
  items = [];
  knowledge = [];
  assignedQuests = [];
  givenQuests = [];
  inspectTarget = 0;
  @Watch("trigger")
  updateLists() {
    this.agents = ClientAPI.seenAgents;
    this.rooms = ClientAPI.seenRooms;
    this.items = ClientAPI.seenItems;
    this.knowledge = ClientAPI.playerAgent.knowledge;
    this.assignedQuests = ClientAPI.playerAgent.activeAssignedQuests;
    this.activeQuests = this.assignedQuests.length;
    this.givenQuests = ClientAPI.playerAgent.activeGivenQuests;
  }

  // Tab logic
  activeQuests = 0;
  requestsTally = 0;


  // Top Bar logic
  showTopBar = false;
  room = "";
  time = 0;
  dateString = "";
  @Watch("room")
  @Watch("time")
  displayTopBar() {
    this.showTopBar = true;
    const date = new Date(this.time);
    this.dateString =
      date.getMonth() +
      "-" +
      date.getDate() +
      "-" +
      (date.getFullYear() - 1900) +
      " " +
      date.getHours() +
      ":" +
      date.getMinutes();
  }

  // Sidebar data
  activeLSideBarTab = 0;
  activeRSideBarTab = 0;
  listOfActions = [];

  // Console data
  maxMsgs = 6;
  messages = [];
}
</script>

<style lang="scss">
// Overall bulma edits
$text: rgb(243, 227, 193);
$scheme-main: #83796F;
$border-light: #DFD2B5;

// Import Bulma's core
@import "~bulma/sass/utilities/_all";

// Set your colors
$primary: #82232B;
$primary-invert: findColorInvert($primary);
$twitter: #4099ff;
$twitter-invert: findColorInvert($twitter);
$success: #DFD2B5;
$success-invert: findColorInvert($primary);
$danger: #82232B;
$danger-invert: findColorInvert($primary);

// Notification color edits
$notification-background-color: #83796F;

// Dropdown color edits
$dropdown-content-background-color: #83796F;
$dropdown-item-color: $text;

// Card color edits
$card-color: rgb(243, 227, 193);
$card-header-color: #25050E;
$card-background-color: $scheme-main;

// Panoptyk Colors
$action: #E1AD5B;
$action-invert: findColorInvert($action);
$agent: #62A1C3;
$agent-invert: findColorInvert($agent);
$room: #C79386;
$room-invert: findColorInvert($room);
$item: #7CC890;
$item-invert: findColorInvert($item);
$info: #64C87E;
$info-invert: findColorInvert($info);
$time: #F3EED9;
$time-invert: findColorInvert($time);
$faction: #CBB96D;
$faction-invert: findColorInvert($faction);

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
  "room": (
    $room,
    $room-invert
  ),
  "item": (
    $item,
    $item-invert
  ),
  "info": (
    $info,
    $info-invert
  ),
  "time": (
    $time,
    $time-invert
  ),
  "faction": (
    $faction,
    $faction-invert
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

// Notification element (used in console.vue)
$notification-padding: 0.25rem 0.25rem 0.5rem 0.5rem;

// Card(collapse) element (used in conversationTab.vue, tradeTab.vue)
$card-content-padding: 0.5rem;

span.select.is-small {
  font-size: 0.6rem;
}

button.button.is-small {
  font-size: 0.6rem;
}

input.is-small.input {
  font-size: 0.6rem;
}

// Import Bulma and Buefy styles
// Latches changes made above
@import "~bulma";
@import "~buefy/src/scss/buefy";

// Panoptyk UI variables
:root {
  --borders: #DFD2B5;
  --background: rgb(12, 8, 9);
  --item-border: #DFD2B5;
  --item-background: #83796F;
  --text-color-primary: rgb(243, 227, 193);
  --text-color-secondary: antiquewhite;
}

span.action {
  color: $action;
  font-weight: bold;
}
span.agent {
  color: $agent;
  font-weight: bold;
}
span.room {
  color: $room;
  font-weight: bold;
}
span.item {
  color: $item;
  font-weight: bold;
}
span.info {
  color: $info;
  font-weight: bold;
}
span.time {
  color: $time;
  font-weight: bold;
}
span.faction {
  color: $faction;
  font-weight: bold;
}

body {
  width: 100%;
  text-align: center;
  background-color: var(--background);
}
#app {
  width: 1900px;
  height: 960px;
  margin-left: auto;
  margin-right: auto;
  padding-top: 15px;
}
#game-top-row {
  width: inherit;
  height: inherit;
  max-height: 960px;
  display: flex;
  align-items: stretch;
}
#game-top-bar {
  height: 30px;
  border: 0px;
  border-bottom: 2px;
  border-color: var(--borders);
  border-style: solid;
  color: var(--text-color-primary);
}
#game-outline {
  margin-right: 5px;
  margin-left: 5px;
  border: 5px;
  border-color: var(--borders);
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
  border-color: var(--borders);
  border-style: solid;
}
.game-tab {
  color: var(--text-color-primary);
}
</style>

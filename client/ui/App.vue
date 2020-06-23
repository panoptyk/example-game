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
            <div class="topcorner">
              <b-tooltip
                label="This tab informs you about your character. It also displays information on any room, item, or other character you have left-clicked on."
                position="is-left"
                multilined
                :delay="200"
                ><b-icon icon="help-circle"></b-icon
              ></b-tooltip>
            </div>
            <inspect-tab
              v-bind:trigger="trigger"
              v-bind:target="inspectTarget"
              v-bind:rooms="rooms"
            ></inspect-tab>
          </b-tab-item>

          <b-tab-item label="Items">
            <div class="topcorner">
              <b-tooltip
                label="his tab displays the items you possess and their ID number."
                position="is-left"
                multilined
                :delay="200"
                ><b-icon icon="help-circle"></b-icon
              ></b-tooltip>
            </div>
            <item-tab v-bind:trigger="trigger"></item-tab>
          </b-tab-item>

          <b-tab-item label="Info">
            <div class="topcorner">
              <b-tooltip
                label="This tab shows all of the information you have observed/gathered. It is an important archive of all of the actions you and others have done. The list can be filterd according to the dropdown boxes."
                position="is-left"
                multilined
                :delay="200"
                ><b-icon icon="help-circle"></b-icon
              ></b-tooltip>
            </div>
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
            <div class="topcorner">
              <b-tooltip
                label="This tab displays active quests given to you by your guild leader."
                position="is-left"
                multilined
                :delay="200"
                ><b-icon icon="help-circle"></b-icon
              ></b-tooltip>
            </div>
            <quest-tab v-bind:trigger="trigger"></quest-tab>
          </b-tab-item>
        </b-tabs>
      </div>
      <div id="game-outline">
        <div id="game-top-bar">
          <div v-if="showTopBar">
            <span class="room">{{ room }}</span> |
            <span class="time">{{ dateString }}</span>
          </div>
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
            <div class="topcorner">
              <b-tooltip
                label="This tab displays any requests you have received to converse or trade with others."
                position="is-left"
                multilined
                :delay="200"
                ><b-icon icon="help-circle"></b-icon
              ></b-tooltip>
            </div>
            <request-tab v-bind:trigger="trigger"></request-tab>
          </b-tab-item>

          <b-tab-item label="Conversation">
            <div class="topcorner">
              <b-tooltip
                label="Once in a conversation, this tab will provide all the actions you can take while conversing. You may build and ask a question, tell information directly, see all previously asked questions, and turn in quests to you guild leader."
                position="is-left"
                multilined
                :delay="200"
                ><b-icon icon="help-circle"></b-icon
              ></b-tooltip>
            </div>
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
            <div class="topcorner">
              <b-tooltip
                label="Once in a trade, this tab will provide all the actions you can take while trading. You are able to offer/request gold, items, and answers to questions. Offers will be shown, and recieved requests can be passed on."
                position="is-left"
                multilined
                :delay="200"
                ><b-icon icon="help-circle"></b-icon
              ></b-tooltip>
            </div>
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
    console: Console,
  },
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
$scheme-main: #83796f;
$border-light: #dfd2b5;

// Import Bulma's core
@import "~bulma/sass/utilities/_all";

// Set your colors
$primary: #82232b;
$primary-invert: findColorInvert($primary);
$twitter: #4099ff;
$twitter-invert: findColorInvert($twitter);
$success: #dfd2b5;
$success-invert: findColorInvert($primary);
$danger: #82232b;
$danger-invert: findColorInvert($primary);

// Notification color edits
$notification-background-color: #83796f;

// Dropdown color edits
$dropdown-content-background-color: #83796f;
$dropdown-item-color: $text;

// Card color edits
$card-color: rgb(243, 227, 193);
$card-header-color: #25050e;
$card-background-color: $scheme-main;

// Panoptyk Colors
$action: #e1ad5b;
$action-invert: findColorInvert($action);
$agent: #62a1c3;
$agent-invert: findColorInvert($agent);
$room: #c79386;
$room-invert: findColorInvert($room);
$item: #7cc890;
$item-invert: findColorInvert($item);
$info: #64c87e;
$info-invert: findColorInvert($info);
$time: #f3eed9;
$time-invert: findColorInvert($time);
$faction: #cbb96d;
$faction-invert: findColorInvert($faction);

// Setup $colors to use as bulma classes (e.g. 'is-twitter')
$colors: (
  "action": (
    $action,
    $action-invert,
  ),
  "agent": (
    $agent,
    $agent-invert,
  ),
  "room": (
    $room,
    $room-invert,
  ),
  "item": (
    $item,
    $item-invert,
  ),
  "info": (
    $info,
    $info-invert,
  ),
  "time": (
    $time,
    $time-invert,
  ),
  "faction": (
    $faction,
    $faction-invert,
  ),
  "white": (
    $white,
    $black,
  ),
  "black": (
    $black,
    $white,
  ),
  "light": (
    $light,
    $light-invert,
  ),
  "dark": (
    $dark,
    $dark-invert,
  ),
  "primary": (
    $primary,
    $primary-invert,
  ),
  "success": (
    $success,
    $success-invert,
  ),
  "warning": (
    $warning,
    $warning-invert,
  ),
  "danger": (
    $danger,
    $danger-invert,
  ),
  "twitter": (
    $twitter,
    $twitter-invert,
  ),
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
  --borders: #dfd2b5;
  --background: rgb(12, 8, 9);
  --item-border: #dfd2b5;
  --item-background: #83796f;
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

.topcorner {
  position: absolute;
  top: 1px;
  right: 1px;
}
</style>

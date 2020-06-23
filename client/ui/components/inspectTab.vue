<template>
  <div id="inspect-tab" v-if="player">
    <div id="player-info">
      Character<br />
      Name: <span class="agent"> {{ player.agentName }} </span> <br />
      Faction: <span class="faction">{{ playerFaction }}</span> <br />
      Faction Level: <span class="faction">{{ playerFactionStatus.lvl }}</span> <br />
      Faction XP: <span class="faction">{{ playerFactionStatus.exp }}/{{ playerFactionStatus.toNextLevel }}</span> <br />
      Gold: <span class="gold"> {{ player.gold }} </span>
    </div>

    <span id="inspect-title"> Inspection Target </span>
    <div id="inspect-window" class="game-tab" v-if="isAgent">
      Agent: <span class="agent">{{ realTarget.agentName }}</span> <br />
      Faction: <span class="faction">{{ factionName }}</span>
      <div id="inspect-window" class="game-tab" v-if="isInPath">
        Location Tracking <br /><br />
        Select Room: 
        <b-field type="is-room">
          <b-select
            placeholder="-- loc --"
            size="is-small"
            v-model="selectedRoom"
            @input="onRoomChange"
          >
            <option disabled value>-- loc --</option>
            <option v-bind:value="undefined">none</option>
            <option v-for="val in rooms" v-bind:key="val.id" v-bind:value="val">{{
              val.roomName
            }}</option>
          </b-select>
        </b-field>
        <br />
        <template v-for="t in timeStrs">
          <div id="inspect-window" class="game-tab" v-bind:key="t">
          <template v-for="s in t">
            <span v-bind:key="s" v-if="isTime(s)" class="time"> {{ s }} </span>
            <span v-else v-bind:key="s"> {{ s }} </span>
          </template>
          </div>
        </template>
      </div>
    </div>

    <div id="inspect-window" class="game-tab" v-else-if="isDoor">
      Door to: <span class="room">{{ realTarget.roomName }}</span> <br />
    </div>

    <div id="inspect-window" class="game-tab" v-else-if="isCurRoom">
      Current room: <span class="room">{{ realTarget.roomName }}</span> <br />
    </div>

    <div id="inspect-window" class="game-tab" v-else-if="isItem">
      Item: <span class="item">{{ realTarget.itemName }}</span> <br />
      Type: {{ realTarget.type}} <br />
      Estimated Price: {{ itemPrices.getPrice(realTarget) }}
    </div>

    <div id="inspect-window" class="game-tab" v-else>
      no current inspection target, click on an agent or door
    </div>
  </div>
</template>

<script lang="ts">
import {
  ClientAPI,
  Agent,
  Room,
  Item,
  Info
} from "panoptyk-engine/dist/client";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

import { PathMap } from "../../../bots/john_bots/PathMap";
import { ItemPrices } from "../../../bots/john_bots/ItemPrices";

@Component({
  components: {}
})
export default class InspectTab extends Vue {
  @Prop({ default: 0 }) trigger: number;
  @Prop({ default: 0 }) target;
  @Prop({ default: [] }) rooms;
  // @Prop({ default: [] }) knowledge: Info[];
  realTarget: any = 0;
  player: Agent = 0 as any;
  playerFactionStatus: any = 0;
  itemPrices = ItemPrices.instance;

  @Watch("trigger")
  @Watch("target")
  update() {
    this.realTarget = this.target;
    this.itemPrices.setPrices();
    this.player = ClientAPI.playerAgent;
    if (this.player) {
      this.playerFactionStatus = this.player.factionStatus;
    }
  }

  times = [];
  timeStrs = [["No available information"]];

  selectedRoom;
  onRoomChange() {
    console.log("Searching: " + this.selectedRoom);
    this.times = [];
    this.timeStrs = [];
    if (this.selectedRoom !== undefined) {
      this.times = PathMap.instance.getTimesAtLocation(this.realTarget, this.selectedRoom);
      console.log(this.times);
    }
    for (let i = 0; i < this.times.length; i++) {
      let str1;
      if (this.times[i][0] > 0) {
        str1 = PathMap.dateToString(this.times[i][0]);
      } else {
        str1 = "???";
      }
      let str2;
      if (this.times[i][1] > 0) {
        str2 = PathMap.dateToString(this.times[i][1]);
        } else {
        str2 = "???";
      }
      const str = ["From ", str1, " until ", str2];
      this.timeStrs.push(str);
      console.log(str);
    }
    if (this.timeStrs.length === 0) {
      this.timeStrs.push(["No available information"]);
    }
  }

  // --- REALLY stupid way to do this
  isTime(string) {
    if (string === "From " || string === " until " || string === "No available information") {
      return false;
    }
    return true;
  }

  get playerFaction() {
    if (this.playerFactionStatus) {
      return this.playerFactionStatus.rankName + " " + this.playerFactionStatus.memberName;
    }
    return "no affiliation";
  }

  get factionName() {
    if (this.realTarget.faction) {
      return this.realTarget.faction.factionName;
    }
    return "no affiliation";
  }

  // Check type escapes to player
  get noTarget() {
    return this.realTarget;
  }
  get isAgent() {
    return this.realTarget instanceof Agent;
  }
  get isInPath() {
    return (this.isAgent && PathMap.instance.hasAgent(this.realTarget));
  }
  get isDoor() {
    return (
      this.realTarget instanceof Room &&
      ClientAPI.playerAgent.room.id !== this.realTarget.id
    );
  }
  get isCurRoom() {
    return (
      this.realTarget instanceof Room &&
      ClientAPI.playerAgent.room.id !== this.realTarget.id
    );
  }
  get isItem() {
    return this.realTarget instanceof Item;
  }
}
</script>

<style>
#inspect-tab {
  color: var(--text-color-primary);
}

#player-info {
  border: 2px;
  border-color: var(--borders);
  border-style: solid;
  margin-bottom: 5px;
  padding: 5px;
  text-align: left;
}

#inspect-title {
  font-weight: bold;
}

#inspect-window {
  border: 2px;
  border-color: var(--borders);
  border-style: solid;
  padding: 5px;
}
</style>

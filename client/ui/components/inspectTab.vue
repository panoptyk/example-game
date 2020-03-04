<template>
  <div id="inspect-tab" v-if="player">
    <div id="player-info">
      Character<br />
      Name: <span class="agent"> {{ player.agentName }} </span> <br />
      Faction: <span class="faction">{{ playerFaction }}</span> <br />
      Gold: <span class="gold"> {{ player.gold }} </span>
    </div>

    <span id="inspect-title"> Inspection Target </span>
    <div id="inspect-window" class="game-tab" v-if="isAgent">
      Agent: <span class="agent">{{ realTarget.agentName }}</span> <br />
      Faction: <span class="faction">{{ factionName }}</span>
    </div>

    <div id="inspect-window" class="game-tab" v-else-if="isDoor">
      Door to: <span class="room">{{ realTarget.roomName }}</span> <br />
    </div>

    <div id="inspect-window" class="game-tab" v-else-if="isCurRoom">
      Current room: <span class="room">{{ realTarget.roomName }}</span> <br />
    </div>

    <div id="inspect-window" class="game-tab" v-else-if="isItem">
      Item: <span class="item">{{ realTarget.itemName }}</span> <br />
      Type: {{ realTarget.type}}
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

@Component({
  components: {}
})
export default class InspectTab extends Vue {
  @Prop({ default: 0 }) trigger: number;
  @Prop({ default: 0 }) target;
  realTarget: any = 0;
  player: Agent = 0 as any;

  @Watch("trigger")
  @Watch("target")
  update() {
    this.realTarget = this.target;
    this.player = ClientAPI.playerAgent;
  }

  get playerFaction() {
    if (this.player.faction) {
      return this.player.faction.factionName;
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

<template>
  <div id="inspect-tab" v-if="player">
    <div id="player-info">
      Character<br />
      Name: <span class="agent"> {{ player.agentName }} </span> <br />
      Faction: <span class="faction">{{ playerFaction }}</span> <br />
      Rank: <span class="rank">{{ playerRank }}</span> <br />
      Gold: <span class="gold"> {{ player.gold }} </span>
    </div>

    <span id="inspect-title"> Inspection Target </span>
    <div id="inspect-window" class="game-tab" v-if="isAgent">
      Agent: <span class="agent">{{ realTarget.agentName }}</span> <br />
      Faction: <span class="faction">{{ factionName }}</span> <br />
      Rank: <span class="rank">{{ factionRank }}</span> <br />
    </div>

    <div id="inspect-window" class="game-tab" v-else-if="isDoor">
      Door to: <span class="room">{{ realTarget.roomName }}</span> <br />
      Room Tags: {{ roomTags }}
    </div>

    <div id="inspect-window" class="game-tab" v-else-if="isCurRoom">
      Current room: <span class="room">{{ realTarget.roomName }}</span> <br />
    </div>

    <div id="inspect-window" class="game-tab" v-else-if="isItem">
      Item: <span class="item">{{ realTarget.itemName }}</span> <br />
      Type: {{ realTarget.type }} <br />
      Item Tags: {{ itemTags }}
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
    return "No affiliation";
  }

  get playerRank() {
    if (this.player.faction) {
      return this.player.factionRank;
    }
    return "Not part of a faction";
  }

  get factionName() {
    if (this.realTarget.faction) {
      return this.realTarget.faction.factionName;
    }
    return "No affiliation";
  }

  get factionRank() {
    if (this.realTarget.faction) {
      return this.realTarget.factionRank;
    }
    return "Not part of a faction";
  }

  get itemTags() {
    if (this.realTarget instanceof Item && this.realTarget.itemTags.size > 0) {
      const tags = Array.from(this.realTarget.itemTags);
      let sentence = tags.pop();
      for (const tag in tags) {
        sentence += ", " + tag;
      }
      return sentence;
    }
    return "None";
  }

  get roomTags() {
    if (this.realTarget instanceof Room && this.realTarget.roomTags.size > 0) {
      const tags = Array.from(this.realTarget.roomTags);
      let sentence = tags.pop();
      for (const tag in tags) {
        sentence += ", " + tag;
      }
      return sentence;
    }
    return "None";
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

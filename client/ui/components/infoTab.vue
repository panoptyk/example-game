<template>
  <div id="info-tab" class="game-tab">
    <div class="container">
      Filters: 
      <b-field type="is-action">
        <b-select
          placeholder="-- action --"
          size="is-small"
          v-model="filterAction"
          @input="onFilterChange"
        >
          <option disabled value>-- action --</option>
          <option v-bind:value="'NONE'">NONE</option>
          <option v-for="act in filteredActions" v-bind:key="act" v-bind:value="act">{{ act }}</option>
        </b-select>
      </b-field>
      <b-field type="is-agent">
        <b-select
          placeholder="-- agent --"
          size="is-small"
          v-model="filterAgent"
          @input="onAgentChange"
        >
          <option disabled value>-- agent --</option>
          <option v-bind:value="0">none</option>
          <option
            v-for="val in filterAgents"
            v-bind:key="val.id"
            v-bind:value="val.id"
          >{{ val.name }}</option>
        </b-select>
      </b-field>
      <b-field type="is-room">
        <b-select
          placeholder="-- loc --"
          size="is-small"
          v-model="filterRoom"
          @input="onRoomChange"
        >
          <option disabled value>-- loc --</option>
          <option v-bind:value="0">none</option>
          <option v-for="val in rooms" v-bind:key="val.id" v-bind:value="val.id">{{ val.name }}</option>
        </b-select>
      </b-field>
      <b-field type="is-item">
        <b-select
          placeholder="-- item --"
          size="is-small"
          v-model="filterItem"
          @input="onItemChange"
        >
          <option disabled value>-- item --</option>
          <option v-bind:value="0">none</option>
          <option v-for="val in items" v-bind:key="val.id" v-bind:value="val.id">{{ val.name }}</option>
        </b-select>
      </b-field>
    </div>
    <template v-for="i of subsetInfo">
      <div class="info-box" v-bind:key="i.id">
        <div class="info-id">#{{ i.id }}</div>
        <div class="info-text">
          <info-entry v-bind:info="i.info"></info-entry>
        </div>
      </div>
    </template>
    <b-pagination
      :total="total"
      :current="curPage"
      :per-page="perPage"
      @change="onPageChange"
      aria-next-label="Next page"
      aria-previous-label="Previous page"
      aria-page-label="Page"
      aria-current-label="Current page"
    ></b-pagination>
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
import infoEntry from "./infoEntry.vue";

@Component({
  components: {
    "info-entry": infoEntry
  }
})
export default class InfoTab extends Vue {
  @Prop({ default: 0 }) trigger: number;
  @Prop({ default: [] }) defaultActions: string[];
  get filteredActions() {
    return this.defaultActions.slice(1);
  }
  @Prop({ default: [] }) agents;
  get filterAgents() {
    if (!ClientAPI.playerAgent) {
      return this.agents;
    }
    return this.agents.map(val => {
      return val.name === ClientAPI.playerAgent.agentName
        ? { name: "(you)", id: val.id }
        : val;
    });
  }
  @Prop({ default: [] }) items;
  @Prop({ default: [] }) rooms;

  info = [];
  subsetInfo = [];

  filterAction = "NONE";
  filterAgent;
  filterItem;
  filterRoom;

  total = 1;
  curPage = 1;
  perPage = 10;
  onPageChange(page) {
    this.curPage = page;
  }
  onFilterChange() {
    this.updateInfo();
  }
  onAgentChange() {
    this.filterRoom = 0;
    this.filterItem = 0;
    this.updateInfo();
  }
  onItemChange() {
    this.filterAgent = 0;
    this.filterRoom = 0;
    this.updateInfo();
  }
  onRoomChange() {
    this.filterAgent = 0;
    this.filterItem = 0;
    this.updateInfo();
  }

  @Watch("info")
  updateTotal() {
    this.total = this.info.length;
  }
  @Watch("trigger")
  updateInfo() {
    if (!ClientAPI.playerAgent) {
      this.info = [];
      return;
    }
    let filterInfo;
    const agent = this.filterAgent
      ? Agent.getByID(this.filterAgent)
      : undefined;
    const room = this.filterRoom ? Room.getByID(this.filterRoom) : undefined;
    const item = this.filterItem ? Item.getByID(this.filterItem) : undefined;

    if (agent) {
      filterInfo = ClientAPI.playerAgent.getInfoByAgent(agent);
    } else if (room) {
      filterInfo = ClientAPI.playerAgent.getInfoByLoc(room);
    } else if (item) {
      filterInfo = ClientAPI.playerAgent.getInfoByItem(item);
    } else if (this.filterAction !== "NONE") {
      filterInfo = ClientAPI.playerAgent.getInfoByAction(this.filterAction);
    } else {
      filterInfo = Array.from((ClientAPI.playerAgent as any)._knowledge);
      this.info = filterInfo;
      return;
    }
    if ((agent || room || item) && this.filterAction !== "NONE") {
      filterInfo = filterInfo.filter((val: Info) => {
        return val.action === this.filterAction;
      });
    }

    this.info = filterInfo ? filterInfo.map(i => i.id) : [];
  }
  @Watch("curPage")
  @Watch("total")
  portionOfInfo() {
    const start = (this.curPage - 1) * this.perPage;
    const end = Math.min(start + this.perPage, this.total);
    this.subsetInfo = this.info
      .sort((a, b) => {
        return b - a;
      })
      .slice(0)
      .splice(start, this.perPage)
      .map(this.processInfo);
  }
  processInfo(id) {
    const info = Info.getByID(id);
    if (!info) {
      return { id };
    }

    return {
      id,
      info: {
        id,
        action: info.action,
        terms: info.getTerms()
      }
    };
  }
}
</script>

<style>
.info-box {
  border: 2px;
  border-style: solid;
  border-color: antiquewhite;
  background-color: dimgrey;
  display: flex;
  margin-top: 5px;
  margin-bottom: 5px;
}
.info-id {
  flex: 0;
  text-align: left;
  padding-left: 10px;
  min-width: 100px;
}
.info-text {
  flex: 1;
}
</style>

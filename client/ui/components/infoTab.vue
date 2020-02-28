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
          <option
            v-for="act in filteredActions"
            v-bind:key="act"
            v-bind:value="act"
            >{{ act }}</option
          >
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
          <option v-bind:value="undefined">none</option>
          <option
            v-for="val in filterAgents"
            v-bind:key="val.model.id"
            v-bind:value="val.model"
            >{{ val.name }}</option
          >
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
          <option v-bind:value="undefined">none</option>
          <option v-for="val in rooms" v-bind:key="val.id" v-bind:value="val">{{
            val.roomName
          }}</option>
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
          <option v-bind:value="undefined">none</option>
          <option v-for="val in items" v-bind:key="val.id" v-bind:value="val">{{
            val.itemName
          }}</option>
        </b-select>
      </b-field>
    </div>
    <template v-for="i of subsetInfo">
      <div class="info-box" v-bind:key="i.id">
        <div class="info-id">#{{ i.id }}</div>
        <div class="info-text">
          <info-entry v-bind:info="i"></info-entry>
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
import InfoEntry from "./infoEntry.vue";

@Component({
  components: {
    "info-entry": InfoEntry
  }
})
export default class InfoTab extends Vue {
  @Prop({ default: 0 }) trigger: number;
  @Prop({ default: [] }) defaultActions: string[];
  @Prop({ default: [] }) agents;
  @Prop({ default: [] }) items;
  @Prop({ default: [] }) rooms;
  @Prop({ default: [] }) knowledge;
  get filteredActions() {
    // slices out the "???" used for conversationTab
    return this.defaultActions.slice(1);
  }
  get filterAgents() {
    if (!ClientAPI.playerAgent) {
      return this.agents;
    }
    return this.agents.map(a => {
      return a.agentName === ClientAPI.playerAgent.agentName
        ? { name: "(you)", model: a }
        : { name: a.agentName, model: a };
    });
  }

  // Page controls
  info = [];
  subsetInfo = [];

  total = 0;
  curPage = 1;
  perPage = 10;
  onPageChange(page) {
    this.curPage = page;
  }
  @Watch("info")
  updateTotal() {
    this.total = this.info.length;
  }
  @Watch("curPage")
  @Watch("total")
  portionOfInfo() {
    const start = (this.curPage - 1) * this.perPage;
    const end = Math.min(start + this.perPage, this.total);
    this.subsetInfo = this.info
      .sort((a: Info, b: Info) => {
        return b.id - a.id;
      })
      .slice(0)
      .slice(start, end);
  }

  // Filter controls
  filterAction = "NONE";
  filterAgent;
  filterItem;
  filterRoom;

  onFilterChange() {
    this.updateInfo();
  }
  onAgentChange() {
    this.filterRoom = undefined;
    this.filterItem = undefined;
    this.updateInfo();
  }
  onItemChange() {
    this.filterAgent = undefined;
    this.filterRoom = undefined;
    this.updateInfo();
  }
  onRoomChange() {
    this.filterAgent = undefined;
    this.filterItem = undefined;
    this.updateInfo();
  }

  @Watch("trigger")
  updateInfo() {
    if (!ClientAPI.playerAgent) {
      this.info = [];
      return;
    }
    let filterInfo;
    const agent = this.filterAgent ? this.filterAgent : undefined;
    const room = this.filterRoom ? this.filterRoom : undefined;
    const item = this.filterItem ? this.filterItem : undefined;

    if (agent) {
      filterInfo = ClientAPI.playerAgent.getInfoByAgent(agent);
    } else if (room) {
      filterInfo = ClientAPI.playerAgent.getInfoByLoc(room);
    } else if (item) {
      filterInfo = ClientAPI.playerAgent.getInfoByItem(item);
    } else if (this.filterAction !== "NONE") {
      filterInfo = ClientAPI.playerAgent.getInfoByAction(this.filterAction);
    } else {
      filterInfo = this.knowledge;
      this.info = filterInfo;
      return;
    }
    if ((agent || room || item) && this.filterAction !== "NONE") {
      filterInfo = filterInfo.filter((val: Info) => {
        return val.action === this.filterAction;
      });
    }

    this.info = filterInfo ? filterInfo : [];
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

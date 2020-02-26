<template>
  <div class="info-entry">
    <span v-for="b in sentence" v-bind:key="b.text" v-bind:class="b.type">
      {{ b.text }}
    </span>
  </div>
</template>

<script lang="ts">
import { Info } from "panoptyk-engine/dist/client";
import Sentence from "../../utils/sentence";
import { Component, Vue, Prop, Watch } from "vue-property-decorator";

@Component({})
export default class InfoEntry extends Vue {
  @Prop({ default: undefined }) info: Info;
  @Prop({ default: undefined }) query: any;
  @Prop({ default: false }) newFoundQuery;

  get sentence() {
    if (this.newFoundQuery) {
      // We are currently cheating the query info to be treated as fact
      return Sentence.fromInfo(this.spoofQuery(this.query));
    } else if (this.info instanceof Info) {
      return Sentence.fromInfo(this.info);
    }
    return [];
  }

  spoofQuery(queryTerms): any {
    const info = {
      isQuery() {
        return true;
      },
      getTerms: () => {
        return queryTerms;
      }
    };
    return info;
  }
}
</script>

<style></style>

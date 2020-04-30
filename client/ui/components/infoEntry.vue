<template>
  <div class="info-entry">
    <template v-for="b in sentence">
      <b-tooltip
        v-if="b.type === 'info'"
        v-bind:key="b.text"
        v-bind:label="sentenceStr(b.text)"
        position="is-top"
        multilined
        :delay="200"
      >
        <span v-bind:class="b.type">{{ b.text }}</span>
      </b-tooltip>
      <span v-bind:key="b.text" v-bind:class="b.type" v-else>{{ b.text }}</span>
    </template>
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

  sentenceStr(infoRef: string): string {
    const info = Info.getByID(parseInt(infoRef.split("#")[1], 10));
    const sentence = info ? Sentence.fromInfo(info) : [];
    const temp = sentence.reduce((a, b) => a + b.text, "");
    return temp;
  }

  spoofQuery(queryTerms): any {
    const info = {
      isQuery() {
        return true;
      },
      getTerms: () => {
        return queryTerms;
      },
    };
    return info;
  }
}
</script>

<style></style>

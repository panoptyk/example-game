<template>
  <div id="ui-overlay">
      <infoItem ref="infoItems"></infoItem>
  </div>
</template>

<script lang="ts">
import infoItem from "./components/infoItem.vue";

export default {
    components: { infoItem }
}
</script>

<style>
    #ui-overlay {
        position: absolute;
    }
</style>
<template>
  <div class="info-item-div">
      <div 
        v-for="info in infos" 
        v-bind:key="info"
        class="info-item"
        >{{ info.message }}</div>
  </div>
</template>

<script lang="ts">
export default {
    data () {
        return {
            infos: []
        }
    }
}
</script>
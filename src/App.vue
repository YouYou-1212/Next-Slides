<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { EventBus, EventTypes } from "./utils/EventBus";

</script>

<template>
  <!-- <NextEditor 
    v-model:controlPanelCollapsed="controlPanelCollapsed"
    :control-panel-data="controlPanelData"
    :show-control-panel="showControlPanel"
  /> -->
  <router-view v-slot="{ Component, route }">
    <component 
      :is="Component" 
    />
  </router-view>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>

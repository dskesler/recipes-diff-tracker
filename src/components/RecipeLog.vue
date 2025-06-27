<template>
  <div>
    <h2>Change Log</h2>
    <ul>
      <li v-for="log in logs" :key="log.timestamp">
        {{ log.timestamp }}: {{ JSON.stringify(log.diff) }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{ logs: any[] }>();
</script> 
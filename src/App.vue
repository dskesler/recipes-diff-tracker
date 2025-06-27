<script setup>
import { useRecipePoller } from '../src/RecipePoller';
import RecipeLog from './components/RecipeLog.vue';

const { logs, start, stop, email, password, polling, lastSuccess, error } = useRecipePoller(10000);
</script>

<template>
  <div>
    <h1>Recipe Monitor</h1>
    <div style="margin-bottom: 1em;">
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
    </div>
    <button @click="start" :disabled="!email || !password || polling">Start Polling</button>
    <button @click="stop">Stop Polling</button>
    <div v-if="polling" style="color: #0074D9; margin: 1em 0;">Polling in progress...</div>
    <div v-if="lastSuccess" style="color: #2ECC40; margin: 0.5em 0;">Last successful poll: {{ new Date(lastSuccess).toLocaleString() }}</div>
    <div v-if="error" style="color: #FF4136; margin: 0.5em 0;">Error: {{ error }}</div>
    <RecipeLog :logs="logs" />
  </div>
</template>

<style scoped>
button {
  margin-right: 10px;
  padding: 8px 16px;
  font-size: 16px;
}
input {
  margin-right: 10px;
  padding: 8px;
  font-size: 16px;
}
</style>

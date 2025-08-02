
<template>
  <div :class="$style['message-list']">
    <template v-for="message in list" :key="message.id">
      <MessageItem :message="message" />
    </template>
  </div>
</template>
<script setup>
import MessageItem from './MessageItem.vue'

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  }
})

</script>


<style lang="scss" module>
.message-list {
  flex: 1;
}
</style>
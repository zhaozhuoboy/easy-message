
<template>
  <div :class="$style['message-item']" :data-own="message.isOwn">
    <p :class="$style['user-name']">{{ message.user }}</p>
    <div :class="$style['content-wrap']">
      <div :class="$style['content']">
        {{ message.content }}
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  message: {
    type: Object,
    default: () => {}
  }
})
</script>


<style lang="scss" module>
.message-item {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 16px;

  &[data-own="true"] {
    align-items: flex-end;
    justify-content: flex-end;

    & .content {
      border-radius: 8px 0 8px 0;
    }
  }
}

.content-wrap {
  display: flex;
}

.content {
  max-width: 400px;
  padding: 10px;
  border-radius: 0 8px 0 8px;
  background: #e03810;
  color: #FFF;
}

.user-name {
  margin-bottom: 4px;
  line-height: 20px;
  font-size: 12px;
  color: grey;
}
</style>
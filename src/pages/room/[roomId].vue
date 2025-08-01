<template>
  <NuxtLayout :useHeader="false">
    <div :class="$style['page-room']">
      房间中
    </div>
  </NuxtLayout>
  
</template>

<script setup>
// import ajax from '@/utils/http';
import { serverFetch } from '@/utils/server.request'
const route = useRoute()

definePageMeta({
  layout: false,
})

// 设置 头部标签
useHead({
  title: `房间ID ${route.params.roomId} 聊天中`,
})
// 在服务器端 设置 seo 数据
if (import.meta.server) {
  useSeoMeta({
    ogTitle: () => `房间ID ${route.params.roomId} - ${roomInfo.value?.is_private ? '私密房间' : '公开房间'}`,
  })
}

const roomInfo = ref({})

const getRoomInfo = () => {
  serverFetch({
    url: '/api/room/find',
    method: 'post',
    data: {
      room_id: route.params.roomId
    }
  }).then(res => {
    console.log('room info', res)
    roomInfo.value = res
  })
}

getRoomInfo()
</script>

<style lang="scss" module>
.page-room {}
</style>

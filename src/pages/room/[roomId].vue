<template>
  <NuxtLayout :useHeader="false">
    <div :class="$style['room-info']">
      <div :class="$style['room-id']">
        房间ID <span>{{ roomInfo.roow_id || route.params.roomId }}</span>
      </div>
      <div :class="$style['expired-time']">
        过期时间 <span>- -</span>
      </div>
    </div>
    <NLayout :class="$style['room-layout']" has-sider sider-placement="right">
      <NLayoutContent :content-class="$style['message-content']" :native-scrollbar="false" content-style="padding: 20px;">
        <div :class="$style['message-list']">
          <MessageList :list="messageList" />
        </div>
        <div :class="$style['message-input']">
          <NInput
            v-model:value="inputValue"
            type="textarea"
            placeholder="请输入消息"
            :maxlength="2000"
            @keyup.enter="sendMessage"
          />
          <NButton type="primary" :disabled="!inputValue" @click="sendMessage">发送</NButton>
        </div>
      </NLayoutContent>
      <NLayoutSider
        collapse-mode="width"
        :collapsed-width="0"
        :width="240"
        :native-scrollbar="false"
        show-trigger="arrow-circle"
        content-style="padding: 20px;"
        bordered
      >
        <div :class="$style['user-list']">
          <template v-for="user in userList" :key="user.uid">
            <div>{{ user.username }}</div>
          </template>
        </div>
      </NLayoutSider>
    </NLayout>
  </NuxtLayout>
  
</template>

<script setup>
import { NLayout, NLayoutContent, NLayoutSider, NInput, NButton } from 'naive-ui'
import MessageList from './MessageList.vue'
import { getStorage, setStorage, guid } from '@/utils'
import { serverFetch } from '@/utils/server.request'
const route = useRoute()

definePageMeta({
  layout: false,
})

// 设置 头部标签
useHead({
  title: `房间ID ${route.params.roomId} 聊天中`,
})
let uid = ''
const userInfo = ref(null)
const userList = ref([])
const eventSource = ref(null)

// 在服务器端 设置 seo 数据
if (import.meta.server) {
  useSeoMeta({
    ogTitle: () => `房间ID ${route.params.roomId} - ${roomInfo.value?.is_private ? '私密房间' : '公开房间'}`,
  })
}

const roomInfo = ref({})
const inputValue = ref('')
const messageList = ref([{
  user: '善良的小熊',
  uid: userInfo.value?.uid,
  content: '我发送的消息',
  type: 'text'
},
{
  user: '可爱的小熊',
  uid: '12123124',
  content: '我发送的消息',
  type: 'text'
},{
  user: '愤怒的小熊',
  uid: '12123125',
  content: '我发送的消息',
  type: 'image'
}])


const sendMessage = () => {
  const postData = {
    user: userInfo.value.username,
    content: inputValue.value,
    uid: uid,
    isOwn: userInfo.value.uid === uid
  }

  console.log('message', postData)
  messageList.value.push(postData)
  inputValue.value = ''
}
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

const initUserList = () => {
  const currentUser = {
    username: route.query.user,
    uid: userInfo.value.uid
  }

  userList.value.push(currentUser);
}

const connectRoom = () => {
  const uid = userInfo.value.uid
  const roomId = route.params.roomId
  eventSource.value = new EventSource(`/api/sse/room?user=${route.query.user}&uid=${uid}&roomId=${roomId}`)

  eventSource.value.onmessage = (event) => {
    if (event.data) {
      const payload = JSON.parse(event.data)
      console.log('sse event', payload)
    }
  }
}

getRoomInfo()

onMounted(() => {
  if (!route.query.user) {
    console.log('没有用户名')
    return
  }
  uid = getStorage('easy_message_uid')
  if (!uid) {
    uid = guid()
    setStorage('easy_message_uid', uid)
  }
  // 保存用户信息
  userInfo.value = {
    username: route.query.user,
    uid: uid
  }

  initUserList()
  connectRoom()
})

onBeforeUnmount(() => {
  eventSource.value?.close()
})
</script>

<style lang="scss" module>

.room-info {
  box-sizing: border-box;
  padding: 20px;
  width: 100%;
  height: 100px;
  background-color: #f0f0f0;
}
.room-layout {
  height: calc(100vh - 100px);
}

.user-list {
  width: 192px;
  height: 100%;
}

.message-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.message-input {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 100px;

  &:before {
    content: '';
    position: absolute;
    top: 0; left: -20px; right: -20px;
    height: 1px;
    background: #f0f0f0;
  }
}

.room-id {
  line-height: 1;
  font-size: 24px;
  font-weight: 600;
}

.expired-time {
  margin-top: 12px;
  line-height: 1;
  font-size: 14px;
}
</style>

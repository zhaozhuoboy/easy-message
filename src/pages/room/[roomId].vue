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
          <h3 :class="$style['user-list-title']">在线用户 ({{ userList.length }})</h3>
          <div :class="$style['user-items']">
            <template v-for="user in userList" :key="user.uid">
              <div :class="$style['user-item']" :data-current="user.uid === uid">
                <div :class="$style['user-avatar']">{{ user.username.charAt(0) }}</div>
                <span :class="$style['user-name']">{{ user.username }}</span>
              </div>
            </template>
          </div>
        </div>
      </NLayoutSider>
    </NLayout>
  </NuxtLayout>
  
</template>

<script setup>
import { NLayout, NLayoutContent, NLayoutSider, NInput, NButton } from 'naive-ui'
import MessageList from './MessageList.vue'
import { guid, getRandomName } from '@/utils'
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
const messageList = ref([])


const sendMessage = async () => {
  if (!inputValue.value.trim()) return;
  
  const postData = {
    roomId: route.params.roomId,
    user: userInfo.value.username,
    content: inputValue.value,
    uid: uid,
    type: 'text'
  }

  try {
    const response = await $fetch('/api/room/message', {
      method: 'POST',
      body: postData
    });
    
    if (response.code === 0) {
      // 消息发送成功，添加到本地消息列表（不通过SSE接收自己的消息）
      messageList.value.push({
        ...response.data,
        isOwn: true
      });
      inputValue.value = '';
    } else {
      console.error('发送消息失败:', response.message);
    }
  } catch (error) {
    console.error('发送消息失败:', error);
  }
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
  // 用户列表将通过SSE事件更新，这里不需要手动添加
  userList.value = [];
}

const connectRoom = () => {
  const uid = userInfo.value.uid
  const username = userInfo.value.username
  const roomId = route.params.roomId
  eventSource.value = new EventSource(`/api/sse/room?user=${username}&uid=${uid}&roomId=${roomId}`)

  eventSource.value.onmessage = (event) => {
    if (event.data) {
      const payload = JSON.parse(event.data)
      console.log('sse event', payload)
      
      // 处理不同类型的SSE事件
      switch (payload.type) {
        case 'room:users:list':
          // 更新用户列表，当前用户排在第一位
          console.log('收到用户列表更新:', payload.data.users);
          const users = payload.data.users;
          // 将当前用户排在第一位
          const sortedUsers = users.sort((a, b) => {
            if (a.uid === uid) return -1; // 当前用户排在第一位
            if (b.uid === uid) return 1;
            return 0; // 其他用户保持原有顺序
          });
          userList.value = sortedUsers;
          break;
          
        case 'room:user:enter':
          // 用户进入通知
          console.log(`${payload.data.user} 进入了聊天室`);
          // 用户进入时，用户列表会通过 room:users:list 事件更新
          // 这里可以添加一些UI提示，比如显示"xxx进入了聊天室"
          break;
          
        case 'room:user:leave':
          // 用户离开通知
          console.log(`${payload.data.user} 离开了聊天室`);
          // 用户离开时，用户列表会通过 room:users:list 事件更新，这里不需要手动移除
          break;
          
        case 'room:message':
          // 接收新消息（只接收其他用户的消息，自己的消息通过sendMessage直接添加）
          if (payload.data.uid !== uid) {
            messageList.value.push({
              ...payload.data,
              isOwn: false
            });
          }
          break;
      }
    }
  }

  eventSource.value.onerror = (error) => {
    console.error('SSE连接错误:', error);
  }
}

getRoomInfo()

onMounted(() => {
  // 为每个标签页生成唯一的用户ID，避免多标签页冲突
  uid = guid()
  console.log('当前用户ID:', uid)
  
  // 获取或生成用户名
  let username = route.query.user
  if (!username) {
    // 如果没有用户名，使用getRandomName生成一个
    username = getRandomName()
    console.log('自动生成用户名:', username)
  }
  
  // 保存用户信息
  userInfo.value = {
    username: username,
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
  display: flex;
  flex-direction: column;
}

.user-list-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.user-items {
  flex: 1;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: #f5f5f5;
  transition: all 0.2s ease;

  &[data-current="true"] {
    background: #e6f7ff;
    border: 1px solid #91d5ff;
  }

  &:hover {
    background: #e6f7ff;
  }
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 8px;
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

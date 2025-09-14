<template>
  <NuxtLayout :useHeader="false">
    <div :class="$style['room-info']">
      <div :class="$style['room-id']">
        房间ID <span>{{ roomInfo.roow_id || route.params.roomId }}</span>
      </div>
      <div :class="$style['expired-time']">
        过期时间 <span>- -</span>
      </div>
    <!-- 重连状态提示 - 固定在页面顶部 -->
    <div v-if="isReconnecting" :class="$style['reconnect-overlay']">
      <div :class="$style['reconnect-status']">
        <div :class="$style['reconnect-indicator']">
          <div :class="$style['loading-spinner']"></div>
          <span>正在尝试重连... ({{ reconnectAttempts }}/{{ maxReconnectAttempts }})</span>
        </div>
      </div>
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

// 重连相关状态
const isReconnecting = ref(false)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const reconnectInterval = ref(3000) // 3秒
const heartbeatInterval = ref(null)
const lastHeartbeat = ref(Date.now())

// 标签页标题闪烁相关状态
const originalTitle = ref('')
const titleBlinkInterval = ref(null)
const isPageVisible = ref(true)

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

// 心跳检测
const startHeartbeat = () => {
  heartbeatInterval.value = setInterval(() => {
    const now = Date.now()
    const timeSinceLastHeartbeat = now - lastHeartbeat.value
    
    // 如果超过60秒没有收到任何消息，认为连接断开
    if (timeSinceLastHeartbeat > 60000) {
      console.log('心跳超时，尝试重连')
      handleReconnect()
    }
  }, 10000) // 每10秒检查一次
}

// 停止心跳检测
const stopHeartbeat = () => {
  if (heartbeatInterval.value) {
    clearInterval(heartbeatInterval.value)
    heartbeatInterval.value = null
  }
}

// 处理重连
const handleReconnect = () => {
  if (isReconnecting.value || reconnectAttempts.value >= maxReconnectAttempts) {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.log('已达到最大重连次数，停止重连')
    }
    return
  }
  
  // 检查连接状态，如果连接正常则不重连
  if (eventSource.value && eventSource.value.readyState === EventSource.OPEN) {
    console.log('连接状态正常，取消重连')
    return
  }
  
  isReconnecting.value = true
  reconnectAttempts.value++
  
  console.log(`尝试重连 (${reconnectAttempts.value}/${maxReconnectAttempts})`)
  
  // 关闭当前连接
  if (eventSource.value) {
    eventSource.value.close()
  }
  
  // 延迟重连
  setTimeout(() => {
    connectRoom()
  }, reconnectInterval.value)
}

// 重置重连状态
const resetReconnectState = () => {
  isReconnecting.value = false
  reconnectAttempts.value = 0
  lastHeartbeat.value = Date.now()
}

// 开始标题闪烁
const startTitleBlink = () => {
  if (titleBlinkInterval.value || isPageVisible.value) {
    return
  }
  
  let isBlinking = false
  titleBlinkInterval.value = setInterval(() => {
    if (isPageVisible.value) {
      stopTitleBlink()
      return
    }
    
    document.title = isBlinking ? originalTitle.value : '你有新消息'
    isBlinking = !isBlinking
  }, 100) // 每300毫秒闪烁一次
}

// 停止标题闪烁
const stopTitleBlink = () => {
  if (titleBlinkInterval.value) {
    clearInterval(titleBlinkInterval.value)
    titleBlinkInterval.value = null
  }
  document.title = originalTitle.value
}

// 处理页面可见性变化
const handleVisibilityChange = () => {
  isPageVisible.value = !document.hidden
  
  if (isPageVisible.value) {
    // 页面变为可见时，停止闪烁并恢复标题
    stopTitleBlink()
  }
}

const connectRoom = () => {
  const uid = userInfo.value.uid
  const username = userInfo.value.username
  const roomId = route.params.roomId
  
  try {
    eventSource.value = new EventSource(`/api/sse/room?user=${username}&uid=${uid}&roomId=${roomId}`)

    eventSource.value.onopen = () => {
      console.log('SSE连接已建立')
      resetReconnectState()
      startHeartbeat()
    }

    eventSource.value.onmessage = (event) => {
      if (event.data) {
        // 任何消息都更新心跳时间
        lastHeartbeat.value = Date.now()
        
        const payload = JSON.parse(event.data)
        console.log('sse event', payload)
        
        // 处理不同类型的SSE事件
        switch (payload.type) {
          case 'heartbeat':
            // 心跳消息，静默处理
            console.log('收到心跳消息')
            break;
            
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
              
              // 如果页面不可见，开始标题闪烁
              if (!isPageVisible.value) {
                startTitleBlink()
              }
            }
            break;
        }
      }
    }

    eventSource.value.onerror = (error) => {
      console.error('SSE连接错误:', error);
      stopHeartbeat()
      
      // 只有在连接确实断开时才重连
      if (eventSource.value.readyState === EventSource.CLOSED) {
        handleReconnect()
      }
    }
  } catch (error) {
    console.error('创建SSE连接失败:', error)
    handleReconnect()
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

  // 保存原始标题
  originalTitle.value = document.title
  
  // 添加页面可见性监听
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 初始化页面可见性状态
  isPageVisible.value = !document.hidden

  initUserList()
  connectRoom()
})

onBeforeUnmount(() => {
  stopHeartbeat()
  stopTitleBlink()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
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

.reconnect-overlay {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.reconnect-status {
  padding: 12px 20px;
  background: rgba(255, 243, 205, 0.95);
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: pulse 1.5s ease-in-out infinite;
  backdrop-filter: blur(10px);
}

.reconnect-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #856404;
  font-weight: 500;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(133, 100, 4, 0.2);
  border-top: 2px solid #856404;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.8; 
    transform: scale(1.02);
  }
}
</style>

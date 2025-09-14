<template>
  <div :class="$style['room-error']">
    <div :class="$style['error-content']">
      <div :class="$style['error-icon']">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2 :class="$style['error-title']">{{ title }}</h2>
      <p :class="$style['error-message']">{{ message }}</p>
      <div :class="$style['error-actions']">
        <NButton type="primary" @click="handleGoHome">返回首页</NButton>
        <NButton @click="handleRetry">重新加载</NButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { NButton } from 'naive-ui'

// 定义组件属性
const props = defineProps({
  title: {
    type: String,
    default: '房间不存在或已被删除'
  },
  message: {
    type: String,
    default: ''
  }
})

// 定义事件
const emit = defineEmits(['goHome', 'retry'])

// 处理返回首页
const handleGoHome = () => {
  emit('goHome')
}

// 处理重新加载
const handleRetry = () => {
  emit('retry')
}
</script>

<style lang="scss" module>
/* 房间错误样式 */
.room-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  padding: 20px;
}

.error-content {
  text-align: center;
  padding: 60px 40px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  max-width: 500px;
  width: 100%;
}

.error-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 30px;
  color: #ff6b6b;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff5f5;
  border-radius: 50%;
  border: 2px solid #ffe0e0;
}

.error-icon svg {
  width: 40px;
  height: 40px;
}

.error-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.error-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 40px 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-actions .n-button {
  min-width: 120px;
  height: 44px;
  font-weight: 600;
  border-radius: 12px;
}

.error-actions .n-button[type="primary"] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.error-actions .n-button[type="primary"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.error-actions .n-button:not([type="primary"]) {
  background: white;
  border: 2px solid #e1e5e9;
  color: #666;
}

.error-actions .n-button:not([type="primary"]):hover {
  background: #f8f9fa;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-content {
    padding: 40px 20px;
    margin: 20px;
  }
  
  .error-title {
    font-size: 20px;
  }
  
  .error-message {
    font-size: 14px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .n-button {
    width: 100%;
    max-width: 200px;
  }
}
</style>

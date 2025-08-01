<template>
  <div :class="$style['page-index']">
    <div :class="$style['content']">
      <NCard title="创建房间" hoverable>
        <template #header-extra>
          加密 🔐&nbsp;<NSwitch :round="false" v-model:value="isPrivate" />
        </template>
        <div :class="$style['private']" v-if="isPrivate">
          <p>房间密码</p>
          <NInput placeholder="请输入房间密码" />
        </div>

        <div :class="$style['action']">
          <NButton size="large" type="success" block :loading="state.createLock" :disabled="state.createLock" @click="handleCreateRoom">
            {{ state.createLock ? '创建中...' : '立即创建' }}
          </NButton>
        </div>
      </NCard>
    </div>
  </div>
</template>

<script>
import { NCard, NSwitch, NInput, NButton } from 'naive-ui'
export default {
  name: 'page-index',
  components: {
    NCard,
    NInput,
    NSwitch,
    NButton
  },
  setup () {
    useSeoMeta({
      title: '首页',
    })

    const isPrivate = ref(false)
    const state = reactive({
      isPrivate: false,
      password: '',
      createLock: false,
    })

    const handleCreateRoom = () => {
      state.createLock = true

      setTimeout(() => {
        state.createLock = false
      }, 1000)
    }

    return {
      state,
      isPrivate,
      handleCreateRoom
    }
  }
}
</script>

<style lang="scss" module>
.page-index {
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  padding: 50px;
}

.logo {
  width: 600px; height: fit-content;

  & img {
    width: 100%; height: auto;
  }
}

.content {
  @apply w-96 mt-8 pb-8;
}

.private {
  @apply flex flex-col gap-3 mb-4;
}

.action {
}
</style>

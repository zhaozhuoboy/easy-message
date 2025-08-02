<template>
  <div :class="$style['page-index']">
    <div :class="$style['content']">
      <NCard title="创建房间" hoverable>
        <template #header-extra>
          加密 🔐&nbsp;<NSwitch :round="false" v-model:value="isPrivate" />
        </template>
        <div :class="$style['private']" v-if="isPrivate">
          <p>房间密码</p>
          <NInput type="password" placeholder="请输入房间密码" v-model:value="state.password" />
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
import { NCard, NSwitch, NInput, NButton, useMessage } from 'naive-ui'
import { getRandomName } from '@/utils'
import { createRoom } from '@/service/room.service'
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

    const router = useRouter()
    const message = useMessage()
    const isPrivate = ref(false)
    const state = reactive({
      isPrivate: false,
      password: '',
      createLock: false,
    })

    const handleCreateRoom = async () => {
      state.createLock = true
      // 创建房间
      const name = getRandomName()
      console.log(name)
      // 创建房间
      createRoom({
        password: state.password,
      }).then(res => {
        console.log(res)
        setTimeout(() => {
          state.createLock = false
          message.success('创建成功')
          // 跳转房间
          router.push({
            path: `/room/${res.room_id}`,
            query: {
              user: name
            }
          })
        }, 500)
      }).catch(err => {
        message.error(err.message)
      })
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

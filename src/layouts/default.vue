<template>
  <NLayout
    :class="$style['layout']"
    :native-scrollbar="false"
    :content-class="$style['layout-content']"
  >
    <NLayoutHeader v-if="useHeader" :class="$style['layout-header']">
      <Header />
    </NLayoutHeader>
    <NLayoutContent>
      <div layout-inner :class="$style['inner']">
        <slot />
      </div>
    </NLayoutContent>
    <NLayoutFooter :class="$style['layout-footer']">
      <Footer />
    </NLayoutFooter>
  </NLayout>
</template>

<script>
import { NLayout, NLayoutContent, NLayoutHeader, NLayoutFooter } from 'naive-ui'
import Header from '../components/common/header/Index.vue'
import Footer from '../components/common/footer/Footer.vue'
export default {
  name: 'layout',
  props: {
    useHeader: {
      type: Boolean,
      default: true
    }
  },
  components: {
    NLayout,
    NLayoutContent,
    NLayoutHeader,
    NLayoutFooter,
    Header,
    Footer
  },
  setup (props) {
    console.log('layout props', props)
  }
}
</script>

<style lang="scss" module>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.layout-content {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.layout-header, .layout-footer {
  flex-shrink: 0;
}

.layout-header {
  position: sticky; top: 0; z-index: 100;
}

.page-content {
  // flex: 1;
}

.inner {
  max-width: 1200px;
  min-height: 100vh;
  margin: auto;
}

.layout-footer {
  min-height: 100px;
  @extend %center;
}
</style>

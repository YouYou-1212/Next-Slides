<!-- 属性面板 -->
<template>
  <div class="control-panel" :class="{ 'panel-collapsed': collapsed }">
    <div class="panel-content">
      <div class="panel-header">
        <h3>{{ panelTitle }}</h3>
        <!-- 关闭按钮 -->
        <button class="close-button" @click="closePanel">
          <span class="close-icon">×</span>
        </button>
      </div>
      <div class="panel-body">
        <!-- 动态加载组件 -->
        <component :is="currentComponent" v-if="currentComponent" :canvas="canvasData.canvas"
          :target="canvasData.target" :position="canvasData.position" :canvasManager="canvasData.canvasManager"></component>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch , computed } from 'vue';
import { EventTypes } from '../../utils/EventBus';
import BackgroundImageSelector from '../../components/controls/BackgroundImageSelector.vue';
import BackgroundColorSelector from '../../components/controls/BackgroundColorSelector.vue';
import InsertImageSelector from '../../components/controls/InsertImageSelector.vue';

const props = defineProps<{
  collapsed: boolean,
  panelData: any
}>();

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
}>();

const currentComponent = shallowRef<any>(null);
const panelType = ref<string>('');
const canvasData = ref<any>({
  canvas: null,
  target: null,
  position: null
});

// 监听 panelData 变化
watch(() => props.panelData, (newData) => {
  if (newData) {
    panelType.value = newData.type;
    canvasData.value = {
      canvas: newData.canvas,
      target: newData.target,
      position: newData.position,
      canvasManager: newData.canvasManager
    };

    // 根据类型加载不同组件
    if (newData.type === EventTypes.PANEL_TYPE.BACKGROUND_IMAGE) {
      currentComponent.value = BackgroundImageSelector;
    } else if (newData.type === EventTypes.PANEL_TYPE.BACKGROUND_COLOR) {
      currentComponent.value = BackgroundColorSelector;
    } else if (newData.type === EventTypes.PANEL_TYPE.INSERT_IMAGE) {
      currentComponent.value = InsertImageSelector;
    }
  }
}, { immediate: true });


// 添加关闭面板方法 - 通过修改折叠状态来隐藏面板
const closePanel = () => {
  emit('update:collapsed', true);
};

// 根据面板类型计算标题
const panelTitle = computed(() => {
  switch (panelType.value) {
    case 'background-image':
      return '更换背景图片';
    case 'background-color':
      return '更换背景颜色';
    case 'insert-image':
      return '插入图片';
    default:
      return '扩展面板';
  }
});

</script>

<style scoped>
.control-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: min(300px, 30%);
  pointer-events: auto;
  transition: transform 0.3s ease;
  z-index: 100;
}

.panel-collapsed {
  transform: translateX(100%);
}

.panel-content {
  height: 100vh;
  background-color: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 修改为两端对齐 */
  border-bottom: 1px solid #e8e8e8;
  background-color: #fff;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #fff;
}

/* 添加关闭按钮样式 */
.close-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border-radius: 50%;
  padding: 0;
}

.close-button:hover {
  background-color: #f0f0f0;
  color: #333;
}

.close-icon {
  line-height: 1;
}
</style>

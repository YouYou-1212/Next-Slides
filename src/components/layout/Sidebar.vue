<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onBeforeMount,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";
import { CanvasManager } from "../../composables/canvas/CanvasManager";
import { COLORS } from "../../constants/theme";
import { EventBus, EventTypes } from "../../utils/EventBus";
import { ThumbnailManager } from "../../composables/slides/ThumbnailManager";
import { PageFrame } from "../../composables/slides/PageFrame";
import { Frame } from "../../composables/slides/Frame";

const props = defineProps<{
  collapsed: boolean;
  canvasManager: CanvasManager | null;
}>();

const emit = defineEmits<{
  (e: "update:collapsed", value: boolean): void;
}>();

const showCollapseButton = ref(false);
const frames = ref<any[]>([]);

const dropdownVisible = ref(false);

const overviewContainer = ref<HTMLElement | null>(null);
const frameContainers = ref<Record<string, HTMLElement | null>>({});

const thumbnailManager = ref<ThumbnailManager | null>(null);


const loadFrames = () => {
  if (!props.canvasManager) {
    frames.value = [];
    return;
  }
  const framesList = props.canvasManager.getAllSlides() || [];
  frames.value = framesList;
};


const initThumbnailManager = () => {
  if (props.canvasManager) {
    
    thumbnailManager.value = new ThumbnailManager(
      props.canvasManager,
      frames,
      () => {
        
      },
      () => {
        
      },
      () => {
        
        
        loadFrames();
      }
    );
  }
};


const toggleCollapse = () => {
  emit("update:collapsed", !props.collapsed);
};


const overview = computed(() => {
  return props.canvasManager?.getPageFrame();
});


const canAddFrame = computed(() => {
  return overview.value != null;
});


const handleAddFrame = () => {
  props.canvasManager?.addNewFrame();
  dropdownVisible.value = false; 
};


const handleDrawFrame = () => {
  props.canvasManager?.addNewFrame();
  dropdownVisible.value = false;
};

const navigateToFrame = (frame: any) => {
  if (!props.canvasManager) return;
  props.canvasManager.navigateToFrame(frame);
};


const toggleDropdown = (event: Event) => {
  event.stopPropagation(); 
  dropdownVisible.value = !dropdownVisible.value;
};



const closeDropdown = () => {
  dropdownVisible.value = false;
};


const handleOverviewContainerRef = (el: any, frameId: string) => {
  overviewContainer.value = el;
  !thumbnailManager.value?.initThumbnailCanvas(PageFrame.type, frameId, el);
};


const handleFrameContainerRef = (el: any, frameId: string) => {
  frameContainers.value[frameId] = el;
  !thumbnailManager.value?.initThumbnailCanvas(Frame.type, frameId, el);
};


const handlePageOverviewClick = (frame: any) => {
  navigateToFrame(frame);
};


const handleFrameClick = (frame: any) => {
  navigateToFrame(frame);
};


watch(
  () => props.canvasManager,
  (newCanvasManager) => {
    
    if (!thumbnailManager.value) {
      
      initThumbnailManager();
    } else {
      
      thumbnailManager.value.setCanvasManager(newCanvasManager);
    }
  },
  { immediate: true }
);


onMounted(() => {
  loadFrames();
  document.addEventListener("click", closeDropdown);
});


onUnmounted(() => {
  
  !thumbnailManager.value?.dispose();

  
  document.removeEventListener("click", closeDropdown);
});
</script>

<template>
  <div class="sidebar" :class="{ 'sidebar-collapsed': collapsed }" @mouseenter="showCollapseButton = true"
    @mouseleave="showCollapseButton = false">
    <div class="sidebar-content">
      <div class="sidebar-body">
        <!-- Frame 操作区域 -->
        <div class="operation-group">
          <div class="add-frame-container">
            <el-button type="primary" @click="handleAddFrame" :disabled="!canAddFrame"
              :style="{ backgroundColor: COLORS.PRIMARY }" class="add-frame-button">
              <div class="button-content">
                <span><svg class="plus-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>Add frame</span>
              </div>
            </el-button>
          </div>

          <!-- 下拉菜单 -->
          <div class="dropdown-menu" v-if="dropdownVisible">
            <div class="dropdown-item" @click="handleDrawFrame">
              <svg class="draw-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 6.34l-3.75-3.75-2.53 2.54 3.75 3.75 2.53-2.54z"
                  fill="currentColor" />
              </svg>
              绘制Frame
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="frames-list-container">
          <!-- 帧列表 -->
          <div class="frames-list">
            <!-- 使用统一的遍历方式处理所有帧，包括概览 -->
            <div v-for="(frame, index) in frames" :key="frame.id" v-memo="[frame.id]" class="frame-item"
              :class="{ overview: index === 0 }" @click="
                index === 0
                  ? handlePageOverviewClick(frame)
                  : handleFrameClick(frame)
                ">
              <!-- 只有非概览帧显示序号 -->
              <div class="frame-number" v-if="index > 0">{{ index }}</div>
              <div class="frame-thumbnail">
                <div :ref="(el) =>
                    index === 0
                      ? handleOverviewContainerRef(el, frame.id)
                      : handleFrameContainerRef(el, frame.id)
                  " class="canvas-container" :data-frame-id="frame.id"></div>
              </div>
              <div class="frame-title">
                {{ index === 0 ? "概览" : `页面 ${index}` }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 折叠按钮 -->
    <div class="collapse-button" :class="{ show: showCollapseButton || collapsed }" @click="toggleCollapse">
      <span class="arrow">{{ collapsed ? "›" : "‹" }}</span>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: min(265px, 30%);
  pointer-events: auto;
  transition: transform 0.3s ease;
  z-index: 100;
}

.sidebar-collapsed {
  transform: translateX(-100%);
}

.sidebar-content {
  height: 100vh;
  background-color: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  background-color: #fff;
}

.sidebar-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  padding: 16px;
  background-color: #fff;
}


.frames-list-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}


.operation-group {
  width: 100%;
  margin: 0 auto 0px;
  position: relative;
}

.add-frame-container {
  display: flex;
  width: 100%;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
}


.dropdown-container {
  position: relative;
  border-radius: 20px;
  
  display: flex;
  width: 100%;
  max-width: 200px;
  margin: 0 auto;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}


.add-frame-button {
  flex: 1;
  height: 36px;
  margin: 0;
  padding: 0 16px;
  border: none;
  border-radius: 0;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  background-color: v-bind("COLORS.PRIMARY") !important;
  
  justify-content: flex-start;
}


.add-frame-button :deep(.el-icon) {
  color: inherit;
  
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-frame-button :deep(.el-button__content) {
  width: 100%;
  display: flex;
  justify-content: center;
}

.dropdown-button {
  width: 36px;
  height: 36px;
  background-color: v-bind("COLORS.PRIMARY");
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}


.arrow-down-icon {
  width: 16px;
  height: 16px;
  color: #ffffff;
  stroke: currentColor;
  stroke-width: 2;
}

.add-frame-button span {
  flex: 1;
  text-align: center;
  display: flex;
  align-items: center;
  
  justify-content: center;
  color: white;
}

.add-frame-button:hover,
.add-frame-button:focus {
  background-color: #3c68eb !important;
}


.dropdown-trigger {
  width: 32px;
  background-color: v-bind("COLORS.PRIMARY");
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}


.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: auto;
  right: 0;
  width: 140px;
  background-color: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}


.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 14px;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}


.draw-icon {
  width: 16px;
  height: 16px;
  color: #666;
}


.plus-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
  margin-right: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  stroke: currentColor;
  stroke-width: 2;
}


.arrow-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dropdown-icon {
  font-size: 14px;
}

.operation-group .el-button {
  width: 100%;
}

.divider {
  height: 1px;
  background-color: #e8e8e8;
  margin: 16px 0;
}

.element-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.element-item {
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.element-item:hover {
  background-color: #e6f7ff;
}

.collapse-button {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  background-color: #fff;
  box-shadow: 3px 0 8px rgba(0, 0, 0, 0.15);
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: auto;
  z-index: 101;
}

.collapse-button.show {
  opacity: 1;
}

.arrow {
  font-size: 18px;
  line-height: 1;
  color: #666;
}

.sidebar-content {
  position: relative;
  z-index: 100;
}


.el-icon {
  vertical-align: middle;
  margin-right: 4px;
}


.el-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}


.frame-operation {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.add-frame-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 10px;
}

.dropdown-icon {
  margin-left: auto;
}


.frames-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
  padding-right: 5px;
  padding-bottom: 50px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.frame-item {
  position: relative;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  min-height: auto;
  flex-shrink: 0;
}

.frame-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.frame-number {
  position: absolute;
  top: 5px;
  left: 5px;
  width: 20px;
  height: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-container canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}

.frame-thumbnail {
  width: 100%;
  height: 126px;
  min-height: 126px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}


.placeholder-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  background-color: #f0f0f0;
}

.frame-title {
  padding: 0px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  background-color: #fafafa;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.frame-action {
  padding: 5px;
  font-size: 12px;
  color: #666;
  text-align: center;
  background-color: #f5f5f5;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overview {
  border-left: 3px solid #1890ff;
}


.sidebar-content {
  position: relative;
  z-index: 100;
}


.el-icon {
  vertical-align: middle;
}


.frames-list::-webkit-scrollbar {
  width: 6px;
}

.frames-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.frames-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.frames-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>

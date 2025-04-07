<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="logo">Next Slides</div>
    </div>
    <div class="toolbar-center">
      <div class="tool-item" v-for="tool in tools" :key="tool.id">
        <button class="tool-btn" @click="tool.action">
          {{ tool.name }}
        </button>

        <!-- 形状选择下拉框 -->
        <div v-if="tool.id === 4" class="shape-dropdown" v-show="showShapeDropdown"
          @mouseleave="showShapeDropdown = false">
          <div v-for="shape in shapes" :key="shape.type" class="shape-item"
            @click="addShape(shape.type, shape.options)">
            {{ shape.name }}
          </div>
        </div>
      </div>
      <!-- 隐藏的文件输入框 -->
      <input type="file" ref="fileInput" accept=".jpg,.jpeg,.png" style="display: none" @change="handleImageSelect" />
    </div>
    <div class="toolbar-right">
      <button class="test-page-btn" @click="openTestPage">测试页面</button>
      <!-- <button class="frame-selector-btn" @click="toggleFrameList">
        帧列表
      </button> -->
      <!-- 添加帧列表下拉菜单 -->
      <div class="frame-selector-container">
        <div class="frame-dropdown" v-show="showFrameList" @mouseleave="showFrameList = false">
          <div v-for="(frame, index) in framesList" :key="frame.id" class="frame-item" @click="navigateToFrame(frame)">
            {{ index === 0 ? "概览" : `页面 ${index}` }}
            <!-- {{ frame.type }} {{ index + 1 }} -->
          </div>
        </div>
      </div>
      <button class="save-btn" @click="handleExport">导出</button>
      <button class="import-btn" @click="triggerImportFile">导入</button>
      <button class="preview-btn" @click="handlePreview">预览</button>
      <!-- 隐藏的JSON文件输入框 -->
      <input type="file" ref="jsonFileInput" accept=".json" style="display: none" @change="handleJsonImport" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { CanvasManager } from "../../composables/canvas/CanvasManager";
import { EventBus, EventTypes } from "../../utils/EventBus";
import { useRouter } from "vue-router";

const router = useRouter(); 

const props = defineProps<{ canvasManager: CanvasManager | null }>();
const fileInput = ref<HTMLInputElement | null>(null);
const jsonFileInput = ref<HTMLInputElement | null>(null);
const showShapeDropdown = ref(false);


const showFrameList = ref(false);
const framesList = ref<any[]>([]);

const handlePreview = () => {
  props.canvasManager?.getModeManager().enterPresentMode();
};

const handleExport = () => {
  if (props.canvasManager) {
    props.canvasManager.exportCanvasToJSON();
  }
};


const triggerImportFile = () => {
  jsonFileInput.value?.click();
};


const handleJsonImport = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const jsonContent = e.target?.result as string;
      if (jsonContent && props.canvasManager) {
        props.canvasManager.importCanvasFromJSON(jsonContent);
      }
      
      input.value = "";
    };

    reader.readAsText(file);
  }
};


const openTestPage = () => {
  
  router.push('/test');
};


const getAllFrames = () => {
  if (!props.canvasManager) return;

  
  const pageFrame = props.canvasManager.getPageFrame();

  
  const frames = props.canvasManager.getAllFrames();

  
  const allFrames = [];
  if (pageFrame) {
    allFrames.push(pageFrame);
  }
  if (frames && frames.length) {
    allFrames.push(...frames);
  }

  framesList.value = allFrames;
};



const toggleFrameList = () => {
  showFrameList.value = !showFrameList.value;
  if (showFrameList.value) {
    getAllFrames();
  }
};



const navigateToFrame = (frame: any) => {
  if (!props.canvasManager) return;
  props.canvasManager.navigateToFrame(frame);
  showFrameList.value = false;
};



watch(() => props.canvasManager, (newVal) => {
  if (newVal) {
    getAllFrames();
  }
}, { immediate: true });


onMounted(() => {
  if (props.canvasManager) {
    getAllFrames();
  }
});

const shapes = [
  {
    name: "正方形",
    type: "square",
    options: { width: 100, height: 100, fill: "#fff" },
  },
  {
    name: "矩形",
    type: "rect",
    options: { width: 150, height: 100, fill: "#fff" },
  },
  {
    name: "三角形",
    type: "triangle",
    options: { width: 100, height: 100, fill: "#fff" },
  },
  { name: "圆形", type: "circle", options: { radius: 50, fill: "#fff" } },
  {
    name: "直线",
    type: "line",
    options: { width: 100, stroke: "#fff", strokeWidth: 2 },
  },
  {
    name: "箭头",
    type: "arrow",
    options: { width: 100, stroke: "#fff", strokeWidth: 2 },
  },
];

const addShape = (type: string, options: any) => {
  
  props.canvasManager?.getControlsManager()?.addShape(type, options);
  showShapeDropdown.value = false;
};


const handleImageSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const url = URL.createObjectURL(file);
    props.canvasManager?.getControlsManager()?.addImage(url);
    
    input.value = "";
  }
};

const tools = ref([
  {
    id: 2,
    name: "文本",
    action: () => {
      props.canvasManager?.getControlsManager()?.addText();
    },
  },
  {
    id: 3,
    name: "媒体",
    action: () => {
      
      EventBus.emit(EventTypes.CONTROL_PANEL.OPEN, {
        type: EventTypes.PANEL_TYPE.INSERT_IMAGE,
        canvas: props.canvasManager?.getMainCanvas(),
        canvasManager:props.canvasManager,
        target: null,
        position: null
      });
    },
  },
  {
    id: 4,
    name: "形状",
    action: () => {
      showShapeDropdown.value = !showShapeDropdown.value;
    },
  },
  { id: 1, name: "动画", action: () => console.log("select") },
]);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 100%;
  border-bottom: 1px solid #e8e8e8;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}

.toolbar-center {
  display: flex;
  gap: 10px;
}

.tool-btn {
  padding: 6px 12px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
}

.tool-btn:hover {
  background-color: #e6f7ff;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.preview-btn,
.save-btn,
.import-btn,
.test-page-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.preview-btn {
  background-color: #52c41a;
  color: white;
}

.test-page-btn {
  background-color: #f0f2f5;
}

.save-btn {
  background-color: #1890ff;
  color: white;
}

.import-btn {
  background-color: #722ed1;
  color: white;
}

.shape-dropdown {
  position: absolute;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
}

.shape-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.shape-item:hover {
  background-color: #e6f7ff;
}

.tool-item {
  position: relative;
}


.shape-dropdown,
.frame-dropdown {
  position: absolute;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
  max-height: 300px;
  overflow-y: auto;
}

.shape-item,
.frame-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.shape-item:hover,
.frame-item:hover {
  background-color: #e6f7ff;
}

.tool-item,
.frame-selector-container {
  position: relative;
}

.frame-dropdown {
  top: 100%;
  right: 0;
  
  margin-top: 4px;
  position: absolute;
  
}
</style>

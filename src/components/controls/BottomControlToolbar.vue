<template>
  <div class="bottom-control-toolbar" :class="{ 'is-expanded': isExpanded }">
    <div class="toolbar-container">
      <div class="toolbar-buttons">
        <button class="toolbar-button" @click="handleHandTool" :class="{ 'active': isPanMode }">
          <i class="icon-hand">
            <HandRight />
          </i>
        </button>
        <!-- <button class="toolbar-button" @click="handlePrevious">
          <i class="icon-previous">
            <ChevronBack />
          </i>
        </button>
        <button class="toolbar-button" @click="handleNext">
          <i class="icon-next">
            <ChevronForward />
          </i>
        </button> -->
        <button class="toolbar-button" @click="handleHome">
          <i class="icon-home">
            <Home />
          </i>
        </button>
        <button class="toolbar-button" @click="handleZoomOut">
          <i class="icon-zoom-out">
            <Remove />
          </i>
        </button>
        <div class="zoom-percentage">{{ zoomPercentage }}%</div>
        <button class="toolbar-button" @click="handleZoomIn">
          <i class="icon-zoom-in">
            <Add />
          </i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CanvasManager } from '../../composables/canvas/CanvasManager';
import { EventBus, EventTypes } from '../../utils/EventBus';
import { ref, defineEmits, watch, onMounted, onUnmounted } from 'vue';
import {
  HandRight,
  ChevronBack,
  ChevronForward,
  Home,
  Remove,
  Add
} from '@vicons/ionicons5';

const props = defineProps<{
  canvasManager?: CanvasManager;
}>();

const emit = defineEmits([
  'hand-tool',
  'previous',
  'next',
  'home',
  'zoom-out',
  'zoom-in'
]);

const isExpanded = ref(true);
const zoomPercentage = ref(100);
const isPanMode = ref(false);


const handleHandTool = () => {
  if (!props.canvasManager) return;

  
  if (isPanMode.value) {
    
    props.canvasManager.setDragMode('default');
    isPanMode.value = false;
  } else {
    
    props.canvasManager.setDragMode('pan');
    isPanMode.value = true;
  }
  emit('hand-tool');
};


const handlePrevious = () => {
  emit('previous');
};


const handleNext = () => {
  emit('next');
};


const handleHome = () => {
  if (!props.canvasManager) return;

  const homeIcon = document.querySelector('.icon-home');
  if (homeIcon) {
    homeIcon.classList.add('icon-clicked');
    setTimeout(() => {
      homeIcon.classList.remove('icon-clicked');
    }, 200);
  }

  
  const pageFrame = props.canvasManager.getPageFrame();
  if (pageFrame) {
    props.canvasManager.navigateToFrame(pageFrame);
    handleZoomChange();
  }
  
  emit('home');
};


const handleZoomOut = () => {
  if (!props.canvasManager) return;

  if (zoomPercentage.value > 10) {
    zoomPercentage.value = Math.max(10, zoomPercentage.value - 25);
    props.canvasManager.setZoom(zoomPercentage.value / 100);
  }
  emit('zoom-out', zoomPercentage.value);
};


const handleZoomIn = () => {
  if (!props.canvasManager) return;

  if (zoomPercentage.value < 2000) {
    zoomPercentage.value = Math.min(2000, zoomPercentage.value + 25);
    props.canvasManager.setZoom(zoomPercentage.value / 100);
  }
  emit('zoom-in', zoomPercentage.value);
};


const setZoomPercentage = (percentage: number) => {
  zoomPercentage.value = percentage;
};

const handleZoomChange = () => {
  if (props.canvasManager) {
    const currentZoom = props.canvasManager.getZoom();
    
    if (currentZoom) {
      setZoomPercentage(Math.round(currentZoom * 100));
    }
  }
};


watch(() => props.canvasManager, (newManager) => {
  if (newManager) {
    
    isPanMode.value = newManager.getDragMode() === 'pan';
  }
}, { immediate: true });


onMounted(() => {
  EventBus.on(EventTypes.CANVAS.ZOOM_CHANGE, handleZoomChange);
});


onUnmounted(() => {
  EventBus.off(EventTypes.CANVAS.ZOOM_CHANGE, handleZoomChange);
});



defineExpose({
  setZoomPercentage
});
</script>

<style scoped>
.bottom-control-toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  transition: all 0.3s ease;
}

.toolbar-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px 12px;
  display: flex;
  align-items: center;
}

.toolbar-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-button {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  transition: background-color 0.2s;
}

.toolbar-button:hover {
  background-color: #f0f0f0;
}

.toolbar-button.active {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.icon-clicked {
  color: #1890ff !important;
  transition: color 0.1s ease;
}

.toolbar-button i {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-percentage {
  font-size: 14px;
  color: #333;
  margin: 0 8px;
  min-width: 40px;
  text-align: center;
}


@media (max-width: 768px) {
  .bottom-control-toolbar {
    bottom: 10px;
  }

  .toolbar-button {
    width: 32px;
    height: 32px;
  }

  .toolbar-button i {
    width: 18px;
    height: 18px;
  }

  .zoom-percentage {
    font-size: 12px;
    min-width: 36px;
  }
}
</style>
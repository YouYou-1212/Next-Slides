<!-- src/components/canvas/BaseCanvas.vue -->
<template>
  <div class="canvas-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
    <!-- 用于演示的画布 -->
    <canvas ref="presentationCanvasRef" class="presentation-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import * as fabric from "fabric";
import { ref, onMounted, onUnmounted, computed, watch , nextTick} from "vue";
import { CanvasManager } from "../../composables/canvas/CanvasManager";

const emit = defineEmits(['canvas-ready']);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const presentationCanvasRef = ref<HTMLCanvasElement | null>(null);
let canvasManager: CanvasManager | null = null;

onMounted(async () => {
  await nextTick();
  if (canvasRef.value && presentationCanvasRef.value && canvasRef.value.parentElement) {
    canvasManager = new CanvasManager(
      canvasRef.value,
      presentationCanvasRef.value,
      canvasRef.value.parentElement
    );
    
    // 等待 canvasManager 初始化完成
    await nextTick();
    
    // 通知父组件 canvas 已准备就绪
    emit('canvas-ready');
    console.log('Canvas 已准备就绪，canvasManager 已初始化');
  } else {
    console.warn('Canvas 元素未完全挂载，无法初始化 canvasManager');
  }
});

onUnmounted(() => {
  canvasManager?.destroy();
  canvasManager = null;
});

// 暴露给父组件的属性和方法
defineExpose({
  canvasManager: computed(() => canvasManager),
});

</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  /***/background-image: radial-gradient(circle, #0c0c0c 0px, #ffffff00 1px);
  background-size: 18px 18px;
}

canvas {
  position: absolute;
  left: 0;
  top: 0;
}

.presentation-canvas {
  display: none; /* 初始状态隐藏 */
}

:deep(.canvas-container .highlight-border) {
  box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
  transition: all 0.2s ease;
}
</style>

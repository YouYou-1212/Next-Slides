<template>
  <div class="background-color-selector">
    <div class="color-picker">
      <label for="color-input">选择背景颜色:</label>
      <div class="color-input-wrapper">
        <input 
          type="color" 
          id="color-input" 
          v-model="selectedColor" 
          @change="updateColor"
        />
        <input 
          type="text" 
          v-model="selectedColor" 
          @change="updateColor"
          placeholder="#FFFFFF"
        />
      </div>
    </div>
    
    <div class="color-presets">
      <h4>预设颜色:</h4>
      <div class="preset-grid">
        <div 
          v-for="color in presetColors" 
          :key="color"
          class="color-preset"
          :style="{ backgroundColor: color }"
          @click="selectPresetColor(color)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import * as fabric from 'fabric';
import { setBackgroundColor } from '../../utils/CanvasUtils';

const props = defineProps<{
  canvas: fabric.Canvas;
  target: any;
  position: any;
}>();

const selectedColor = ref('#FFFFFF');

// 预设颜色
const presetColors = [
  '#FFFFFF', '#F5F5F5', '#EEEEEE', '#E0E0E0',
  '#FFEBEE', '#FCE4EC', '#F3E5F5', '#EDE7F6',
  '#E8EAF6', '#E3F2FD', '#E1F5FE', '#E0F7FA',
  '#E0F2F1', '#E8F5E9', '#F1F8E9', '#F9FBE7',
  '#FFFDE7', '#FFF8E1', '#FFF3E0', '#FBE9E7'
];

// 更新颜色方法，直接在组件内处理
const updateColor = () => {
  if (props.canvas) {
    // 设置画布背景色
    setBackgroundColor(props.canvas , selectedColor.value)
  }
};

const selectPresetColor = (color: string) => {
  selectedColor.value = color;
  updateColor();
};
</script>

<style scoped>
.background-color-selector {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 0;
}

.color-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-input-wrapper input[type="color"] {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-input-wrapper input[type="text"] {
  flex: 1;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.color-presets {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.color-preset {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
  transition: transform 0.2s;
}

.color-preset:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
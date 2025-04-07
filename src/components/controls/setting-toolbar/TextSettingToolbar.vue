<template>
  <CommonSettingToolbar :toolbarPosition="toolbarPosition">
    <!-- 文本样式选择 -->
    <div class="text-style-control">
      <select v-model="textStyle" @change="(e: Event) => handleChangeTextStyle((e.target as HTMLSelectElement).value)">
        <option v-for="style in textStyles" :key="style.value" :value="style.value">
          {{ style.label }}
        </option>
      </select>
    </div>

    <div class="divider"></div>

    <button @click="handleToggleBold" :class="{ active: isBold }" title="粗体">
      <i class="fas fa-bold"></i>
    </button>
    <button @click="handleToggleItalic" :class="{ active: isItalic }" title="斜体">
      <i class="fas fa-italic"></i>
    </button>
    <button @click="handleToggleUnderline" :class="{ active: isUnderline }" title="下划线">
      <i class="fas fa-underline"></i>
    </button>
    <div class="divider"></div>

    <!-- 字体选择器 -->
    <div class="font-family-control">
      <select v-model="fontFamily" @change="handleChangeFontFamily">
        <option v-for="font in fontFamilies" :key="font.value" :value="font.value">
          {{ font.label }}
        </option>
      </select>
    </div>

    <div class="divider"></div>

    <!-- 字体大小控制 -->
    <div class="font-size-control">
      <button @click="handleDecreaseFontSize" title="减小字号">
        <i class="fas fa-minus"></i>
      </button>
      <input type="number" v-model="fontSize" @change="handleUpdateFontSize" min="1" max="1000"
        class="font-size-input" />
      <button @click="handleIncreaseFontSize" title="增大字号">
        <i class="fas fa-plus"></i>
      </button>
    </div>

    <div class="divider"></div>

    <!-- 对齐方式 -->
    <div class="align-control">
      <button @click="showAlignMenu = !showAlignMenu" :class="{ active: showAlignMenu }" title="对齐方式">
        <i class="fas fa-align-left"></i>
      </button>
      <div v-if="showAlignMenu" class="align-menu">
        <div class="align-menu-inner">
          <button @click="handleSetTextAlign('left')" :class="{ active: textAlign === 'left' }" title="左对齐">
            <i class="fas fa-align-left"></i>
          </button>
          <button @click="handleSetTextAlign('center')" :class="{ active: textAlign === 'center' }" title="居中对齐">
            <i class="fas fa-align-center"></i>
          </button>
          <button @click="handleSetTextAlign('right')" :class="{ active: textAlign === 'right' }" title="右对齐">
            <i class="fas fa-align-right"></i>
          </button>
          <button @click="handleSetTextAlign('justify')" :class="{ active: textAlign === 'justify' }" title="分散对齐">
            <i class="fas fa-align-justify"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 列表控制 -->
    <button @click="handleToggleUnorderedList" :class="{ active: isUnorderedList }" title="无序列表">
      <i class="fas fa-list-ul"></i>
    </button>
    <button @click="handleToggleOrderedList" :class="{ active: isOrderedList }" title="有序列表">
      <i class="fas fa-list-ol"></i>
    </button>

    <div class="divider"></div>

    <!-- 颜色选择器 -->
    <div class="color-selector">
      <button @click="showColorPicker = !showColorPicker" title="文本颜色">
        <div class="color-preview" :style="{ backgroundColor: textColor }"></div>
      </button>
      <ColorPicker v-if="showColorPicker" v-model:color="textColor" @select="handleTextColorSelect" />

    </div>

    <!-- 文本背景颜色选择器 -->
    <div class="color-selector">
      <button @click="showBgColorPicker = !showBgColorPicker" title="文本背景颜色">
        <div class="color-preview bg-color-preview" :style="{ backgroundColor: textBgColor }"></div>
      </button>
      <ColorPicker v-if="showBgColorPicker" v-model:color="textBgColor" @select="handleTextBgColorSelect" />
    </div>

    <!-- 文本框背景颜色选择器 -->
    <div class="color-selector">
      <button @click="showBoxBgColorPicker = !showBoxBgColorPicker" title="文本框背景颜色">
        <div class="color-preview box-bg-color-preview" :style="{ backgroundColor: boxBgColor }"></div>
      </button>
      <ColorPicker v-if="showBoxBgColorPicker" v-model:color="boxBgColor" @select="handleBoxBgColorSelect" />
    </div>

    <!-- 允许用户在这里添加自定义组件 -->
    <slot name="custom-controls"></slot>
  </CommonSettingToolbar>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import ColorPicker from '../../common/ColorPicker.vue';
import CommonSettingToolbar from './CommonSettingToolbar.vue';
import { useTextSettingToolsHandle } from '../../../composables/menu/setting-tools/TextSettingToolsHandle';

const props = defineProps<{
  canvasManager?: any;
  panelData?: any;
}>();


const {
  textSettingToolsHandle,
  textSettingToolbarVisible,
  textSettingToolbarData,
  toolbarPosition,
  isBold,
  isItalic,
  isUnderline,
  fontSize,
  textColor,
  textBgColor,
  boxBgColor,
  textAlign,
  fontFamily,
  textStyle,
  isUnorderedList,
  isOrderedList,
  fontFamilies,
  textStyles,
  targetObject,
  visible
} = useTextSettingToolsHandle(props.canvasManager);


const showColorPicker = ref(false);
const showBgColorPicker = ref(false);
const showBoxBgColorPicker = ref(false);
const showAlignMenu = ref(false);










const handleToggleBold = () => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.toggleBold();
  }
};


const handleToggleItalic = () => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.toggleItalic();
  }
};


const handleToggleUnderline = () => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.toggleUnderline();
  }
};


const handleIncreaseFontSize = () => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.increaseFontSize();
  }
};


const handleDecreaseFontSize = () => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.decreaseFontSize();
  }
};


const handleUpdateFontSize = () => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.updateFontSize(fontSize.value as number);
  }
};


const handleTextColorSelect = (color: string) => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.setTextColor(color);
  }
  showColorPicker.value = false;
};


const handleTextBgColorSelect = (color: string) => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.setTextBgColor(color);
  }
  showBgColorPicker.value = false;
};


const handleBoxBgColorSelect = (color: string) => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.setBoxBgColor(color);
  }
  showBoxBgColorPicker.value = false;
};


const handleSetTextAlign = (align: string) => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.setTextAlign(align);
  }
  showAlignMenu.value = false;
};


const handleToggleUnorderedList = () => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.toggleUnorderedList();
  }
};


const handleToggleOrderedList = () => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.toggleOrderedList();
  }
};


const handleChangeFontFamily = () => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.changeFontFamily(fontFamily.value);
  }
};


const handleChangeTextStyle = (textStyle: string) => {
  if (textSettingToolsHandle.value) {
    textSettingToolsHandle.value.changeTextStyle(textStyle);
  }
};


watch(() => props.panelData, (newData) => {
  if (newData && newData.target) {
    
    if (textSettingToolsHandle.value) {
      textSettingToolsHandle.value.syncDataAndVisible(newData, true);
    }
  }
}, { immediate: true, deep: true });

onMounted(() => {
  
  document.addEventListener('click', (e) => {
    if ((showColorPicker.value || showBgColorPicker.value || showBoxBgColorPicker.value) &&
      !e.composedPath().some(el => (el as HTMLElement).classList?.contains('color-selector'))) {
      showColorPicker.value = false;
      showBgColorPicker.value = false;
      showBoxBgColorPicker.value = false;
    }

    if (showAlignMenu.value &&
      !e.composedPath().some(el => (el as HTMLElement).classList?.contains('align-control'))) {
      showAlignMenu.value = false;
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('click', () => { });
});
</script>

<style scoped>


.toolbar-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  
}

button {
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #595959;
  position: relative;
  
}

button:hover {
  background-color: #f0f0f0;
  border-color: #d9d9d9;
}

button.active {
  background-color: #e6f7ff;
  color: #1890ff;
  border-color: #91d5ff;
}

.divider {
  width: 1px;
  height: 24px;
  
  background-color: #e8e8e8;
  margin: 0 4px;
  
}

.font-size-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  height: 32px;
}

.font-size-control button {
  border: none;
  width: 28px;
  height: 30px;
}


.font-size-input {
  width: 40px;
  text-align: center;
  font-size: 14px;
  color: #595959;
  border: none;
  border-left: 1px solid #d9d9d9;
  border-right: 1px solid #d9d9d9;
  height: 100%;
  padding: 0;
  -moz-appearance: textfield;
  
}

.font-size-input::-webkit-outer-spin-button,
.font-size-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}



.font-family-control select {
  height: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  padding: 0 4px;
  font-size: 12px;
  color: #595959;
  width: 100%;
  background-color: transparent;
  cursor: pointer;
}



.color-preview {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  border: 1px solid #d9d9d9;
}

.color-picker {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin-top: 4px;
  z-index: 1001;
}

.color-option {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  cursor: pointer;
  border: 1px solid #d9d9d9;
}

.color-option:hover {
  border-color: #1890ff;
}


i.fas {
  font-size: 12px;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}


.text-style-control {
  min-width: 80px;
}

.text-style-control select {
  height: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  padding: 0 4px;
  font-size: 12px;
  color: #595959;
  width: 100%;
  background-color: transparent;
  cursor: pointer;
}




.bg-color-preview::before {
  content: 'T';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  color: #333;
  font-weight: bold;
}


.color-option[style*="transparent"] {
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
    linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
  background-size: 8px 8px;
  background-position: 0 0, 4px 4px;
}


@media (max-width: 768px) {
  .text-format-toolbar {
    flex-wrap: wrap;
    max-width: 300px;
  }

  .toolbar-buttons {
    flex-wrap: wrap;
  }

  .font-family-control,
  .text-style-control {
    min-width: 60px;
  }
}


button[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 10px;
  white-space: nowrap;
  z-index: 1002;
  pointer-events: none;
  
}


.color-selector {
  position: relative;
  height: 32px;
  z-index: 10;
}

.color-selector:hover {
  z-index: 20;
}


.font-family-control,
.text-style-control {
  position: relative;
  z-index: 10;
}

.font-family-control:hover,
.text-style-control:hover {
  z-index: 20;
}


.bg-color-preview {
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
    linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
  background-size: 8px 8px;
  background-position: 0 0, 4px 4px;
  background-color: transparent;
  position: relative;
}

.bg-color-preview::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-color, transparent);
  border-radius: 2px;
}


.box-bg-color-preview {
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
    linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
  background-size: 8px 8px;
  background-position: 0 0, 4px 4px;
  background-color: transparent;
  position: relative;
}

.box-bg-color-preview::before {
  content: '□';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  color: #333;
  font-weight: bold;
}

.box-bg-color-preview::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-color, transparent);
  border-radius: 2px;
}

.align-control {
  position: relative;
}

.align-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px;
  z-index: 1001;
  margin-bottom: 8px;
}

.align-menu button i.fas {
  display: flex;
  justify-content: center;
  width: 100%;
}

.align-menu-inner {
  display: flex;
  align-items: center;
  gap: 4px;
}


.align-menu button {
  
  justify-content: flex-start;
  padding-left: 8px;
}
</style>
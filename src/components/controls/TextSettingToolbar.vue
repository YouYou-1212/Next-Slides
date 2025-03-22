<template>
  <div class="text-format-toolbar" :style="toolbarStyle" v-if="visible">
    <div class="toolbar-buttons">
      <!-- 文本样式选择 -->
      <div class="text-style-control">
        <select v-model="textStyle" @change="changeTextStyle">
          <option v-for="style in textStyles" :key="style.value" :value="style.value">
            {{ style.label }}
          </option>
        </select>
      </div>

      <div class="divider"></div>

      <button @click="toggleBold" :class="{ active: isBold }" title="粗体">
        <i class="fas fa-bold"></i>
      </button>
      <button @click="toggleItalic" :class="{ active: isItalic }" title="斜体">
        <i class="fas fa-italic"></i>
      </button>
      <button @click="toggleUnderline" :class="{ active: isUnderline }" title="下划线">
        <i class="fas fa-underline"></i>
      </button>
      <div class="divider"></div>

      <!-- 字体选择器 -->
      <div class="font-family-control">
        <select v-model="fontFamily" @change="changeFontFamily">
          <option v-for="font in fontFamilies" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
      </div>

      <div class="divider"></div>

      <!-- 字体大小控制 -->
      <div class="font-size-control">
        <button @click="decreaseFontSize" title="减小字号">
          <i class="fas fa-minus"></i>
        </button>
        <span>{{ fontSize }}</span>
        <button @click="increaseFontSize" title="增大字号">
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
            <button @click="setTextAlign('left')" :class="{ active: textAlign === 'left' }" title="左对齐">
              <i class="fas fa-align-left"></i>
            </button>
            <button @click="setTextAlign('center')" :class="{ active: textAlign === 'center' }" title="居中对齐">
              <i class="fas fa-align-center"></i>
            </button>
            <button @click="setTextAlign('right')" :class="{ active: textAlign === 'right' }" title="右对齐">
              <i class="fas fa-align-right"></i>
            </button>
            <button @click="setTextAlign('justify')" :class="{ active: textAlign === 'justify' }" title="分散对齐">
              <i class="fas fa-align-justify"></i>
            </button>
          </div>
        </div>
      </div>
      <!-- <button @click="setTextAlign('left')" :class="{ active: textAlign === 'left' }" title="左对齐">
        <i class="fas fa-align-left"></i>
      </button>
      <button @click="setTextAlign('center')" :class="{ active: textAlign === 'center' }" title="居中对齐">
        <i class="fas fa-align-center"></i>
      </button>
      <button @click="setTextAlign('right')" :class="{ active: textAlign === 'right' }" title="右对齐">
        <i class="fas fa-align-right"></i>
      </button>
      <button @click="setTextAlign('justify')" :class="{ active: textAlign === 'justify' }" title="分散对齐">
        <i class="fas fa-align-justify"></i>
      </button> -->

      <div class="divider"></div>

      <!-- 列表控制 -->
      <button @click="toggleUnorderedList" :class="{ active: isUnorderedList }" title="无序列表">
        <i class="fas fa-list-ul"></i>
      </button>
      <button @click="toggleOrderedList" :class="{ active: isOrderedList }" title="有序列表">
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

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import * as fabric from 'fabric';
import { getSystemFonts, defaultFonts } from '../../utils/FontsUtils';
import ColorPicker from './ColorPicker.vue';

const props = defineProps<{
  canvasManager?: any;
  panelData?: any; // 添加 panelData 属性
}>();

const visible = ref(false);
const targetObject = ref<fabric.Object | null>(null);
const position = ref({ top: 0, left: 0 });
const showColorPicker = ref(false);
const showBgColorPicker = ref(false);
const showBoxBgColorPicker = ref(false); // 文本框背景色选择器状态
// 文本样式状态
const isBold = ref(false);
const isItalic = ref(false);
const isUnderline = ref(false);
const fontSize = ref(16);
const textColor = ref('#000000');
const textBgColor = ref('transparent'); // 文本背景颜色
const boxBgColor = ref('transparent'); // 文本框背景颜色
const textAlign = ref('left');
const showAlignMenu = ref(false);
const fontFamily = ref('Arial');
const textStyle = ref('normal'); // 文本样式

const isUnorderedList = ref(false);
const isOrderedList = ref(false);


// 文本样式选项
const textStyles = [
  { label: '普通', value: 'normal' },
  { label: '标题1', value: 'heading1' },
  { label: '标题2', value: 'heading2' },
  { label: '标题3', value: 'heading3' },
  { label: '标题4', value: 'heading4' },
  { label: '引用', value: 'quote' },
  { label: '代码', value: 'code' },
];

// 字体选项
const fontFamilies = ref([
  ...defaultFonts
]);


// 初始化字体列表
const initFontList = async () => {
  getSystemFonts().then((fonts) => {
    fontFamilies.value = fonts;
  }).catch((err) => {
    console.error('获取系统字体失败:', err);
    alert('获取系统字体失败，可能是因为页面不可见或缺少用户交互。请尝试点击页面后再操作。');
  });
};

// 处理颜色选择
const handleTextColorSelect = (color: string) => {
  setTextColor(color);
  showColorPicker.value = false;
};

const handleTextBgColorSelect = (color: string) => {
  setTextBgColor(color);
  showBgColorPicker.value = false;
};

const handleBoxBgColorSelect = (color: string) => {
  setBoxBgColor(color);
  showBoxBgColorPicker.value = false;
};

// 计算工具栏位置
const toolbarStyle = computed(() => {
  return {
    top: `${position.value.top}px`,
    left: `${position.value.left}px`
  };
});

// 更新文本样式状态
const updateTextStyleState = () => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  isBold.value = textObj.fontWeight === 'bold';
  isItalic.value = textObj.fontStyle === 'italic';
  isUnderline.value = textObj.underline === true;
  fontSize.value = textObj.fontSize || 16;
  textColor.value = textObj.fill || '#000000';
  textBgColor.value = textObj.textBackgroundColor || 'transparent'; // 获取文本背景颜色
  // 获取文本背景颜色
  boxBgColor.value = textObj.backgroundColor || 'transparent'; // 获取文本框背景颜色
  textAlign.value = textObj.textAlign || 'left';
  fontFamily.value = textObj.fontFamily || 'Arial';
  // 更新列表状态
  isUnorderedList.value = textObj.listStyle === 'unordered';
  isOrderedList.value = textObj.listStyle === 'ordered';

  // 根据文本属性推断样式
  if (textObj.fontSize >= 40) {
    textStyle.value = 'heading1';
  } else if (textObj.fontSize >= 32) {
    textStyle.value = 'heading2';
  } else if (textObj.fontSize >= 24) {
    textStyle.value = 'heading3';
  } else if (textObj.fontSize >= 18) {
    textStyle.value = 'heading4';
  } else {
    textStyle.value = 'normal';
  }
};



// 切换粗体
const toggleBold = () => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  const newWeight = textObj.fontWeight === 'bold' ? 'normal' : 'bold';
  textObj.set('fontWeight', newWeight);
  isBold.value = newWeight === 'bold';
  props.canvasManager?.canvas.renderAll();
};

// 切换斜体
const toggleItalic = () => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  const newStyle = textObj.fontStyle === 'italic' ? 'normal' : 'italic';
  textObj.set('fontStyle', newStyle);
  isItalic.value = newStyle === 'italic';
  props.canvasManager?.canvas.renderAll();
};

// 切换下划线
const toggleUnderline = () => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  const newUnderline = !textObj.underline;
  textObj.set('underline', newUnderline);
  isUnderline.value = newUnderline;
  props.canvasManager?.canvas.renderAll();
};

// 增加字体大小
const increaseFontSize = () => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  const newSize = Math.min((textObj.fontSize || 16) + 1, 1000);
  textObj.setFontSize(newSize, true);
  fontSize.value = newSize;
};

// 减小字体大小
const decreaseFontSize = () => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  const newSize = Math.min((textObj.fontSize || 16) - 1, 1000);
  textObj.setFontSize(newSize, true);
  fontSize.value = newSize;
};

// 设置文本颜色时同步更新自定义颜色文本
const setTextColor = (color: string) => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  textObj.set('fill', color);
  textColor.value = color;
  // customColorText.value = color === 'transparent' ? '' : color;
  showColorPicker.value = false;
  props.canvasManager?.canvas.renderAll();
};


// 设置文本背景颜色
const setTextBgColor = (color: string) => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  textObj.set('textBackgroundColor', color);
  textBgColor.value = color;
  showBgColorPicker.value = false;
  props.canvasManager?.canvas.renderAll();
};

// 设置文本框背景颜色
const setBoxBgColor = (color: string) => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  textObj.set('backgroundColor', color);
  boxBgColor.value = color;
  showBoxBgColorPicker.value = false;
  // props.canvasManager?.canvas.requestRenderAll();
};

// 设置文本对齐方式
const setTextAlign = (align: string) => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  textObj.set('textAlign', align);
  textAlign.value = align;
  showAlignMenu.value = false;
  // props.canvasManager?.canvas.requestRenderAll();
};


// 添加切换列表的方法
const toggleUnorderedList = () => {
  if (!targetObject.value) return;
  const textObj = targetObject.value as any;
  if (typeof textObj.setListStyle === 'function') {
    isUnorderedList.value = !isUnorderedList.value;
    if (isUnorderedList.value) {
      isOrderedList.value = false;
      textObj.setListStyle('unordered');
    } else {
      textObj.setListStyle('none');
    }
    // props.canvasManager?.canvas.renderAll();
  }
};

const toggleOrderedList = () => {
  if (!targetObject.value) return;
  const textObj = targetObject.value as any;
  if (typeof textObj.setListStyle === 'function') {
    isOrderedList.value = !isOrderedList.value;
    if (isOrderedList.value) {
      isUnorderedList.value = false;
      textObj.setListStyle('ordered');
    } else {
      textObj.setListStyle('none');
    }
    props.canvasManager?.canvas.renderAll();
  }
};


// 更改字体
const changeFontFamily = () => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;
  textObj.set('fontFamily', fontFamily.value);
  props.canvasManager?.canvas.renderAll();
};

// 更改文本样式
const changeTextStyle = () => {
  if (!targetObject.value) return;

  const textObj = targetObject.value as any;

  // 根据选择的样式应用不同的属性
  switch (textStyle.value) {
    case 'heading1':
      textObj.applyTextStyle({
        fontSize: 40,
        fontWeight: 'bold'
      });
      fontSize.value = 40;
      isBold.value = true;
      break;
    case 'heading2':
      textObj.applyTextStyle({
        fontSize: 32,
        fontWeight: 'bold'
      });
      fontSize.value = 32;
      isBold.value = true;
      break;
    case 'heading3':
      textObj.applyTextStyle({
        fontSize: 24,
        fontWeight: 'bold'
      });
      fontSize.value = 24;
      isBold.value = true;
      break;
    case 'heading4':
      textObj.applyTextStyle({
        fontSize: 18,
        fontWeight: 'bold'
      });
      fontSize.value = 18;
      isBold.value = true;
      break;
    case 'quote':
      textObj.applyTextStyle({
        fontStyle: 'italic',
        textBackgroundColor: '#f0f0f0'
      });
      isItalic.value = true;
      textBgColor.value = '#f0f0f0';
      break;
    case 'code':
      textObj.applyTextStyle({
        fontFamily: 'Courier New',
        textBackgroundColor: '#f5f5f5'
      });
      fontFamily.value = 'Courier New';
      textBgColor.value = '#f5f5f5';
      break;
    case 'normal':
    default:
      textObj.applyTextStyle({
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textBackgroundColor: 'transparent'
      });
      fontSize.value = 16;
      isBold.value = false;
      isItalic.value = false;
      textBgColor.value = 'transparent';
      break;
  }

  props.canvasManager?.canvas.renderAll();
};


// 计算工具栏位置
const calculatePosition = () => {
  if (!targetObject.value || !props.canvasManager?.canvas) return;

  const canvas = props.canvasManager.canvas;
  const obj = targetObject.value;
  const objBounds = obj.getBoundingRect();
  const zoom = canvas.getZoom();
  const vpt = canvas.viewportTransform;

  if (!vpt) return;

  // 计算对象在视口中的位置
  const objLeft = (objBounds.left * zoom + vpt[4]);
  const objTop = (objBounds.top * zoom + vpt[5]);
  const objWidth = objBounds.width * zoom;
  const objHeight = objBounds.height * zoom;

  // 获取工具栏元素和屏幕尺寸
  const toolbarEl = document.querySelector('.text-format-toolbar') as HTMLElement;
  const toolbarWidth = toolbarEl ? toolbarEl.offsetWidth : 300;
  const toolbarHeight = toolbarEl ? toolbarEl.offsetHeight : 50;

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // 将工具栏放在对象上方并水平居中
  let left = objLeft - (toolbarWidth / 2);
  let top = objTop - toolbarHeight - 15;

  // 确保工具栏在屏幕范围内
  left = Math.max(10, Math.min(left, screenWidth - toolbarWidth - 10));
  top = Math.max(10, Math.min(top, screenHeight - toolbarHeight - 10));

  // 设置位置
  position.value = { left, top };
};


onMounted(() => {
  initFontList();
  // 点击其他地方关闭颜色选择器
  document.addEventListener('click', (e) => {
    if ((showColorPicker.value || showBgColorPicker.value) &&
      !e.composedPath().some(el => (el as HTMLElement).classList?.contains('color-selector'))) {
      showColorPicker.value = false;
      showBgColorPicker.value = false;
      showBoxBgColorPicker.value = false;
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.composedPath().some(el => (el as HTMLElement).classList?.contains('align-control'))) {
      showAlignMenu.value = false;
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('click', () => { });

});
// 监听 panelData 变化
watch(() => props.panelData, (newData) => {
  if (newData && newData.target) {
    targetObject.value = newData.target;
    visible.value = true;
    updateTextStyleState();
    calculatePosition();
  }
}, { immediate: true });
</script>

<style scoped>
.text-format-toolbar {
  position: absolute;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px;
  /* 增加内边距 */
  z-index: 1000;
  pointer-events: auto;
  display: inline-flex;
  user-select: none;
}

.toolbar-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  /* 增加按钮之间的间距 */
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
  /* 添加相对定位 */
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
  /* 增加分隔线高度 */
  background-color: #e8e8e8;
  margin: 0 4px;
  /* 增加分隔线两侧间距 */
}

.font-size-control {
  display: inline-flex;
  align-items: center;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  height: 32px;
  /* 增加控件高度 */
}

.font-size-control button {
  border: none;
  width: 28px;
  height: 30px;
  /* 调整高度以适应父容器 */
}

.font-size-control span {
  min-width: 40px;
  text-align: center;
  font-size: 14px;
  color: #595959;
  border-left: 1px solid #d9d9d9;
  border-right: 1px solid #d9d9d9;
  height: 100%;
  line-height: 30px;
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

/* .color-selector {
  position: relative;
  height: 32px;
} */

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

/* 图标样式 */
i.fas {
  font-size: 12px;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 文本样式选择器样式 */
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

/* 文本背景颜色预览样式 */
/* .bg-color-preview {
  position: relative;
} */

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

/* 透明色特殊处理 */
.color-option[style*="transparent"] {
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
    linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
  background-size: 8px 8px;
  background-position: 0 0, 4px 4px;
}

/* 响应式调整 */
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

/* 添加工具提示样式 */
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
  /* 防止工具提示阻挡鼠标事件 */
}

/* 修复背景色选择器的显示问题 */
.color-selector {
  position: relative;
  height: 32px;
  z-index: 10;
}

.color-selector:hover {
  z-index: 20;
}

/* 确保下拉菜单不会被截断 */
.font-family-control,
.text-style-control {
  position: relative;
  z-index: 10;
}

.font-family-control:hover,
.text-style-control:hover {
  z-index: 20;
}

/* 添加文本背景色选择器的特殊样式 */
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

/* 添加文本框背景色选择器的特殊样式 */
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
  /* width: 100%; */
  justify-content: flex-start;
  padding-left: 8px;
}
</style>
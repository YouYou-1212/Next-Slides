<template>
    <div class="image-format-toolbar" :style="toolbarStyle" v-if="visible">
        <div class="toolbar-buttons">
            <!-- 图片滤镜选择 -->
            <div class="filter-control" v-if="!isSvgImage">
                <select v-model="imageFilter" @change="changeImageFilter">
                    <option v-for="filter in imageFilters" :key="filter.value" :value="filter.value">
                        {{ filter.label }}
                    </option>
                </select>
            </div>

            <div class="divider" v-if="!isSvgImage"></div>


            <div class="fill-color-container">
                <button @click="showColorPickerDirectly" :class="{ active: hasFillColor }" title="填充颜色">
                    <div class="button-content">
                        <i class="fas fa-fill-drip"></i>
                        <div v-if="hasFillColor" class="color-indicator" :style="{ backgroundColor: fillColor }"></div>
                    </div>
                </button>
                <ColorPicker v-if="showFillColorPicker" v-model:color="fillColor" v-model:opacity="fillOpacity"
                    @select="handleFillColorSelect" class="color-picker-position" />
            </div>

            <div class="divider"></div>

           <!-- 图片圆角控制 -->
           <button v-if="!isSvgImage" @click="toggleRoundCorners" :class="{ active: hasRoundCorners }" title="圆角">
                <n-icon size="17">
                    <RoundedCornerOutlined />
                </n-icon>
            </button>
            <!-- 圆角操作区 -->
            <div v-if="showCornerRadiusPanel  && !isSvgImage" class="corner-radius-panel" @click.stop>
                <div class="corner-radius-grid">
                    <div class="corner-radius-item">
                        <label>左上角</label>
                        <div class="input-with-unit">
                            <n-input-number v-model:value="cornerRadius.topLeft" :min="0" :step="1" size="small"
                                @update:value="updateCornerRadiusDebounced('topLeft', $event)"
                                class="corner-input-number" :default-value="0" />
                            <span class="unit">px</span>
                        </div>
                    </div>
                    <div class="corner-radius-item">
                        <label>右上角</label>
                        <div class="input-with-unit">
                            <n-input-number v-model:value="cornerRadius.topRight" :min="0" :step="1" size="small"
                                @update:value="updateCornerRadiusDebounced('topRight', $event)"
                                class="corner-input-number" :default-value="0" />
                            <span class="unit">px</span>
                        </div>
                    </div>
                    <div class="corner-radius-item">
                        <label>左下角</label>
                        <div class="input-with-unit">
                            <n-input-number v-model:value="cornerRadius.bottomLeft" :min="0" :step="1" size="small"
                                @update:value="updateCornerRadiusDebounced('bottomLeft', $event)"
                                class="corner-input-number" :default-value="0" />
                            <span class="unit">px</span>
                        </div>
                    </div>
                    <div class="corner-radius-item">
                        <label>右下角</label>
                        <div class="input-with-unit">
                            <n-input-number v-model:value="cornerRadius.bottomRight" :min="0" :step="1" size="small"
                                @update:value="updateCornerRadiusDebounced('bottomRight', $event)"
                                class="corner-input-number" :default-value="0" />
                            <span class="unit">px</span>
                        </div>
                    </div>
                </div>
                <div class="corner-radius-actions">
                    <n-button size="small" type="primary" @click.stop="applyUniformRadius"
                        class="corner-button">统一圆角</n-button>
                    <n-button size="small" @click.stop="resetCornerRadius" class="corner-button">重置</n-button>
                </div>
            </div>

            <div class="divider" v-if="!isSvgImage"></div>

            <!-- 图片透明度控制 -->
            <div class="opacity-control"  v-if="!isSvgImage">
                <span>透明度:</span>
                <input type="range" min="0" max="1" step="0.1" v-model="opacity" @input="changeOpacity" />
                <span>{{ Math.round(opacity * 100) }}%</span>
            </div>

            <div class="divider" v-if="!isSvgImage"></div>

            <!-- 图片翻转控制 -->
            <button @click="flipHorizontal" title="水平翻转">
                <i class="fas fa-arrows-alt-h"></i>
            </button>
            <button @click="flipVertical" title="垂直翻转">
                <i class="fas fa-arrows-alt-v"></i>
            </button>

            <div class="divider"></div>

            <!-- 图片替换按钮 -->
            <button @click="replaceImage" title="替换图片">
                <i class="fas fa-exchange-alt"></i>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineComponent, ref, computed, watch, onMounted, nextTick } from 'vue';
import * as fabric from 'fabric';
import { EventBus, EventTypes } from '../../utils/EventBus';
import ColorPicker from './ColorPicker.vue';

import { RoundedCornerOutlined } from '@vicons/material'
import { PictureControl } from '@/composables/subassembly/controls/PictureControl';
import type { ImageControl } from '@/composables/subassembly/controls/ImageControl';

const props = defineProps<{
    canvasManager?: any;
    panelData?: any;
}>();

// 添加防抖函数
function debounce(fn: Function, delay: number) {
    let timer: number | null = null;
    return function (...args: any[]) {
        if (timer) clearTimeout(timer);
        timer = window.setTimeout(() => {
            fn(...args);
            timer = null;
        }, delay);
    };
}

const visible = ref(false);
const targetObject = ref<PictureControl | null>(null);
const position = ref({ top: 0, left: 0 });

// 图片样式状态
const imageFilter = ref('none');
const hasFillColor = ref(false);
const fillColor = ref('#FFFFFF');
const fillOpacity = ref(0.3);
const showFillColorPicker = ref(false);
const hasRoundCorners = ref(false);
const showCornerRadiusPanel = ref(false);
const cornerRadius = ref<{
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
}>({
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0
});
const opacity = ref(1);

const isSvgImage = ref(false);

// 图片滤镜选项
const imageFilters = [
    { label: '无滤镜', value: 'none' },
    { label: '灰度', value: 'grayscale' },
    { label: '复古', value: 'sepia' },
    { label: '反色', value: 'invert' },
    { label: '模糊', value: 'blur' },
    { label: '锐化', value: 'sharpen' },
];

// 计算工具栏位置
const toolbarStyle = computed(() => {
    return {
        top: `${position.value.top}px`,
        left: `${position.value.left}px`
    };
});


// 处理填充颜色选择
const handleFillColorSelect = (color: string, opacity: number) => {
    setFillColor(color, opacity);
    showFillColorPicker.value = false;
};

// 显示颜色选择器
const showColorPickerDirectly = () => {
    showCornerRadiusPanel.value = false;
    showFillColorPicker.value = !showFillColorPicker.value;
};


// 设置填充颜色
const setFillColor = (color: string, opacity: number = 0.3) => {
    if (!targetObject.value) return;

    const imgObj = targetObject.value;
    imgObj.setFillColor(color, opacity);
    fillColor.value = color;
    hasFillColor.value = !!imgObj.getFillColor()?.color;
};


// 更新图片样式状态
const updateImageStyleState = () => {
    if (!targetObject.value) return;
    if (targetObject.value.isSvg()) {
        const imgObj = targetObject.value;
        hasFillColor.value = !!imgObj.getFillColor()?.color;
        fillColor.value = imgObj.getFillColor()?.color || '#FFFFFF';
    } else {
        const imgObj = targetObject.value as any;
        imageFilter.value = getAppliedFilter(imgObj) || 'none';

        if (imgObj.getFillColor) {
            const fillColorInfo = imgObj.getFillColor();
            hasFillColor.value = !!fillColorInfo.color;
            fillColor.value = fillColorInfo.color || '#FFFFFF';
            fillOpacity.value = fillColorInfo.opacity;
        } else {
            hasFillColor.value = !!imgObj.fill;
            fillColor.value = imgObj.fill || '#FFFFFF';
        }
        // 获取圆角状态
        syncHasRoundCorners(imgObj.getInnerControl());
        // 获取透明度
        opacity.value = imgObj.opacity !== undefined ? imgObj.opacity : 1;
    }
};

const syncHasRoundCorners = (imgObj: any) => {
    const cornerRadiusValues = imgObj.getCornerRadius ? imgObj.getCornerRadius() : { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
    hasRoundCorners.value = Object.values(cornerRadiusValues).some((radius) => (radius as number) > 0);
}

// 获取应用的滤镜
const getAppliedFilter = (obj: PictureControl) => {
    if (!obj) return 'none';
    return obj.getAppliedFilterType();
};

// 更改图片滤镜
const changeImageFilter = () => {
    if (!targetObject.value) return;
    targetObject.value.applyFilter(imageFilter.value);
};

// 切换圆角面板显示
const toggleCornerRadiusPanel = () => {
    showCornerRadiusPanel.value = !showCornerRadiusPanel.value;

    // 如果显示面板，初始化圆角值
    if (showCornerRadiusPanel.value && targetObject.value) {
        const imgObj = targetObject.value as any;
        const imgCornerRadius = imgObj.getCornerRadius();
        cornerRadius.value = {
            topLeft: imgCornerRadius.topLeft,
            topRight: imgCornerRadius.topRight,
            bottomLeft: imgCornerRadius.bottomLeft,
            bottomRight: imgCornerRadius.bottomRight
        };
    }
};

const updateCornerRadiusDebounced = debounce((corner: string, value: number) => {
    if (!targetObject.value) return;

    // 更新对应的圆角值
    cornerRadius.value[corner as keyof typeof cornerRadius.value] = value;

    // 应用圆角设置
    updateCornerRadius();
}, 100);


// 更新圆角半径
const updateCornerRadius = () => {
    if (!targetObject.value) return;
    const imgObj = targetObject.value;
    imgObj.setCornerRadii({
        topLeft: cornerRadius.value.topLeft,
        topRight: cornerRadius.value.topRight,
        bottomRight: cornerRadius.value.bottomRight,
        bottomLeft: cornerRadius.value.bottomLeft
    });
    syncHasRoundCorners(imgObj);
};

// 应用统一圆角
const applyUniformRadius = () => {
    if (!targetObject.value) return;

    // 取最大值作为统一圆角值
    const maxRadius = Math.max(
        cornerRadius.value.topLeft,
        cornerRadius.value.topRight,
        cornerRadius.value.bottomLeft,
        cornerRadius.value.bottomRight
    );

    cornerRadius.value = {
        topLeft: maxRadius,
        topRight: maxRadius,
        bottomLeft: maxRadius,
        bottomRight: maxRadius
    };

    updateCornerRadius();
};

// 重置圆角
const resetCornerRadius = () => {
    if (!targetObject.value) return;

    cornerRadius.value = {
        topLeft: 0,
        topRight: 0,
        bottomLeft: 0,
        bottomRight: 0
    };

    updateCornerRadius();
};


// 切换圆角
const toggleRoundCorners = (event: MouseEvent) => {
    event.stopPropagation(); // 阻止事件冒泡
    showFillColorPicker.value = false;
    toggleCornerRadiusPanel();
};

// 更改透明度
const changeOpacity = () => {
    if (!targetObject.value) return;

    const imgObj = targetObject.value as any;
    imgObj.set('opacity', opacity.value);

    props.canvasManager?.canvas.renderAll();
};

// 水平翻转
const flipHorizontal = () => {
    if (!targetObject.value) return;

    const imgObj = targetObject.value as any;
    imgObj.set('flipX', !imgObj.flipX);

    props.canvasManager?.canvas.renderAll();
};

// 垂直翻转
const flipVertical = () => {
    if (!targetObject.value) return;

    const imgObj = targetObject.value as any;
    imgObj.set('flipY', !imgObj.flipY);

    props.canvasManager?.canvas.renderAll();
};

// 替换图片
const replaceImage = () => {
    EventBus.emit(EventTypes.CONTROL_PANEL.OPEN, {
        type: EventTypes.PANEL_TYPE.INSERT_IMAGE,
        action: EventTypes.PANEL_ACTION.REPLACE_IMAGE,
        canvas: props.canvasManager?.canvas,
        canvasManager: props.canvasManager,
        target: targetObject.value,
        position: null
    });
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

    nextTick(() => {
        // 获取工具栏元素和屏幕尺寸
        const toolbarEl = document.querySelector('.image-format-toolbar') as HTMLElement;
        const toolbarWidth = toolbarEl ? toolbarEl.offsetWidth : 300;
        const toolbarHeight = toolbarEl ? toolbarEl.offsetHeight : 50;

        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // 将工具栏放在对象上方并水平居中
        let left = objLeft + (objWidth / 2) - (toolbarWidth / 2);
        let top = objTop - toolbarHeight - 15;

        // 确保工具栏在屏幕范围内
        left = Math.max(10, Math.min(left, screenWidth - toolbarWidth - 10));
        top = Math.max(10, Math.min(top, screenHeight - toolbarHeight - 10));

        // 设置位置
        position.value = { left, top };
    });

};

// 监听 panelData 变化
watch(() => props.panelData, (newData) => {
    if (newData && newData.target) {
        targetObject.value = newData.target;
        visible.value = true;
        isSvgImage.value = targetObject.value?.isSvg() || false;
        updateImageStyleState();
        calculatePosition();
    }
}, { immediate: true, deep: true });

// 点击其他地方关闭颜色选择器
onMounted(() => {
    document.addEventListener('click', (event) => {
        if (!showFillColorPicker.value && !showCornerRadiusPanel.value) return;

        const target = event.target as HTMLElement;
        if (!target.closest('.image-format-toolbar')) {
            showFillColorPicker.value = false;
            showCornerRadiusPanel.value = false;
        }
    });
});
</script>

<style scoped>
.image-format-toolbar {
    position: absolute;
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 8px;
    z-index: 1000;
    pointer-events: auto;
    display: inline-flex;
    user-select: none;
}

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

.filter-control {
    min-width: 80px;
}

.filter-control select {
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

.button-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.button-content i {
    margin-bottom: 4px;
}

.color-indicator {
    width: 20px;
    height: 4px;
    border-radius: 2px;
}

.fill-color-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}


.color-picker-position {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1001;
}


.color-preview {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    border: 1px solid #d9d9d9;
}

.opacity-control {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #595959;
}

.opacity-control input {
    width: 80px;
    margin: 0;
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

/* SVG 图标样式 */
.icon-image {
    width: 12px;
    height: 12px;
    display: block;
}

button.active .icon-image {
    filter: invert(45%) sepia(99%) saturate(1646%) hue-rotate(190deg) brightness(100%) contrast(91%);
}

.corner-radius-container {
    position: relative;
}

.corner-radius-panel {
    position: absolute;
    top: -180px;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 12px;
    z-index: 1001;
    width: 280px;
}

.corner-radius-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 10px;
    margin-bottom: 10px;
}

.corner-radius-item {
    display: flex;
    flex-direction: column;
    font-size: 12px;
}

.corner-radius-item label {
    margin-bottom: 4px;
    color: #595959;
}

.corner-radius-item span {
    font-size: 10px;
    color: #8c8c8c;
    margin-left: 4px;
    align-self: center;
}

.input-with-unit {
    display: flex;
    align-items: center;
    width: 100%;
}

.unit {
    font-size: 10px;
    color: #8c8c8c;
    margin-left: 4px;
}

.corner-input-number {
    flex: 1;
}

:deep(.n-button) {
    padding: 0 3px !important;
}


.corner-radius-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    gap: 10px;
}

.corner-button {
    flex: 1;
    min-width: 80px;
}

/* 覆盖 Naive UI 的默认样式 */
:deep(.n-button) {
    font-size: 12px;
    padding: 0 12px;
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
}

/* 响应式调整 */
@media (max-width: 768px) {
    .image-format-toolbar {
        flex-wrap: wrap;
        max-width: 300px;
    }

    .toolbar-buttons {
        flex-wrap: wrap;
    }
}
</style>
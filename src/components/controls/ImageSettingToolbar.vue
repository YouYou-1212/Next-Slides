<template>
    <div class="image-format-toolbar" :style="toolbarStyle" v-if="visible">
        <div class="toolbar-buttons">
            <!-- 图片滤镜选择 -->
            <div class="filter-control">
                <select v-model="imageFilter" @change="changeImageFilter">
                    <option v-for="filter in imageFilters" :key="filter.value" :value="filter.value">
                        {{ filter.label }}
                    </option>
                </select>
            </div>

            <div class="divider"></div>

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
            <button @click="toggleRoundCorners" :class="{ active: hasRoundCorners }" title="圆角">
                <n-icon size="17">
                    <RoundedCornerOutlined />
                </n-icon>
            </button>
            <!-- 圆角操作区 -->
            <div v-if="showCornerRadiusPanel" class="corner-radius-panel">
                <div class="corner-radius-grid">
                    <div class="corner-radius-item">
                        <label>左上角</label>
                        <div class="input-with-unit">
                            <n-input-number v-model:value="cornerRadius.topLeft" :min="0" :step="1" size="small"
                                @update:value="updateCornerRadius" class="corner-input-number" :default-value="0"
                                :key="`topLeft-${cornerRadius.topLeft}`" />
                            <span class="unit">px</span>
                        </div>
                    </div>
                    <div class="corner-radius-item">
                        <label>右上角</label>
                        <div class="input-with-unit">
                            <n-input-number v-model:value="cornerRadius.topRight" :min="0" :step="1" size="small"
                                @update:value="updateCornerRadius" class="corner-input-number" :default-value="0"
                                :key="`topRight-${cornerRadius.topRight}`" />
                            <span class="unit">px</span>
                        </div>
                    </div>
                    <div class="corner-radius-item">
                        <label>左下角</label>
                        <div class="input-with-unit">
                            <n-input-number v-model:value="cornerRadius.bottomLeft" :min="0" :step="1" size="small"
                                @update:value="updateCornerRadius" class="corner-input-number" :default-value="0"
                                :key="`bottomLeft-${cornerRadius.bottomLeft}`" />
                            <span class="unit">px</span>
                        </div>
                    </div>
                    <div class="corner-radius-item">
                        <label>右下角</label>
                        <div class="input-with-unit">
                            <n-input-number v-model:value="cornerRadius.bottomRight" :min="0" :step="1" size="small"
                                @update:value="updateCornerRadius" class="corner-input-number" :default-value="0"
                                :key="`bottomRight-${cornerRadius.bottomRight}`" />
                            <span class="unit">px</span>
                        </div>
                    </div>
                </div>
                <div class="corner-radius-actions">
                    <n-button size="small" type="primary" @click="applyUniformRadius"
                        class="corner-button">统一圆角</n-button>
                    <n-button size="small" @click="resetCornerRadius" class="corner-button">重置</n-button>
                </div>
            </div>

            <div class="divider"></div>

            <!-- 图片透明度控制 -->
            <div class="opacity-control">
                <span>透明度:</span>
                <input type="range" min="0" max="1" step="0.1" v-model="opacity" @input="changeOpacity" />
                <span>{{ Math.round(opacity * 100) }}%</span>
            </div>

            <div class="divider"></div>

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
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import * as fabric from 'fabric';
import { EventBus, EventTypes } from '../../utils/EventBus';
import ColorPicker from './ColorPicker.vue';

import { RoundedCornerOutlined } from '@vicons/material'

const props = defineProps<{
    canvasManager?: any;
    panelData?: any;
}>();

const visible = ref(false);
const targetObject = ref<fabric.Object | null>(null);
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
    showFillColorPicker.value = !showFillColorPicker.value;
};


// 设置填充颜色
const setFillColor = (color: string, opacity: number = 0.3) => {
    if (!targetObject.value) return;

    const imgObj = targetObject.value as any;
    imgObj.setFillColor(color, opacity);
    fillColor.value = color;

    props.canvasManager?.canvas.requestRenderAll();
};


// 更新图片样式状态
const updateImageStyleState = () => {
    if (!targetObject.value) return;

    const imgObj = targetObject.value as any;

    // 获取当前滤镜
    imageFilter.value = getAppliedFilter(imgObj) || 'none';

    // 获取边框状态
    // hasBorder.value = !!imgObj.strokeWidth && imgObj.strokeWidth > 0;
    // borderColor.value = imgObj.stroke || '#000000';

    // 获取填充颜色状态
    // hasFillColor.value = !!imgObj.fill;
    // fillColor.value = imgObj.fill || '#FFFFFF';
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
    syncHasRoundCorners(imgObj);

    // 获取透明度
    opacity.value = imgObj.opacity !== undefined ? imgObj.opacity : 1;
};

const syncHasRoundCorners = (imgObj: any) => {
    const cornerRadiusValues = imgObj.getCornerRadius ? imgObj.getCornerRadius() : { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
    hasRoundCorners.value = Object.values(cornerRadiusValues).some((radius) => (radius as number) > 0);
}

// 获取应用的滤镜
const getAppliedFilter = (obj: any) => {
    if (!obj.filters || obj.filters.length === 0) return 'none';

    // 根据滤镜类型返回对应的值
    const filter = obj.filters[0];
    if (!filter) return 'none';

    if (filter instanceof fabric.filters.Grayscale) return 'grayscale';
    if (filter instanceof fabric.filters.Sepia) return 'sepia';
    if (filter instanceof fabric.filters.Invert) return 'invert';
    if (filter instanceof fabric.filters.Blur) return 'blur';
    if (filter instanceof fabric.filters.Convolute && filter.matrix) return 'sharpen';
    return 'none';
};

// 更改图片滤镜
const changeImageFilter = () => {
    if (!targetObject.value) return;

    const imgObj = targetObject.value as fabric.Image;
    const filters: any[] = [];

    // 根据选择的滤镜类型添加对应的滤镜
    switch (imageFilter.value) {
        case 'grayscale':
            filters.push(new fabric.filters.Grayscale());
            break;
        case 'sepia':
            filters.push(new fabric.filters.Sepia());
            break;
        case 'invert':
            filters.push(new fabric.filters.Invert());
            break;
        case 'blur':
            filters.push(new fabric.filters.Blur({ blur: 0.25 }));
            break;
        case 'sharpen':
            filters.push(new fabric.filters.Convolute({
                matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0]
            }));
            break;
        default:
            // 无滤镜
            break;
    }

    // 应用滤镜
    imgObj.filters = filters;
    imgObj.applyFilters();
    props.canvasManager?.canvas.renderAll();
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

// 更新圆角半径
const updateCornerRadius = () => {
    if (!targetObject.value) return;
    const imgObj = targetObject.value as any;
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


// 增加圆角值
const incrementRadius = (corner: keyof typeof cornerRadius.value) => {
    if (cornerRadius.value[corner] < 100) {
        cornerRadius.value[corner] += 1;
        updateCornerRadius();
    }
};

// 减少圆角值
const decrementRadius = (corner: keyof typeof cornerRadius.value) => {
    if (cornerRadius.value[corner] > 0) {
        cornerRadius.value[corner] -= 1;
        updateCornerRadius();
    }
};


// 切换圆角
const toggleRoundCorners = () => {
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

// 开始裁剪
const startCrop = () => {
    // 实现裁剪功能
    console.log('开始裁剪图片');
    // 这里需要实现裁剪逻辑
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

    // 获取工具栏元素和屏幕尺寸
    const toolbarEl = document.querySelector('.image-format-toolbar') as HTMLElement;
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

// 监听 panelData 变化
watch(() => props.panelData, (newData) => {
    if (newData && newData.target) {
        targetObject.value = newData.target;
        visible.value = true;
        updateImageStyleState();
        calculatePosition();
    }
}, { immediate: true });

// 点击其他地方关闭颜色选择器
onMounted(() => {
    // document.addEventListener('click', (e) => {
    //     if (showBorderColorPicker.value &&
    //         !e.composedPath().some(el => (el as HTMLElement).classList?.contains('color-selector'))) {
    //         showBorderColorPicker.value = false;
    //     }
    // });
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
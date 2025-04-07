<template>
    <CommonSettingToolbar :toolbarPosition="toolbarPosition">
        <!-- 图片滤镜选择 -->
        <div class="filter-control" v-if="!isSvgImage">
            <select v-model="imageFilter"
                @change="(e: Event) => handleChangeImageFilter((e.target as HTMLSelectElement).value)">
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
        <div v-if="showCornerRadiusPanel && !isSvgImage" class="corner-radius-panel" @click.stop>
            <div class="corner-radius-grid">
                <div class="corner-radius-item">
                    <label>左上角</label>
                    <div class="input-with-unit">
                        <n-input-number v-model:value="cornerRadius.topLeft" :min="0" :step="1" size="small"
                            @update:value="updateCornerRadiusDebounced('topLeft', $event)" class="corner-input-number"
                            :default-value="0" />
                        <span class="unit">px</span>
                    </div>
                </div>
                <div class="corner-radius-item">
                    <label>右上角</label>
                    <div class="input-with-unit">
                        <n-input-number v-model:value="cornerRadius.topRight" :min="0" :step="1" size="small"
                            @update:value="updateCornerRadiusDebounced('topRight', $event)" class="corner-input-number"
                            :default-value="0" />
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
                <n-button size="small" type="primary" @click.stop="handleApplyUniformRadius"
                    class="corner-button">统一圆角</n-button>
                <n-button size="small" @click.stop="handleResetCornerRadius" class="corner-button">重置</n-button>
            </div>
        </div>

        <div class="divider" v-if="!isSvgImage"></div>

        <!-- 图片透明度控制 -->
        <div class="opacity-control" v-if="!isSvgImage">
            <span>透明度:</span>
            <input type="range" min="0" max="1" step="0.1"
                @input="(e) => handleChangeOpacity(parseFloat((e.target as HTMLInputElement).value))" />
            <span>{{ Math.round(opacity * 100) }}%</span>
        </div>

        <div class="divider" v-if="!isSvgImage"></div>

        <!-- 图片翻转控制 -->
        <button @click="handleFlipHorizontal" title="水平翻转">
            <i class="fas fa-arrows-alt-h"></i>
        </button>
        <button @click="handleFlipVertical" title="垂直翻转">
            <i class="fas fa-arrows-alt-v"></i>
        </button>

        <div class="divider"></div>

        <!-- 图片替换按钮 -->
        <button @click="handleReplaceImage" title="替换图片">
            <i class="fas fa-exchange-alt"></i>
        </button>

        <!-- 允许用户在这里添加自定义组件 -->
        <slot name="custom-controls"></slot>
    </CommonSettingToolbar>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import CommonSettingToolbar from './CommonSettingToolbar.vue';
import { useImageSettingToolsHandle } from '../../../composables/menu/setting-tools/ImageSettingToolsHandle';
import ColorPicker from '../../common/ColorPicker.vue';
import { RoundedCornerOutlined } from '@vicons/material'

const props = defineProps<{
    canvasManager?: any;
    panelData?: any;
}>();

const showFillColorPicker = ref(false);
const showCornerRadiusPanel = ref(false);



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


const {
    imageSettingToolsHandle,
    imageSettingToolbarVisible,
    imageSettingToolbarData,
    toolbarPosition,
    imageFilter,
    hasFillColor,
    fillColor,
    fillOpacity,
    hasRoundCorners,
    cornerRadius,
    opacity,
    isSvgImage,
    targetObject
} = useImageSettingToolsHandle(props.canvasManager);


const imageFilters = [
    { label: '无滤镜', value: 'none' },
    { label: '灰度', value: 'grayscale' },
    { label: '复古', value: 'sepia' },
    { label: '反色', value: 'invert' },
    { label: '模糊', value: 'blur' },
    { label: '锐化', value: 'sharpen' },
];










const visible = computed(() => imageSettingToolbarVisible.value);


const handleFillColorSelect = (color: string, opacity: number) => {
    if (imageSettingToolsHandle.value) {
        imageSettingToolsHandle.value.setFillColor(color, opacity);
    }
    showFillColorPicker.value = false;
};


const showColorPickerDirectly = () => {
    showCornerRadiusPanel.value = false;
    
    showFillColorPicker.value = !showFillColorPicker.value;
    
};


const handleChangeImageFilter = (filterValue: string) => {
    if (imageSettingToolsHandle.value) {
        imageSettingToolsHandle.value.applyFilter(filterValue);
    }
};


const toggleCornerRadiusPanel = () => {
    showCornerRadiusPanel.value = !showCornerRadiusPanel.value;
};


const toggleRoundCorners = (event: MouseEvent) => {
    event.stopPropagation(); 
    showFillColorPicker.value = false;
    toggleCornerRadiusPanel();
};


const updateCornerRadiusDebounced = debounce((corner: string, value: number) => {
    if (imageSettingToolsHandle.value) {
        const updatedCornerRadius = { ...cornerRadius.value };
        updatedCornerRadius[corner as keyof typeof cornerRadius.value] = value;
        imageSettingToolsHandle.value.setCornerRadius(updatedCornerRadius);
    }
}, 100);


const handleApplyUniformRadius = () => {
    if (imageSettingToolsHandle.value) {
        imageSettingToolsHandle.value.applyUniformRadius();
    }
};


const handleResetCornerRadius = () => {
    if (imageSettingToolsHandle.value) {
        imageSettingToolsHandle.value.resetCornerRadius();
    }
};


const handleChangeOpacity = (value: number) => {
    if (imageSettingToolsHandle.value) {
        imageSettingToolsHandle.value.setOpacity(value);
    }
};


const handleFlipHorizontal = () => {
    if (imageSettingToolsHandle.value) {
        imageSettingToolsHandle.value.flipHorizontal();
    }
};


const handleFlipVertical = () => {
    if (imageSettingToolsHandle.value) {
        imageSettingToolsHandle.value.flipVertical();
    }
};


const handleReplaceImage = () => {
    if (imageSettingToolsHandle.value) {
        imageSettingToolsHandle.value.replaceImage();
    }
};


watch(() => props.panelData, (newData) => {
    if (newData && newData.target) {
        
        if (imageSettingToolsHandle.value) {
            imageSettingToolsHandle.value.syncDataAndVisible(newData, true);
        }
    }
}, { immediate: true, deep: true });


onMounted(() => {
    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        
        const isColorPickerClick = target.closest('.fill-color-container');
        
        if (!isColorPickerClick) {
            showFillColorPicker.value = false;
        }
        
        
        const isCornerPanelClick = target.closest('.corner-radius-panel');
        if (!isCornerPanelClick) {
            showCornerRadiusPanel.value = false;
        }
    });
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


i.fas {
    font-size: 12px;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}


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


:deep(.n-button) {
    font-size: 12px;
    padding: 0 12px;
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
<template>
    <div class="color-picker-panel">
        <div class="color-category">
            <div class="category-title">渐变柔和风</div>
            <div class="color-options">
                <div v-for="color in ColorUtils.GRADIENT_COLORS" :key="color" class="color-option"
                    :style="{ backgroundColor: color }" @click="selectColor(color)"></div>
            </div>
        </div>

        <div class="color-category">
            <div class="category-title">扁平UI色</div>
            <div class="color-options">
                <div v-for="color in ColorUtils.FLAT_UI_COLORS.slice(0, 10)" :key="color" class="color-option"
                    :style="{ backgroundColor: color }" @click="selectColor(color)"></div>
            </div>
        </div>

        <div class="color-category">
            <div class="category-title">中国传统色</div>
            <div class="color-options">
                <div v-for="color in ColorUtils.TRADITIONAL_CHINESE_COLORS.slice(0, 10)" :key="color"
                    class="color-option" :style="{ backgroundColor: color }" @click="selectColor(color)"></div>
            </div>
        </div>

        <div class="color-category">
            <div class="category-title">基础色</div>
            <div class="color-options">
                <div class="color-option" style="background-color: #000000" @click="selectColor('#000000')"></div>
                <div class="color-option" style="background-color: #FFFFFF" @click="selectColor('#FFFFFF')"></div>
                <div class="color-option transparent" @click="selectColor('transparent')"></div>
            </div>
        </div>

        <!-- 自定义颜色选择器 -->
        <div class="color-category">
            <div class="category-title">自定义颜色</div>
            <div class="custom-color-picker">
                <div class="color-input-group">
                    <input type="color" ref="colorPickerInput"
                        :value="currentColor === 'transparent' ? '#000000' : currentColor" @input="onColorPickerChange"
                        class="color-input">
                    <input type="text" v-model="customColorText" @input="onColorTextChange" @blur="validateColorText"
                        class="color-text-input" placeholder="#RRGGBB">
                </div>
               
            </div>
        </div>
        <!-- 透明度设置 -->
        <div class="color-category">
            <div class="category-title">透明度</div>
            <div class="opacity-control">
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    v-model="currentOpacity" 
                    @input="updateOpacity"
                    class="opacity-slider"
                />
                <div class="opacity-value">{{ Math.round(currentOpacity * 100) }}%</div>
            </div>
        </div>

        <button class="apply-color-btn" @click="applyCustomColor">应用</button>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { ColorUtils } from '../../utils/ColorUtils';

const props = defineProps<{
    color: string;
    opacity?: number;
}>();

const emit = defineEmits<{
    (e: 'update:color', color: string): void;
    (e: 'update:opacity', opacity: number): void;
    (e: 'select', color: string, opacity: number): void;
}>();

const currentColor = ref(props.color);
const currentOpacity = ref(props.opacity ?? 1);
const customColorText = ref(props.color === 'transparent' ? '' : props.color);
const colorPickerInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
    if (colorPickerInput.value && currentColor.value !== 'transparent') {
        colorPickerInput.value.value = currentColor.value;
    }
});


watch(() => props.color, (newColor) => {
    currentColor.value = newColor;
    customColorText.value = newColor === 'transparent' ? '' : newColor;
});


watch(() => props.opacity, (newOpacity) => {
    if (newOpacity !== undefined) {
        currentOpacity.value = newOpacity;
    }
}, { immediate: true });


const updateOpacity = () => {
    emit('update:opacity', currentOpacity.value);
};


const selectColor = (color: string) => {
    currentColor.value = color;
    customColorText.value = color === 'transparent' ? '' : color;
    emit('update:color', color);
    
    emit('select', color, currentOpacity.value);
};


const onColorPickerChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    customColorText.value = input.value;

    
    currentColor.value = input.value;
    emit('update:color', input.value);
};


const onColorTextChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    
    if (/^#[0-9A-F]{6}$/i.test(input.value)) {
        if (colorPickerInput.value) {
            colorPickerInput.value.value = input.value;
        }
    }
};


const validateColorText = () => {
    
    if (!customColorText.value || !/^#[0-9A-F]{6}$/i.test(customColorText.value)) {
        customColorText.value = currentColor.value === 'transparent' ? '#000000' : currentColor.value;
    }
};


const applyCustomColor = () => {
    if (/^#[0-9A-F]{6}$/i.test(customColorText.value)) {
        selectColor(customColorText.value);
    }
};
</script>

<style scoped>
.color-picker-panel {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 10px;
    margin-top: 4px;
    z-index: 1001;
    width: 220px;
}

.color-category {
    margin-bottom: 8px;
}

.category-title {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
}

.color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.color-option {
    width: 18px;
    height: 18px;
    border-radius: 2px;
    cursor: pointer;
    border: 1px solid #d9d9d9;
}

.color-option:hover {
    transform: scale(1.1);
    border-color: #1890ff;
}

.color-option.transparent {
    background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc),
        linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc);
    background-size: 8px 8px;
    background-position: 0 0, 4px 4px;
}

.custom-color-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
}

.color-input-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.color-input {
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    cursor: pointer;
}

.color-text-input {
    flex: 1;
    height: 28px;
    border: 1px solid #d9d9d9;
    border-radius: 2px;
    padding: 0 8px;
    font-size: 12px;
}

.apply-color-btn {
    width: 100%;
    height: 28px;
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.apply-color-btn:hover {
    background-color: #40a9ff;
}

.opacity-control {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
}

.opacity-slider {
    flex: 1;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: linear-gradient(to right, rgba(255, 255, 255, 0), currentColor);
    border-radius: 3px;
    outline: none;
}

.opacity-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #1890ff;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

.opacity-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #1890ff;
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}

.opacity-value {
    width: 40px;
    font-size: 12px;
    color: #666;
    text-align: right;
}
</style>
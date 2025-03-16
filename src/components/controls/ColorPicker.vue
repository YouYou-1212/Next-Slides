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
                <button class="apply-color-btn" @click="applyCustomColor">应用</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { ColorUtils } from '../../utils/ColorUtils';

const props = defineProps<{
    color: string;
}>();

const emit = defineEmits<{
    (e: 'update:color', color: string): void;
    (e: 'select', color: string): void;
}>();

const currentColor = ref(props.color);
const customColorText = ref(props.color === 'transparent' ? '' : props.color);
const colorPickerInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
    if (colorPickerInput.value && currentColor.value !== 'transparent') {
        colorPickerInput.value.value = currentColor.value;
    }
});

// 监听颜色变化
watch(() => props.color, (newColor) => {
    currentColor.value = newColor;
    customColorText.value = newColor === 'transparent' ? '' : newColor;
});

// 选择颜色
const selectColor = (color: string) => {
    currentColor.value = color;
    customColorText.value = color === 'transparent' ? '' : color;
    emit('update:color', color);
    emit('select', color);
};

// 颜色选择器变化事件
const onColorPickerChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    customColorText.value = input.value;

    // 实时预览颜色，但不立即应用
    currentColor.value = input.value;
    emit('update:color', input.value);
};

// 颜色文本输入变化事件
const onColorTextChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    // 如果输入的是有效的颜色格式，则同步到颜色选择器
    if (/^#[0-9A-F]{6}$/i.test(input.value)) {
        if (colorPickerInput.value) {
            colorPickerInput.value.value = input.value;
        }
    }
};

// 验证颜色文本
const validateColorText = () => {
    // 如果为空或不是有效的颜色格式，则重置为当前颜色
    if (!customColorText.value || !/^#[0-9A-F]{6}$/i.test(customColorText.value)) {
        customColorText.value = currentColor.value === 'transparent' ? '#000000' : currentColor.value;
    }
};

// 应用自定义颜色
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
</style>
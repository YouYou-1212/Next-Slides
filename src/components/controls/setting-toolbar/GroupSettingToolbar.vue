<template>
    <!-- 当组内全部为文本组件时 -->
    <TextSettingToolbar v-if="isAllText" :canvasManager="canvasManager" :panelData="panelData">
        <template #custom-controls>
            <div class="divider"></div>
            <!-- 分组/取消分组按钮 -->
            <button v-if="isActiveSelection" @click="handleCreateGroup" title="创建分组">
                <i class="fas fa-object-group"></i>
            </button>
            <button v-else @click="handleUngroup" title="取消分组">
                <i class="fas fa-object-ungroup"></i>
            </button>
        </template>
    </TextSettingToolbar>

    <!-- 当组内全部为图片组件时 -->
    <ImageSettingToolbar v-else-if="isAllImage" :canvasManager="canvasManager" :panelData="panelData">
        <template #custom-controls>
            <div class="divider"></div>
            <!-- 分组/取消分组按钮 -->
            <button v-if="isActiveSelection" @click="handleCreateGroup" title="创建分组">
                <i class="fas fa-object-group"></i>
            </button>
            <button v-else @click="handleUngroup" title="取消分组">
                <i class="fas fa-object-ungroup"></i>
            </button>
        </template>
    </ImageSettingToolbar>

    <!-- 当有多种不同组件时 -->
    <CommonSettingToolbar v-else :toolbarPosition="toolbarPosition">
        <!-- 分组/取消分组按钮 -->
        <button v-if="isActiveSelection" @click="handleCreateGroup" title="创建分组">
            <i class="fas fa-object-group"></i>
        </button>
        <button v-else @click="handleUngroup" title="取消分组">
            <i class="fas fa-object-ungroup"></i>
        </button>
    </CommonSettingToolbar>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import CommonSettingToolbar from './CommonSettingToolbar.vue';
import TextSettingToolbar from './TextSettingToolbar.vue';
import ImageSettingToolbar from './ImageSettingToolbar.vue';
import ColorPicker from '../../common/ColorPicker.vue';
import { useGroupSettingToolsHandle } from '../../../composables/menu/setting-tools/GroupSettingToolsHandle';
import { useTextSettingToolsHandle } from '../../../composables/menu/setting-tools/TextSettingToolsHandle';

const props = defineProps<{
    canvasManager?: any;
    panelData?: any;
}>();


const {
    groupSettingToolsHandle,
    groupSettingToolbarVisible,
    groupSettingToolbarData,
    toolbarPosition,
    isAllText,
    isAllImage,
    isActiveSelection,
    targetObject,
    visible
} = useGroupSettingToolsHandle(props.canvasManager);



const handleCreateGroup = () => {
    if (groupSettingToolsHandle.value) {
        groupSettingToolsHandle.value.createGroup();
    }
};


const handleUngroup = () => {
    if (groupSettingToolsHandle.value) {
        groupSettingToolsHandle.value.ungroup();
    }
};


watch(() => props.panelData, (newData) => {
    if (newData && newData.target) {
        
        if (groupSettingToolsHandle.value) {
            groupSettingToolsHandle.value.syncDataAndVisible(newData, true);
        }
    }
}, { immediate: true, deep: true });

onMounted(() => {
    
    
    
    
    
    
    
    
    
});
</script>

<style scoped>
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

.font-family-control select,
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

.color-preview {
    width: 14px;
    height: 14px;
    border-radius: 2px;
    border: 1px solid #d9d9d9;
}

.fill-color-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.color-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid white;
}

.color-picker-position {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1001;
}
</style>
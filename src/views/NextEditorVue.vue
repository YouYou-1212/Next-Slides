<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, shallowRef, onUnmounted } from "vue";
import Toolbar from "../components/layout/Toolbar.vue";
import Sidebar from "../components/layout/Sidebar.vue";
import BaseCanvas from "../components/layout/BaseCanvas.vue";
import ControlPanel from "../components/layout/ControlPanel.vue";
import BottomControlToolbar from "../components/controls/BottomControlToolbar.vue";
import TextSettingToolbar from "../components/controls/setting-toolbar/TextSettingToolbar.vue";
import ImageSettingToolbar from "../components/controls/setting-toolbar/ImageSettingToolbar.vue";
import GroupSettingToolbar from "../components/controls/setting-toolbar/GroupSettingToolbar.vue";
import { useTextSettingToolsHandle } from "../composables/menu/setting-tools/TextSettingToolsHandle";
import { useImageSettingToolsHandle } from "../composables/menu/setting-tools/ImageSettingToolsHandle";
import { EventBus, EventTypes } from "../utils/EventBus";
import { useGroupSettingToolsHandle } from "../composables/menu/setting-tools/GroupSettingToolsHandle";






const emit = defineEmits<{
    (e: "update:controlPanelCollapsed", value: boolean): void;
}>();


const canvasReady = ref(false);

const canvasRef = ref<any>(null);
const sidebarCollapsed = ref(false);
const controlPanelCollapsed = ref(false);

const showControlPanel = ref(false); 

const controlPanelData = ref<any>(null);


const managerInstance = shallowRef<any>(null);



const selectedFrame = computed(() => canvasRef.value?.selectedFrame);
const selectedPage = computed(() => canvasRef.value?.selectedPage);

const canvasManager = computed(() => {
    if (!canvasReady.value) {
        console.log("Canvas 尚未准备就绪，canvasManager 不可用");
        return null;
    }

    if (!managerInstance.value) {
        managerInstance.value = canvasRef.value?.canvasManager;
        console.log("NextEditor computed canvasManager:", {
            manager: managerInstance.value,
            hasCanvas: managerInstance.value?.canvas != null,
        });
    }

    return managerInstance.value;
});


const { textSettingToolbarVisible, textSettingToolbarData } =
    useTextSettingToolsHandle(canvasManager);
const { imageSettingToolbarVisible, imageSettingToolbarData } =
    useImageSettingToolsHandle(canvasManager);
const { groupSettingToolbarVisible, groupSettingToolbarData } =
    useGroupSettingToolsHandle(canvasManager);


const updateControlPanelCollapsed = (value: boolean) => {
    controlPanelCollapsed.value = value;
};


const handleControlPanelCollapsedChange = (value: boolean) => {
    controlPanelCollapsed.value = value;
    emit("update:controlPanelCollapsed", value);
};


watch(canvasManager, (newManager) => {
    console.log("NextEditor canvasManager 初始化完成！", newManager)
    if (newManager && newManager.canvas) {
        nextTick(() => {
            canvasReady.value = true;
        });
    }
}, { immediate: true });


const handleCanvasReady = async () => {
    
    await nextTick();

    if (canvasRef.value && canvasRef.value.canvasManager) {
        managerInstance.value = canvasRef.value.canvasManager;
        canvasReady.value = true;
        
    } else {
        
        console.warn("Canvas 已发出就绪事件，但 canvasManager 尚未可用");
        
        setTimeout(checkCanvasManager, 100);
    }
};


const checkCanvasManager = () => {
    if (canvasRef.value && canvasRef.value.canvasManager) {
        managerInstance.value = canvasRef.value.canvasManager;
        canvasReady.value = true;
        
    } else {
        console.warn("延迟检查：canvasManager 仍未初始化");
    }
};



const handleControlPanelOpen = (data: any) => {
    
    controlPanelData.value = data;
    
    showControlPanel.value = true;
    
    setTimeout(() => {
        controlPanelCollapsed.value = false;
    }, 0);
};



onMounted(async () => {
    console.log("NextEditor 组件已挂载，等待 Canvas 准备就绪");
});


onMounted(() => {
    
    EventBus.on(EventTypes.CONTROL_PANEL.OPEN, handleControlPanelOpen);
});

onUnmounted(() => {
    
    EventBus.off(EventTypes.CONTROL_PANEL.OPEN, handleControlPanelOpen);
});



watch(controlPanelCollapsed, (newValue) => {
    if (newValue === true) {
        
        setTimeout(() => {
            showControlPanel.value = false;
        }, 300);
    }
});

</script>

<template>
    <div class="editor">
        <div class="editor-toolbar" v-if="canvasReady">
            <Toolbar :canvas-manager="canvasManager" />
        </div>
        <div class="editor-main">
            <!-- Canvas 作为背景层 -->
            <div class="editor-workspace">
                <BaseCanvas ref="canvasRef" @canvas-ready="handleCanvasReady" />
            </div>
            <!-- 浮动面板层 -->
            <div class="floating-panels" v-if="canvasReady">
                <Sidebar v-model:collapsed="sidebarCollapsed" :canvas-manager="canvasManager"
                    :selected-frame="selectedFrame" :selected-page="selectedPage" />
                <!-- 直接传递数据给控制面板 -->
                <ControlPanel v-if="showControlPanel" v-model:collapsed="controlPanelCollapsed"
                    :panel-data="controlPanelData" @update:collapsed="handleControlPanelCollapsedChange" />

                <!-- 底部控制工具栏 -->
                <BottomControlToolbar :canvas-manager="canvasManager" />

                <!-- 右上角统计面板 -->
                <div class="canvas-stats">
                    <div class="stats-content">
                        <div class="stats-title">画布统计</div>
                        <div class="stats-item">
                            对象数量: {{ canvasManager?.canvas?.getObjects().length || 0 }}
                        </div>
                    </div>
                </div>


                <!-- 文本设置工具栏 -->
                <TextSettingToolbar v-if="textSettingToolbarVisible" :canvas-manager="canvasManager"
                    :panel-data="textSettingToolbarData" />
                <!-- 图片设置工具栏 -->
                <ImageSettingToolbar v-if="imageSettingToolbarVisible" :canvas-manager="canvasManager"
                    :panel-data="imageSettingToolbarData" />
                <!-- 组设置 -->
                <GroupSettingToolbar v-if="groupSettingToolbarVisible" :canvas-manager="canvasManager"
                    :panel-data="groupSettingToolbarData" />


            </div>

            <!-- 添加临时预览画布 -->
            <!-- <div class="temp-canvas-container">
        <canvas id="tempCanvas"></canvas>
      </div> -->
        </div>
    </div>
</template>

<style scoped>
.editor {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #f0f2f5;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
}

.editor-toolbar {
    height: 48px;
    background-color: #fff;
    border-bottom: 1px solid #e8e8e8;
    z-index: 100;
}

.editor-main {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.editor-workspace {
    width: 100%;
    height: 100%;
    z-index: 1;
    
}

.floating-panels {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 10;
    
}

.floating-panels :deep(.bottom-control-toolbar) {
    pointer-events: auto;
}

.canvas-stats {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 100px;
    height: 50px;
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    pointer-events: auto;
    padding: 16px;
}

.stats-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.stats-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
}

.stats-item {
    font-size: 14px;
    color: #666;
}
</style>
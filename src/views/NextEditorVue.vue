<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, shallowRef, onUnmounted } from "vue";
import Toolbar from "../components/layout/Toolbar.vue";
import Sidebar from "../components/layout/Sidebar.vue";
import BaseCanvas from "../components/layout/BaseCanvas.vue";
import ControlPanel from "../components/layout/ControlPanel.vue";
import BottomControlToolbar from "../components/controls/BottomControlToolbar.vue";
import TextSettingToolbar from "../components/controls/TextSettingToolbar.vue";
import ImageSettingToolbar from "../components/controls/ImageSettingToolbar.vue";
import { useSettingToolsHandle } from "../composables/menu/setting-tools/TextSettingToolsHandle";
import { useImageSettingToolsHandle } from "../composables/menu/setting-tools/ImageSettingToolsHandle";
import { EventBus, EventTypes } from "../utils/EventBus";

// const props = defineProps<{
//     controlPanelData: any;
//     showControlPanel: boolean;
// }>();

const emit = defineEmits<{
    (e: "update:controlPanelCollapsed", value: boolean): void;
}>();

// 控制浮动面板的渲染
const canvasReady = ref(false);

const canvasRef = ref<any>(null);
const sidebarCollapsed = ref(false);
const controlPanelCollapsed = ref(false);

const showControlPanel = ref(false); // 添加控制面板显示状态变量
// 添加控制面板数据
const controlPanelData = ref<any>(null);

// 使用 shallowRef 存储 canvasManager 实例，避免深度响应式带来的性能问题
const managerInstance = shallowRef<any>(null);


// 计算属性获取画布管理器和选中状态
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

// 使用设置工具处理器
const { textSettingToolbarVisible, textSettingToolbarData } =
    useSettingToolsHandle(canvasManager);
const { imageSettingToolbarVisible, imageSettingToolbarData } =
    useImageSettingToolsHandle(canvasManager);


const updateControlPanelCollapsed = (value: boolean) => {
    controlPanelCollapsed.value = value;
};

// 监听折叠状态变化
const handleControlPanelCollapsedChange = (value: boolean) => {
    controlPanelCollapsed.value = value;
    emit("update:controlPanelCollapsed", value);
};

// 监听 canvasManager 变化，当画布管理器可用时，标记 Canvas 已就绪
watch(canvasManager, (newManager) => {
    console.log("NextEditor canvasManager 初始化完成！", newManager)
    if (newManager && newManager.canvas) {
        nextTick(() => {
            canvasReady.value = true;
        });
    }
}, { immediate: true });

// 添加 Canvas 挂载完成的处理函数
const handleCanvasReady = async () => {
    console.log("Canvas 已发出就绪事件");
    await nextTick();

    if (canvasRef.value && canvasRef.value.canvasManager) {
        managerInstance.value = canvasRef.value.canvasManager;
        canvasReady.value = true;
        console.log("Canvas 已准备就绪，canvasManager 已缓存");
    } else {
        //基本不会出现该情况
        console.warn("Canvas 已发出就绪事件，但 canvasManager 尚未可用");
        // 添加延迟重试逻辑
        setTimeout(checkCanvasManager, 100);
    }
};

// 检查 canvasManager 是否已初始化
const checkCanvasManager = () => {
    if (canvasRef.value && canvasRef.value.canvasManager) {
        managerInstance.value = canvasRef.value.canvasManager;
        canvasReady.value = true;
        console.log("延迟检查：Canvas 已准备就绪，canvasManager 已缓存");
    } else {
        console.warn("延迟检查：canvasManager 仍未初始化");
    }
};


// 监听控制面板打开事件
const handleControlPanelOpen = (data: any) => {
    // 直接设置数据
    controlPanelData.value = data;
    // 先显示面板
    showControlPanel.value = true;
    // 延迟一帧后取消折叠状态，确保组件已渲染
    setTimeout(() => {
        controlPanelCollapsed.value = false;
    }, 0);
};


// 组件挂载后检查 Canvas 是否已就绪
onMounted(async () => {
    console.log("NextEditor 组件已挂载，等待 Canvas 准备就绪");
});


onMounted(() => {
    // 监听事件总线
    EventBus.on(EventTypes.CONTROL_PANEL.OPEN, handleControlPanelOpen);
});

onUnmounted(() => {
    // 移除事件监听
    EventBus.off(EventTypes.CONTROL_PANEL.OPEN, handleControlPanelOpen);
});


// 监听折叠状态变化
watch(controlPanelCollapsed, (newValue) => {
    if (newValue === true) {
        // 当面板折叠时，延迟隐藏组件
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

                <!-- 文本设置工具栏 -->
                <TextSettingToolbar v-if="textSettingToolbarVisible" :canvas-manager="canvasManager"
                    :panel-data="textSettingToolbarData" />
                <!-- 图片设置工具栏 -->
                <ImageSettingToolbar v-if="imageSettingToolbarVisible" :canvas-manager="canvasManager"
                    :panel-data="imageSettingToolbarData" />
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
    /*background-color: aquamarine; */
}

.floating-panels {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 10;
    /* 确保浮动面板在画布上方 */
}

.floating-panels :deep(.bottom-control-toolbar) {
    pointer-events: auto;
}
</style>
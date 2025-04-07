<template>
  <div class="setting-toolbar" :style="toolbarStyle">
    <div class="toolbar-buttons">
      <!-- AI助手按钮 -->
      <button @click="handleAskAI" :class="{ active: showAIPanel }" title="问问AI">
        <i class="fas fa-robot"></i>
      </button>
      
      <div class="divider"></div>

      <!-- 用户自定义内容插槽 -->
      <slot></slot>
    </div>

    <!-- AI面板 -->
    <div v-if="showAIPanel" class="ai-panel">
      <div class="ai-panel-header">
        <span>AI助手</span>
        <button @click="showAIPanel = false" class="close-button">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="ai-panel-content">
        <!-- AI交互界面 -->
        <textarea v-model="aiQuestion" placeholder="请描述你的需求..." class="ai-input"></textarea>
        <button @click="handleSubmitQuestion" class="submit-button">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  toolbarPosition: { top: number; left: number };
}>();


const showAIPanel = ref(false);
const aiQuestion = ref('');


const toolbarStyle = computed(() => {
  return {
    top: `${props.toolbarPosition.top}px`,
    left: `${props.toolbarPosition.left}px`
  };
});


const handleAskAI = () => {
  showAIPanel.value = !showAIPanel.value;
};

const handleSubmitQuestion = () => {
  
  
  aiQuestion.value = ''; 
};
</script>

<style scoped>
.setting-toolbar {
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


.ai-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 300px;
  z-index: 1001;
  max-width: calc(100vw - 32px);  
  box-sizing: border-box;  
}

.ai-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e8e8e8;
}

.close-button {
  width: 24px;
  height: 24px;
}

.ai-panel-content {
  padding: 12px;
  box-sizing: border-box;  
}

.ai-input {
  width: 100%;
  height: 80px;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  resize: none;
  margin-bottom: 8px;
  box-sizing: border-box;  
}

.submit-button {
  width: 100%;
  height: 32px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
}

.submit-button:hover {
  background-color: #40a9ff;
}
</style>
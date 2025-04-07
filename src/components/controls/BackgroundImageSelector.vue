<template>
  <div class="background-image-selector">
    <div class="info-text">
      <p>请选择一张图片作为背景</p>
      <p class="hint">支持 JPG、PNG、SVG 等常见图片格式</p>
    </div>
    <button class="select-button" @click="handleSelectImage">
      选择图片
    </button>
    <!-- 隐藏的文件输入框 -->
    <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="onFileSelected" />
    
    <!-- 图片列表区域 -->
    <div class="image-list-container">
      <h3 class="section-title">在线图片</h3>
      <div class="image-grid">
        <div 
          v-for="(image, index) in imageList" 
          :key="index" 
          class="image-item"
          @click="setBackgroundFromUrl(image.url)"
        >
          <img :src="image.thumbnail" :alt="`图片 ${index + 1}`" class="thumbnail" />
        </div>
      </div>
      <div class="load-more-container" v-if="!isLoading">
        <button class="load-more-button" @click="loadMoreImages">加载更多</button>
      </div>
      <div class="loading-indicator" v-if="isLoading">
        <span>加载中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as fabric from 'fabric';
import { setBackgroundImageByUrl } from '../../utils/CanvasUtils';

const props = defineProps<{
  canvas: fabric.Canvas;
  target: any;
  position: any;
}>();

defineEmits<{
  (e: 'select-image'): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const imageList = ref<{ url: string; thumbnail: string; author: string }[]>([]);
const page = ref(1);
const isLoading = ref(false);
const limit = 50; 
const imageHeight = 1200; 
const imageWidth = 2133; 
const thumbnailSize = 300; 


const handleSelectImage = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};


const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    
    const objectUrl = URL.createObjectURL(file);
    const canvas = props.canvas;
    if (!canvas) {
      
      URL.revokeObjectURL(objectUrl);
      return;
    }
    
    
    setBackgroundImageByUrl(canvas, objectUrl);

    
    input.value = '';
  }
};


const loadImages = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  try {
    
    const response = await fetch(`https://picsum.photos/v2/list?page=${page.value}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    
    const newImages = data.map((item: any) => {
      
      const id = item.id;
      
      const imageUrl = `https://picsum.photos/id/${id}/${imageWidth}/${imageHeight}`;
      const thumbnailUrl = `https://picsum.photos/id/${id}/${thumbnailSize}/${thumbnailSize}`;
      
      return {
        url: imageUrl,
        thumbnail: thumbnailUrl,
        author: item.author || '未知作者'
      };
    });
    
    
    imageList.value = [...imageList.value, ...newImages];
    page.value++;
  } catch (error) {
    console.error('加载图片失败:', error);
  } finally {
    isLoading.value = false;
  }
};


const loadMoreImages = () => {
  loadImages();
};


const setBackgroundFromUrl = (url: string) => {
  if (!props.canvas) return;
  setBackgroundImageByUrl(props.canvas, url);
};


onMounted(() => {
  loadImages();
});
</script>

<style scoped>
.background-image-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  width: 100%;
}

.info-text {
  text-align: center;
  margin-bottom: 20px;
}

.hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.select-button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 20px;
}

.select-button:hover {
  background-color: #40a9ff;
}


.image-list-container {
  width: 100%;
  margin-top: 20px;
}

.section-title {
  font-size: 16px;
  margin-bottom: 12px;
  color: #333;
  text-align: left;
  width: 100%;
  padding-left: 10px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.image-item:hover {
  transform: scale(1.05);
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  width: 100%;
}

.load-more-button {
  padding: 8px 16px;
  background-color: #f0f2f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.load-more-button:hover {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  color: #999;
}
</style>
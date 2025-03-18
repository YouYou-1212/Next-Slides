<template>
  <div class="insert-image-selector">
    <div class="info-text">
      <p>请选择图片插入到画布中</p>
      <p class="hint">支持 JPG、PNG、SVG 等常见图片格式</p>
    </div>
    <button class="select-button" @click="handleSelectImage">
      选择本地图片
    </button>
    <!-- 隐藏的文件输入框 -->
    <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="onFileSelected" />


    <!-- 系统资源区域 -->
    <div class="image-list-container">
      <h3 class="section-title">系统资源</h3>
      <div class="image-grid">
        <div v-for="(image, index) in systemImages" :key="index" class="image-item"
          @click="insertImageFromUrl(image.url)">
          <img :src="image.url" :alt="`系统图片 ${index + 1}`" class="thumbnail" />
        </div>
      </div>
    </div>


    <!-- 在线资源 图片列表区域 -->
    <div class="image-list-container">
      <h3 class="section-title">在线图片</h3>
      <div class="image-grid">
        <div v-for="(image, index) in imageList" :key="index" class="image-item" @click="insertImageFromUrl(image.url)">
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
import { ref, onMounted, markRaw } from 'vue';
import * as fabric from 'fabric';
import type { CanvasManager } from '../../composables/canvas/CanvasManager';

// 添加系统资源列表
const systemImages = ref<{ url: string }[]>([]);

const props = defineProps<{
  canvas: fabric.Canvas;
  canvasManager: CanvasManager;
  target: any;
  position: any;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const imageList = ref<{ url: string; thumbnail: string; author: string }[]>([]);
const page = ref(1);
const isLoading = ref(false);
const limit = 50; // 每页加载的图片数量
const imageSize = 1200; // 图片尺寸
const thumbnailSize = 300; // 缩略图尺寸

// 处理图片选择按钮点击
const handleSelectImage = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

// 处理文件选择
const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    // 使用 URL.createObjectURL 创建本地URL
    const objectUrl = URL.createObjectURL(file);
    console.log("文件选择器选择的内容为：", props.canvasManager, objectUrl);
    props.canvasManager.getControlsManager().addImage(objectUrl);
    input.value = '';
  }
};

// 加载系统资源
const loadSystemImages = async () => {
  try {
    // 使用import.meta.glob导入所有SVG文件
    const svgContext = import.meta.glob('/public/svg/*.svg', { eager: true });
    console.log("svgContext", svgContext);
    const images = Object.entries(svgContext).map(([path, module]: [string, any]) => ({
      url: module.default,
    }));
    console.log("svgContext images", images);
    
    systemImages.value = images;
  } catch (error) {
    console.error('加载系统资源失败:', error);
  }
};

// 从Picsum Photos加载图片
const loadImages = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  try {
    // 使用Picsum Photos的列表API获取图片数据
    const response = await fetch(`https://picsum.photos/v2/list?page=${page.value}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 处理返回的图片数据
    const newImages = data.map((item: any) => {
      // 从download_url中提取图片ID
      const id = item.id;
      // 构建高分辨率图片URL和缩略图URL
      const imageUrl = `https://picsum.photos/id/${id}/${imageSize}/${imageSize}`;
      const thumbnailUrl = `https://picsum.photos/id/${id}/${thumbnailSize}/${thumbnailSize}`;

      return {
        url: imageUrl,
        thumbnail: thumbnailUrl,
        author: item.author || '未知作者'
      };
    });

    // 添加到图片列表
    imageList.value = [...imageList.value, ...newImages];
    page.value++;
  } catch (error) {
    console.error('加载图片失败:', error);
  } finally {
    isLoading.value = false;
  }
};

// 加载更多图片
const loadMoreImages = () => {
  loadImages();
};

// 从URL插入图片
const insertImageFromUrl = (url: string) => {
  if (!props.canvasManager) return;
  props.canvasManager.getControlsManager().addImage(url);
};

// 组件挂载时加载初始图片
onMounted(() => {
  loadSystemImages();
  loadImages();
});
</script>

<style scoped>
.insert-image-selector {
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
  margin-top: 5px;
}

.select-button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 20px;
}

.select-button:hover {
  background-color: #40a9ff;
}

/* 图片列表样式 */
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
}

.load-more-button {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.load-more-button:hover {
  background-color: #e0e0e0;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  color: #999;
}
</style>
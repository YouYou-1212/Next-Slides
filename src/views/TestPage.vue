<template>
    <div class="test-page">
        <!-- <h1>测试页面</h1>
        <p>这是一个测试页面,用于展示新功能或进行测试。</p>
        <button @click="goBack" class="back-btn">返回编辑器</button> -->
        <div class="content-container">
            <div class="canvas-wrapper">
                <canvas ref="canvasRef" class="full-canvas"></canvas>
            </div>
            <div class="debug-panel">
                <!-- <button @click="triggerSelection" class="debug-btn">触发选择事件</button> -->
                <button @click="logEvents" class="debug-btn">打印事件列表</button>
                <div class="zoom-controls">
                    <button @click="zoomIn" class="debug-btn">放大</button>
                    <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                    <button @click="zoomOut" class="debug-btn">缩小</button>
                    <button @click="resetZoom" class="debug-btn">重置</button>
                    <button @click="replace" class="debug-btn">替换图片</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';


import { ImageControl } from '../composables/subassembly/controls/ImageControl';
import { TestGroup } from './test/TestGroup';
import { CustomImage } from './test/CustomImage';
import { PictureControl } from '../composables/subassembly/controls/PictureControl';
import { GroupControl } from '../composables/subassembly/controls/GroupControl';
import { CustomText } from './test/CustomText';
import { SvgControl } from '../composables/subassembly/controls/SvgControl';
import * as fabric from "fabric";
import { Canvas } from 'fabric';

const router = useRouter();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let canvas: Canvas | null = null;
let activeCustomImage: SvgControl | null = null;


const zoomLevel = ref(1);
const minZoom = 0.1;
const maxZoom = 5;
const zoomStep = 0.1;


const zoomIn = () => {
    if (zoomLevel.value < maxZoom) {
        zoomLevel.value = Math.min(zoomLevel.value + zoomStep, maxZoom);
        updateCanvasZoom();
    }
};

const zoomOut = () => {
    if (zoomLevel.value > minZoom) {
        zoomLevel.value = Math.max(zoomLevel.value - zoomStep, minZoom);
        updateCanvasZoom();
    }
};

const resetZoom = () => {
    zoomLevel.value = 1;
    updateCanvasZoom();
};


const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value + delta));
        zoomLevel.value = newZoom;
        updateCanvasZoom();
    }
};


const replace = () => {
    if (!canvas || !activeCustomImage) {
        
        return;
    }

    
    const randomId = Math.floor(Math.random() * 1000) + 1;
    const newImageUrl = `data:image/svg+xml,%3c?xml%20version='1.0'?%3e%3csvg%20width='30'%20height='40'%20xmlns='http:

    

    
    
    
    

    
    
    
    
    
    
    
};


const updateCanvasZoom = () => {
    if (!canvas) return;
    canvas.renderAll();
};






const initCanvas = async () => {
    if (!canvasRef.value) return;

    
    canvas = new fabric.Canvas(canvasRef.value, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#f0f0f0'
    });

    
    canvas.wrapperEl.style.transform = "translateZ(0)";
    canvas.wrapperEl.style.backfaceVisibility = "hidden";
    canvas.wrapperEl.style.perspective = "1000px";
    canvas.wrapperEl.style.willChange = "transform";

    
    canvas.selection = true;
    canvas.skipTargetFind = false;
    canvas.perPixelTargetFind = false;
    canvas.targetFindTolerance = 4;
    canvas.selection = true; 


    
    canvas.selectionKey = "ctrlKey";
    canvas.selectionFullyContained = true; 
    canvas.selectionColor = 'rgba(100, 100, 255, 1)'; 
    canvas.selectionBorderColor = 'rgba(255, 84, 53, 0.8)'; 
    canvas.selectionLineWidth = 10; 

    
    
    
    
    
    
    

    
    
    
    

    
    canvas.on("selection:created", function (obj: any) {
        
    });

    canvas.on("selection:updated", function (obj: any) {
        
    });

    



    
    
    
    
    
    
    
    
    
    


    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    


    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    

    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    


    
    
    
    
    
    
    
    
    
    



    const text = new fabric.Textbox('11111', {
        left: 100,
        top: 100,
        width: 200,
        padding: 10,
        borderColor: '#FF0000',  
        borderWidth: 1,          
        borderRadius: 10 ,        
        textBackgroundColor: '#3399FF', 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
    })

    const text1 = new fabric.Textbox('在这里输入文本\n你可以在这里输入多行文本\n这里可以输入任意文本', {
        left: 100,
        top: 100,
        width: 200,
    })



    
    let image: fabric.FabricImage;
    fabric.FabricImage.fromURL("https:
        image = img;
        image.set({
            left: 200,
            top: 300,
            width: 100,
            height: 100,
        });


        const group = new fabric.Group([text,text1, image], {
            left: 200,
            top: 200,
            selectable: true,  
            evented: true,     
            subTargetCheck: true,  
            interactive: true,  
        })
        canvas!.add(group);
    });

    
    
    
    
    
    
    
    
    
    
    
    
    


    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    

    




    
    

};









const logEvents = () => {
    if (!canvas) return;
    
};


const handleResize = () => {
    if (!canvas) return;

    canvas.setWidth(window.innerWidth);
    canvas.setHeight(window.innerHeight);
    canvas.renderAll();
};

onMounted(() => {
    initCanvas();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (canvas) {
        canvas.dispose();
        canvas = null;
    }
});

const goBack = () => {
    window.close(); 
    
    router.back();
};
</script>

<style scoped>
.content-container {
    display: flex;
    width: 100%;
    height: 100%;
}

.canvas-wrapper {
    flex: 1;
    height: 100%;
    overflow: hidden;
}

.debug-panel {
    width: 150px;
    height: 100%;
    background-color: #f8f8f8;
    border-left: 1px solid #ddd;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
}

.zoom-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 10px;
    width: 100%;
}

.zoom-level {
    margin: 5px 0;
    color: white;
    background-color: #1890ff;
    padding: 5px 10px;
    border-radius: 4px;
    width: 100%;
    text-align: center;
    box-sizing: border-box;
}

.debug-btn {
    padding: 5px 10px;
    margin: 5px 0;
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;
}

.test-page {
    padding: 0;
    margin: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.full-canvas {
    display: block;
    width: 100%;
    height: 100%;
}

h1 {
    font-size: 32px;
    margin-bottom: 20px;
    color: #1890ff;
}

p {
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 30px;
}

.back-btn {
    padding: 8px 16px;
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

.back-btn:hover {
    background-color: #40a9ff;
}
</style>
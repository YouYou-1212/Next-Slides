<template>
    <div class="test-page">
        <!-- <h1>测试页面</h1>
        <p>这是一个测试页面,用于展示新功能或进行测试。</p>
        <button @click="goBack" class="back-btn">返回编辑器</button> -->
        <canvas ref="canvasRef" class="full-canvas"></canvas>
        <div class="debug-panel">
            <button @click="triggerSelection" class="debug-btn">触发选择事件</button>
            <button @click="logEvents" class="debug-btn">打印事件列表</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import * as fabric from 'fabric';
import { CustomText } from './test/CustomText';
import { TestText } from './test/TestText';
import { ImageControl } from '../composables/subassembly/controls/ImageControl';

const router = useRouter();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let canvas: fabric.Canvas | null = null;

// 在 initCanvas 函数中保存 textbox 引用
let textbox: CustomText | null = null;
// 初始化 Canvas
const initCanvas = () => {
    if (!canvasRef.value) return;

    // 创建 fabric.js Canvas 实例
    canvas = new fabric.Canvas(canvasRef.value, {
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#f0f0f0'
    });


    // 添加文本框
    textbox = new CustomText('在这里输入文本');
    // 保存初始字体大小
    textbox.set('initialFontSize', textbox.fontSize);

    // 在对象添加后注册事件
    canvas.on("selection:created", function (obj: any) {
        console.log("selection:created 事件触发", obj.target);
    });

    canvas.on("selection:updated", function (obj: any) {
        console.log("selection:updated 事件触发", obj.selected?.[0]?.fontSize || textbox!.fontSize);
    });

    canvas.add(textbox);



    const textbox1 = new TestText("Hello World", {
        left: 10,
        top: 10,
        fontFamily: 'Roboto-Regular',
        angle: 0,
        fontSize: 37,
        // width: 200,
        splitByGrapheme: true,
    });
    canvas.add(textbox1);


    const image = ImageControl.fromURL("https://fastly.picsum.photos/id/3/300/300.jpg?hmac=RT2JK6MzdIgNIWoIj61uPcz8aOSOi3lu2vhnwOxs7lY").then((image) => {
        image.set({
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            selectable: true,
            hasControls: true,
            hasBorders: true,
        });
        canvas?.add(image);
        canvas?.setActiveObject(image);
    });




    canvas.setActiveObject(textbox);
    canvas.renderAll();

};

// 添加调试函数
const triggerSelection = () => {
    if (!canvas || !textbox) return;
    canvas.setActiveObject(textbox);
    canvas.renderAll();
    console.log("手动触发选择事件");
};

const logEvents = () => {
    if (!canvas) return;
    console.log("Canvas 事件列表:", (canvas as any).__eventListeners);
};

// 处理窗口大小变化
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
    window.close(); // 尝试关闭当前标签页
    // 如果浏览器阻止关闭,则使用 Vue Router 返回
    router.back();
};
</script>

<style scoped>
.debug-panel {
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 1000;
}

.debug-btn {
    padding: 5px 10px;
    margin: 5px;
    background-color: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.test-page {
    padding: 0;
    margin: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.full-canvas {
    width: 100%;
    height: 100%;
    display: block;
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
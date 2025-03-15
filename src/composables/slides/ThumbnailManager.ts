import { toRaw, type ref, type Ref } from "vue";
import { EventBus, EventTypes } from "../../utils/EventBus";
import type { Canvas } from "fabric/*";
import type { CanvasManager } from "../canvas/CanvasManager";
import { PageFrame } from "./PageFrame";

/**
 * 缩略图管理类
 * 负责维护所有Frame和PageFrame的缩略图更新
 */
export class ThumbnailManager {
    // 存储所有缩略图Canvas引用
    private thumbnailCanvases: Map<
        string,
        {
            canvas: HTMLCanvasElement;
            container: HTMLElement;
        }
    > = new Map();

    private framesRef: Ref<any[]>;
    private canvasManager: CanvasManager;
    private updateFramesCallback?: () => void;
    // 防抖定时器
    private updateTimer: number | null = null;
    // 缩略图默认尺寸
    private readonly defaultWidth: number = 224;
    private readonly defaultHeight: number = 126;
    // 事件监听器是否已设置
    private eventListenersSet: boolean = false;

    /**
     * 构造函数
     * @param canvasManager Canvas管理器引用
     * @param framesRef Frames响应式引用
     */
    constructor(
        canvasManager: any | null,
        framesRef: Ref<any[]>,
        private onUpdateStart?: () => void,
        private onUpdateComplete?: () => void,
        updateFramesCallback?: () => void
    ) {
        console.log("[缩略图管理器] 初始化", canvasManager, framesRef);
        this.canvasManager = canvasManager;
        this.updateFramesCallback = updateFramesCallback;
        this.framesRef = framesRef;
        // 初始化时设置事件监听器
        this.setupEventListeners();
        this.checkCanvasManagerAndUpdate();
    }

    /**
     * 异步检查canvasManager是否可用，并在可用时更新帧列表
     */
    private async checkCanvasManagerAndUpdate(): Promise<void> {
        // 尝试多次检查canvasManager是否可用
        for (let i = 0; i < 5; i++) {
            if (
                this.canvasManager &&
                typeof this.canvasManager.getAllSlides === "function"
            ) {
                console.log("[缩略图管理器] canvasManager可用，执行更新帧列表回调");
                this.updateFramesCallback?.();
                return;
            }

            console.log(
                `[缩略图管理器] canvasManager尚未可用，等待重试 (${i + 1}/5)`
            );
            // 等待一段时间后再次尝试
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.warn("[缩略图管理器] canvasManager在多次尝试后仍不可用");
    }

    /**
     * 设置Canvas管理器
     * @param canvasManager Canvas管理器
     */
    setCanvasManager(canvasManager: any | null): void {
        this.canvasManager = canvasManager;
    }

    /**
     * 设置更新帧列表的回调函数
     * @param callback 回调函数
     */
    setUpdateFramesCallback(callback: () => void): void {
        this.updateFramesCallback = callback;
    }

    /**
     * 获取页面概览对象
     */
    getPageOverview(): any | null {
        return this.canvasManager?.getPageFrame();
    }

    /**
     * 初始化缩略图Canvas并挂载到容器
     * @param id 缩略图ID
     * @param container 容器元素
     * @param width 宽度
     * @param height 高度
     * @returns HTMLCanvasElement 创建的Canvas元素
     */
    initThumbnailCanvas(
        type: string,
        id: string,
        container: HTMLElement,
        width = this.defaultWidth,
        height = this.defaultHeight
    ): HTMLCanvasElement {
        console.log(
            `[缩略图管理器] 初始化缩略图Canvas:type: ${type}  id: ${id}`,
            container
        );
        // 创建新的Canvas元素
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        // 设置Canvas的样式
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.objectFit = "contain";

        // 清空容器并挂载Canvas
        this.mountCanvasToContainer(container, canvas);

        // 存储Canvas和容器引用
        this.thumbnailCanvases.set(id, { canvas, container });

        // 如果是页面概览，立即更新
        if (type === PageFrame.type) {
            this.updateFrameThumbnails();
        }
        return canvas;
    }

    /**
     * 将缩略图 Canvas 插入到指定容器
     * @param container HTMLElement 容器元素
     * @param canvas HTMLCanvasElement Canvas元素
     */
    private mountCanvasToContainer(
        container: HTMLElement,
        canvas: HTMLCanvasElement
    ): void {
        if (!container) {
            console.warn("[缩略图管理器] 挂载Canvas失败：容器为空");
            return;
        }
        // 检查容器是否为有效的DOM元素且具有appendChild方法
        if (
            !(container instanceof HTMLElement) ||
            typeof container.appendChild !== "function"
        ) {
            console.error(
                "[缩略图管理器] 挂载Canvas失败：容器不是有效的DOM元素",
                container
            );
            return;
        }

        console.log("[缩略图管理器] 挂载Canvas到容器", container);
        // 清空容器
        container.innerHTML = "";
        // 插入Canvas
        container.appendChild(canvas);
    }

    /**
     * 检查是否存在指定ID的缩略图Canvas
     * @param id 缩略图ID
     * @returns boolean
     */
    hasThumbnailCanvas(id: string): boolean {
        console.log(
            `[缩略图管理器] 检查是否存在缩略图Canvas: ${id}`,
            "全部画布缓存：",
            this.thumbnailCanvases
        );
        return this.thumbnailCanvases.has(id);
    }

    /**
     * 获取指定ID的缩略图Canvas
     * @param id 缩略图ID
     * @returns HTMLCanvasElement | undefined
     */
    getThumbnailCanvas(id: string): HTMLCanvasElement | undefined {
        return this.thumbnailCanvases.get(id)?.canvas;
    }

    /**
     * 获取页面概览Canvas
     * @returns HTMLCanvasElement | undefined
     */
    getPageOverviewCanvas(): HTMLCanvasElement | undefined {
        return this.getThumbnailCanvas("overview");
    }

    /**
     * 获取Frame缩略图Canvas
     * @param id Frame ID
     * @returns HTMLCanvasElement | undefined
     */
    getFrameThumbnailCanvas(id: string): HTMLCanvasElement | undefined {
        return this.getThumbnailCanvas(id);
    }

    /**
     * 获取所有缩略图Canvas
     * @returns Map<string, {canvas: HTMLCanvasElement, container: HTMLElement}>
     */
    getAllThumbnailCanvases(): Map<
        string,
        { canvas: HTMLCanvasElement; container: HTMLElement }
    > {
        return this.thumbnailCanvases;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners(): void {
        if (this.eventListenersSet) return;
        EventBus.on(EventTypes.CANVAS.CANVAS_UPDATE, (payload) => {
            console.log("[缩略图管理器] 接收到画布更新事件", payload);
            // 先更新帧列表
            if (this.updateFramesCallback) {
                this.updateFramesCallback();
            }
            this.updateAllThumbnails();
        });

        this.eventListenersSet = true;
        console.log("[缩略图管理器] 事件监听器已设置");
    }

    /**
     * 移除事件监听器
     */
    removeEventListeners(): void {
        if (!this.eventListenersSet) return;

        EventBus.off(EventTypes.CANVAS.CANVAS_UPDATE);
        this.eventListenersSet = false;
        console.log("[缩略图管理器] 事件监听器已移除");
    }

    /**
     * 更新所有缩略图
     * 使用防抖优化，避免频繁更新
     */
    updateAllThumbnails(debounceTime = 100): void {
        // 通知开始更新
        this.onUpdateStart?.();
        console.log("[缩略图] 开始更新所有缩略图");

        // 清除之前的定时器
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }

        // 设置新的定时器，防抖处理
        this.updateTimer = window.setTimeout(async () => {
            try {
                // 更新页面概览缩略图
                // await this.updatePageOverviewThumbnail();

                // 更新所有Frame缩略图
                await this.updateFrameThumbnails();

                // 通知更新完成
                this.onUpdateComplete?.();

                console.log("[缩略图] 所有缩略图更新完成");
            } catch (error) {
                console.error("[缩略图] 更新缩略图时发生错误:", error);
            }
        }, debounceTime);
    }

    /**
     * 更新页面概览缩略图
     */
    async updatePageOverviewThumbnail(id: string): Promise<void> {
        const thumbnailInfo = this.thumbnailCanvases.get(id);
        if (!thumbnailInfo) {
            console.warn("[缩略图] 页面概览缩略图未初始化");
            return;
        }

        const { canvas } = thumbnailInfo;
        const pageOverview = this.getPageOverview();

        if (!pageOverview) {
            console.warn("[缩略图] 页面概览对象不存在");
            return;
        }

        try {
            console.log("[缩略图] 开始更新页面概览缩略图");

            // 获取页面概览的缩略图数据
            const thumbnailData = await pageOverview.thumbnail(
                canvas,
                "PageOverview " + new Date().getTime()
            );

            if (thumbnailData) {
                console.log(
                    "[缩略图] 页面概览缩略图更新成功，时间戳:",
                    thumbnailData.timestamp
                );
            } else {
                console.warn("[缩略图] 页面概览缩略图获取结果为空");
            }
        } catch (error) {
            console.error("[缩略图] 更新页面概览缩略图失败:", error);
        }
    }

    /**
     * 更新所有Frame缩略图
     */
    private async updateFrameThumbnails(): Promise<void> {
        // TODO 直到待处理，不知道为什么会出现framesRef.value为undefined
        let frames = [];
        // 按顺序处理每个Frame的缩略图
        if (this.framesRef instanceof Array) {
            frames = this.framesRef;
        } else {
            frames = this.framesRef.value;
        }
        for (const frame of frames) {
            try {
                if (!frame.id) {
                    console.warn(`[缩略图] Frame ID不存在，跳过更新`);
                    continue;
                }

                console.log(`[缩略图] 开始更新Frame ${frame.id} 的缩略图`);

                // 获取或初始化Frame的缩略图Canvas
                const thumbnailInfo = this.thumbnailCanvases.get(frame.id);
                if (!thumbnailInfo) {
                    console.warn(
                        `[缩略图] Frame ${frame.id} 的缩略图Canvas未初始化，跳过更新`
                    );
                    continue;
                }
                const { canvas } = thumbnailInfo;
                // 直接在Canvas上绘制缩略图
                const thumbnailData = await frame.thumbnail(canvas);
                if (thumbnailData) {
                    console.log(
                        `[缩略图] Frame ${frame.id} 缩略图更新成功，时间戳: ${thumbnailData.timestamp}`
                    );
                } else {
                    console.warn(`[缩略图] Frame ${frame.id} 缩略图获取结果为空`);
                }
            } catch (error) {
                console.error(`[缩略图] 更新Frame缩略图失败:`, error);
            }
        }
    }

    /**
     * 清理资源
     */
    dispose(): void {
        // 移除事件监听器
        this.removeEventListeners();

        // 清除定时器
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }

        // 清空Canvas引用
        this.thumbnailCanvases.clear();
    }
}

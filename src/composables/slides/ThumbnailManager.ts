import { toRaw, type ref, type Ref } from "vue";
import { EventBus, EventTypes } from "../../utils/EventBus";
import type { CanvasManager } from "../canvas/CanvasManager";
import { PageFrame } from "./PageFrame";


export class ThumbnailManager {
    
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
    
    private updateTimer: number | null = null;
    
    private readonly defaultWidth: number = 224;
    private readonly defaultHeight: number = 126;
    
    private eventListenersSet: boolean = false;

    
    constructor(
        canvasManager: any | null,
        framesRef: Ref<any[]>,
        private onUpdateStart?: () => void,
        private onUpdateComplete?: () => void,
        updateFramesCallback?: () => void
    ) {
        
        this.canvasManager = canvasManager;
        this.updateFramesCallback = updateFramesCallback;
        this.framesRef = framesRef;
        
        this.setupEventListeners();
        this.checkCanvasManagerAndUpdate();
    }

    
    private async checkCanvasManagerAndUpdate(): Promise<void> {
        
        for (let i = 0; i < 5; i++) {
            if (
                this.canvasManager &&
                typeof this.canvasManager.getAllSlides === "function"
            ) {
                
                this.updateFramesCallback?.();
                return;
            }

            console.log(
                `[缩略图管理器] canvasManager尚未可用，等待重试 (${i + 1}/5)`
            );
            
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.warn("[缩略图管理器] canvasManager在多次尝试后仍不可用");
    }

    
    setCanvasManager(canvasManager: any | null): void {
        this.canvasManager = canvasManager;
    }

    
    setUpdateFramesCallback(callback: () => void): void {
        this.updateFramesCallback = callback;
    }

    
    getPageOverview(): any | null {
        return this.canvasManager?.getPageFrame();
    }

    
    initThumbnailCanvas(
        type: string,
        id: string,
        container: HTMLElement,
        width = this.defaultWidth,
        height = this.defaultHeight
    ): HTMLCanvasElement {
        
        
        
        
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.objectFit = "contain";

        
        this.mountCanvasToContainer(container, canvas);

        
        this.thumbnailCanvases.set(id, { canvas, container });

        
        if (type === PageFrame.type) {
            this.updateFrameThumbnails();
        }
        return canvas;
    }

    
    private mountCanvasToContainer(
        container: HTMLElement,
        canvas: HTMLCanvasElement
    ): void {
        if (!container) {
            console.warn("[缩略图管理器] 挂载Canvas失败：容器为空");
            return;
        }
        
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

        
        
        container.innerHTML = "";
        
        container.appendChild(canvas);
    }

    
    hasThumbnailCanvas(id: string): boolean {
        
        
        
        
        
        return this.thumbnailCanvases.has(id);
    }

    
    getThumbnailCanvas(id: string): HTMLCanvasElement | undefined {
        return this.thumbnailCanvases.get(id)?.canvas;
    }

    
    getPageOverviewCanvas(): HTMLCanvasElement | undefined {
        return this.getThumbnailCanvas("overview");
    }

    
    getFrameThumbnailCanvas(id: string): HTMLCanvasElement | undefined {
        return this.getThumbnailCanvas(id);
    }

    
    getAllThumbnailCanvases(): Map<
        string,
        { canvas: HTMLCanvasElement; container: HTMLElement }
    > {
        return this.thumbnailCanvases;
    }

    
    setupEventListeners(): void {
        if (this.eventListenersSet) return;
        EventBus.on(EventTypes.CANVAS.CANVAS_UPDATE, (payload) => {
            
            
            if (this.updateFramesCallback) {
                this.updateFramesCallback();
            }
            this.updateAllThumbnails();
        });

        this.eventListenersSet = true;
        
    }

    
    removeEventListeners(): void {
        if (!this.eventListenersSet) return;

        EventBus.off(EventTypes.CANVAS.CANVAS_UPDATE);
        this.eventListenersSet = false;
        
    }

    
    updateAllThumbnails(debounceTime = 100): void {
        
        this.onUpdateStart?.();
        
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }

        
        this.updateTimer = window.setTimeout(async () => {
            try {
                
                

                
                await this.updateFrameThumbnails();

                
                this.onUpdateComplete?.();

                
            } catch (error) {
                console.error("[缩略图] 更新缩略图时发生错误:", error);
            }
        }, debounceTime);
    }

    
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
            

            
            const thumbnailData = await pageOverview.thumbnail(
                canvas,
                "PageOverview " + new Date().getTime()
            );

            if (thumbnailData) {
                
                
                
                
            } else {
                console.warn("[缩略图] 页面概览缩略图获取结果为空");
            }
        } catch (error) {
            console.error("[缩略图] 更新页面概览缩略图失败:", error);
        }
    }

    
    private async updateFrameThumbnails(): Promise<void> {
        
        let frames = [];
        
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

                

                
                const thumbnailInfo = this.thumbnailCanvases.get(frame.id);
                if (!thumbnailInfo) {
                    console.warn(
                        `[缩略图] Frame ${frame.id} 的缩略图Canvas未初始化，跳过更新`
                    );
                    continue;
                }
                const { canvas } = thumbnailInfo;
                
                const thumbnailData = await frame.thumbnail(canvas);
                if (thumbnailData) {
                    
                    
                    
                } else {
                    console.warn(`[缩略图] Frame ${frame.id} 缩略图获取结果为空`);
                }
            } catch (error) {
                console.error(`[缩略图] 更新Frame缩略图失败:`, error);
            }
        }
    }

    
    dispose(): void {
        
        this.removeEventListeners();

        
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }

        
        this.thumbnailCanvases.clear();
    }
}

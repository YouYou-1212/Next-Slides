import * as fabric from "fabric";
import { Slides } from "../slides/Slides";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import { FabricObject } from "fabric";

export class CustomCanvas extends fabric.Canvas {
    static type="CustomCanvas";
    //标识当前是否有对象正在被拖动
    declare isDraggingObject: boolean;
   
    constructor(el?: string | HTMLCanvasElement, options?: any) {
        const webglOptions = {
            enableRetinaScaling: true,
            renderOnAddRemove: true,
            webgl: true,  // 启用 WebGL
            webglPrecision: 'highp'  // WebGL 精度设置：'lowp', 'mediump', 或 'highp'
        };
        super(el, {...options , ...webglOptions});
        this.isDraggingObject = false;
        if ((this as any).contextContainer instanceof WebGLRenderingContext) {
            console.log('WebGL 已成功启用');
        } else {
            console.log('使用 Canvas 2D 渲染');
        }
    }

    /**
     * 重写添加元素方法
     * 确保添加的元素遵循正确的层级关系
     */
    add(...objects: fabric.FabricObject[]): number {
        // 先调用原始的添加方法
        const size = super.add(...objects);

        // 然后调整层级
        // this.adjustLayerOrder();

        return size;
    }

    /**
     * 重写移除元素方法
     */
    remove(...objects: FabricObject[]) {
        const removed = super.remove(...objects);
        // 移除后可能不需要调整层级，但为了安全起见，仍然调整一次
        // this.adjustLayerOrder();
        return removed;
    }


    /**
     * 重写将对象移到最前面的方法
     */
    bringObjectToFront(object: fabric.Object): boolean {
        // 只有Slides类型的对象可以在最顶层
        if (object instanceof Slides) {
            return super.bringObjectToFront(object);
        } else {
            console.warn("只有Slides类型的对象可以移到最顶层");
            // 调整到合适的位置
            // this.adjustObjectLayer(object);
            return false;
        }
    }

    /**
     * 重写将对象移到最后面的方法
     */
    sendObjectToBack(object: fabric.Object): boolean {
        // 只有PageFrame可以在最底层
        if (object instanceof PageFrame) {
            return super.sendObjectToBack(object);
        } else {
            console.warn("只有PageFrame可以移到最底层");
            // 调整到合适的位置
            // this.adjustObjectLayer(object);
            return false;
        }
    }

    /**
     * 重写将对象向前移动一层的方法
     */
    bringObjectForward(object: fabric.Object, intersecting?: boolean): boolean {
        // 如果是Slides，已经在最顶层，不需要再移动
        if (object instanceof Slides) {
            console.warn("Slides已经在最顶层");
            return false;
        }

        // 获取所有对象
        const allObjects = this.getObjects();
        const index = allObjects.indexOf(object);

        // 如果对象是最后一个或者不存在，则不需要移动
        if (index === -1 || index === allObjects.length - 1) {
            return false;
        }

        // 检查下一个对象是否是Slides
        const nextObject = allObjects[index + 1];
        if (nextObject instanceof Slides) {
            console.warn("对象不能移到Slides之上");
            return false;
        }

        // 调用原始方法
        return super.bringObjectForward(object, intersecting);
    }

    /**
     * 重写将对象向后移动一层的方法
     */
    sendObjectBackwards(object: fabric.Object, intersecting?: boolean): boolean {
        // 如果是PageFrame，已经在最底层，不需要再移动
        if (object instanceof PageFrame) {
            console.warn("PageFrame已经在最底层");
            return false;
        }

        // 获取所有对象
        const allObjects = this.getObjects();
        const index = allObjects.indexOf(object);

        // 如果对象是第一个或者不存在，则不需要移动
        if (index <= 0) {
            return false;
        }

        // 检查前一个对象是否是PageFrame
        const prevObject = allObjects[index - 1];
        if (prevObject instanceof PageFrame) {
            console.warn("对象不能移到PageFrame之下");
            return false;
        }

        // 调用原始方法
        return super.sendObjectBackwards(object, intersecting);
    }

    /**
     * 调整所有对象的层级顺序
     * 确保：
     * 1. 所有的Slides都在其它对象之上
     * 2. PageFrame在所有Frame的最底部
     * 3. 所有Frame按照添加顺序排列图层
     * 4. 所有非Slides对象最高不能超过PageFrame
     */
    private adjustLayerOrder(): void {
        console.log("[CustomCanvas] adjustLayerOrder");
        const allObjects = [...this.getObjects()]; // 创建对象数组的副本
        
        // 找出所有Slides、Frame和PageFrame
        const slides = allObjects.filter(obj => obj instanceof Slides);
        const frames = allObjects.filter(obj => obj instanceof Frame);
        const pageFrames = allObjects.filter(obj => obj instanceof PageFrame);
        const otherObjects = allObjects.filter(obj =>
            !(obj instanceof Slides) &&
            !(obj instanceof Frame) &&
            !(obj instanceof PageFrame)
        );

        // 安全地移除所有对象，不触发adjustLayerOrder
        this._objects.length = 0;  // 直接清空对象数组
        
        // 按照正确的顺序重新添加对象
        // 1. 先添加PageFrame
        pageFrames.forEach(obj => this._objects.push(obj));
        
        // 2. 添加其他非Slides、非Frame对象
        otherObjects.forEach(obj => this._objects.push(obj));
        
        // 3. 添加Frame
        frames.forEach(obj => this._objects.push(obj));
        
        // 4. 最后添加Slides
        slides.forEach(obj => this._objects.push(obj));

        // 重新渲染画布
        this.requestRenderAll();
    }

    /**
     * 调整单个对象的层级
     */
    private adjustObjectLayer(object: fabric.Object): void {
        console.log("[CustomCanvas] adjustObjectLayer");
        // 获取所有对象
        const allObjects = this.getObjects();

        // 如果对象是Slides，移到最顶层
        if (object instanceof Slides) {
            super.bringObjectToFront(object);
            return;
        }

        // 如果对象是PageFrame，移到最底层
        if (object instanceof PageFrame) {
            super.sendObjectToBack(object);
            return;
        }

        // 找出所有Slides
        const slides = allObjects.filter(obj => obj instanceof Slides);

        // 如果有Slides，确保对象在所有Slides之下
        if (slides.length > 0) {
            // 找到最底层的Slides
            const bottomSlide = slides.reduce((prev, current) => {
                const prevIndex = allObjects.indexOf(prev);
                const currentIndex = allObjects.indexOf(current);
                return prevIndex < currentIndex ? prev : current;
            });

            // 将对象移到最底层Slides之下
            const slideIndex = allObjects.indexOf(bottomSlide);
            const objectIndex = allObjects.indexOf(object);

            if (objectIndex > slideIndex) {
                // 移动对象到Slides之下
                super.moveObjectTo(object, slideIndex - 1);
            }
        }
    }
}
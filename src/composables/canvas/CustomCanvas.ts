import * as fabric from "fabric";
import { Slides } from "../slides/Slides";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import { FabricObject } from "fabric";

export class CustomCanvas extends fabric.Canvas {
    static type = "CustomCanvas";
    //标识当前是否有对象正在被拖动
    declare isDraggingObject: boolean;
    // 记录PageFrame的索引位置
    private pageFrameIndex: number = -1;

    constructor(el?: string | HTMLCanvasElement, options?: any) {
        const webglOptions = {
            enableRetinaScaling: true,
            renderOnAddRemove: true,
            webgl: true,  // 启用 WebGL
            webglPrecision: 'highp'  // WebGL 精度设置：'lowp', 'mediump', 或 'highp'
        };
        super(el, { ...options, ...webglOptions });
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
        let addedCount = 0;
        // 分类处理不同类型的对象
        for (const object of objects) {
            if (object instanceof PageFrame) {
                // PageFrame 始终添加到最底层
                super.insertAt(0, object);
                this.pageFrameIndex = 0;
                addedCount++;
            }
            if (object instanceof Frame) {
                // Frame 添加到 PageFrame 之上
                if (this.pageFrameIndex >= 0) {
                    super.insertAt(this.pageFrameIndex + 1, object);
                    addedCount++;
                } else {
                    // 如果没有 PageFrame，直接添加
                    super.add(object);
                    addedCount++;
                }
            }
            if (!(object instanceof Slides)) {
                // 其他元素添加到 PageFrame 之下
                if (this.pageFrameIndex >= 0) {
                    super.insertAt(this.pageFrameIndex , object);
                    addedCount++;
                }else{
                    super.add(object);
                    addedCount++;
                }
            }
        }

        // 更新 PageFrame 索引（如果有多个 PageFrame 被添加）
        this.updatePageFrameIndex();

        return addedCount;
    }

    /**
       * 更新 PageFrame 的索引位置
       */
    private updatePageFrameIndex(): void {
        const allObjects = this.getObjects();
        this.pageFrameIndex = allObjects.findIndex(obj => obj instanceof PageFrame);
    }

    /**
     * 重写移除元素方法
     */
    remove(...objects: FabricObject[]) {
        const removed = super.remove(...objects);
        return removed;
    }


    /**
     * 将对象移到最前面
     */
    bringObjectToFront(object: fabric.Object): boolean {
        if (object instanceof Slides) {
            // TODO 此处如果调整Frame可以将Frame内部元素进行统一调整
            return false;
        } else {
            //将元素调整到pageFrameIndex - 1的位置
            if (this.pageFrameIndex > 0) {
                super.moveObjectTo(object, this.pageFrameIndex - 1);
            }
            console.log("[CustomCanvas] bringObjectToFront 元素", this._objects);
            return true;
        }
    }

    /**
     * 重写将对象移到最后面的方法
     */
    sendObjectToBack(object: fabric.Object): boolean {
        if (object instanceof Slides) {
            return false;
        } else {
            super.sendObjectToBack(object);
            console.log("[CustomCanvas] sendObjectToBack 元素", this._objects);
            return true;
        }
    }

    /**
     * 将对象向前移动一层
     */
    bringObjectForward(object: fabric.Object, intersecting?: boolean): boolean {
        if (object instanceof Slides) {
            console.warn("Slides元素不支持移动！");
            return false;
        }
        const objectIndex = this._objects.indexOf(object);
        const upObject = this.item(objectIndex + 1);
        if(upObject instanceof Slides){
            console.warn("上一层已经是Slides元素不能再移动！");
            return false;
        }
        console.log("[CustomCanvas] bringObjectForward 元素", this._objects);
        // TODO findNewUpperIndex 解决图层交集时调整会更符合直觉
        return super.bringObjectForward(object , false);
    }

    /**
     * 将对象向后移动一层
     */
    sendObjectBackwards(object: fabric.Object, intersecting?: boolean): boolean {
        if (object instanceof Slides) {
            console.warn("Slides元素不支持移动！");
            return false;
        }
        console.log("[CustomCanvas] sendObjectBackwards 元素", this._objects);
        return super.sendObjectBackwards(object, intersecting);
    }

}
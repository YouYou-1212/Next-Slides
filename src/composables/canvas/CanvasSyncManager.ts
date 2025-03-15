import * as fabric from "fabric";
import { EventBus, EventTypes } from "../../utils/EventBus";
import { Frame } from "../slides/Frame";
import { PageFrame } from "../slides/PageFrame";
import { Slides } from "../slides/Slides";

/**
 * 画布同步管理器
 * 负责将主画布内容同步到演示画布
 */
export class CanvasSyncManager {
  // 同步控制变量
  private syncEnabled: boolean = true;
  private syncDebounceTimer: number | null = null;
  private syncInProgress: boolean = false;
  private pendingSync: boolean = false;
  // 事件监听器引用，用于销毁时移除
  private backgroundColorListener: ((payload?: any) => void) | null = null;
  private backgroundImageListener: ((payload?: any) => void) | null = null;

  /**
   * 构造函数
   * @param sourceCanvas 源画布（主画布）
   * @param targetCanvas 目标画布（演示画布）
   */
  constructor(
    private sourceCanvas: fabric.Canvas,
    private targetCanvas: fabric.Canvas
  ) {
    this.initCanvasSyncEvents();
  }

  /**
   * 初始化画布同步事件监听
   */
  private initCanvasSyncEvents() {
    // 监听主画布的对象添加事件
    this.sourceCanvas.on("object:added", () => this.debounceSyncCanvases());

    // 监听主画布的对象移除事件
    this.sourceCanvas.on("object:removed", () => this.debounceSyncCanvases());

    // 监听主画布的对象修改事件
    this.sourceCanvas.on("object:modified", () => this.debounceSyncCanvases());

    // 监听主画布的渲染完成事件
    this.sourceCanvas.on("after:render", () => {
      // 如果有待处理的同步请求，执行同步
      if (this.pendingSync && !this.syncInProgress) {
        this.syncCanvases();
      }
    });

    // 监听视口变换事件
    // this.sourceCanvas.on('viewport:translate', () => this.debounceSyncCanvases());
    // this.sourceCanvas.on('viewport:scale', () => this.debounceSyncCanvases());

    // 使用EventBus监听背景颜色变化
    this.backgroundColorListener = (payload) => {
      console.log(
        "背景颜色变化:",
        payload,
        payload.canvas,
        this.sourceCanvas,
        payload.canvas === this.sourceCanvas
      );
      if (payload) {
        console.log("同步背景色:", this.sourceCanvas);
        this.debounceSyncCanvases();
      }
    };
    EventBus.on(
      EventTypes.CANVAS.BACKGROUND_COLOR_CHANGE,
      this.backgroundColorListener
    );

    // 使用EventBus监听背景图片变化
    this.backgroundImageListener = (payload) => {
      if (payload) {
        this.debounceSyncCanvases();
      }
    };
    EventBus.on(
      EventTypes.CANVAS.BACKGROUND_IMAGE_CHANGE,
      this.backgroundImageListener
    );
  }

  /**
   * 防抖同步函数，避免频繁同步
   * @param delay 延迟时间（毫秒）
   */
  private debounceSyncCanvases(delay: number = 500) {
    if (!this.syncEnabled) return;

    // 如果正在同步中，标记为待处理
    if (this.syncInProgress) {
      this.pendingSync = true;
      return;
    }

    // 清除之前的定时器
    if (this.syncDebounceTimer !== null) {
      window.clearTimeout(this.syncDebounceTimer);
    }

    // 设置新的定时器
    this.syncDebounceTimer = window.setTimeout(() => {
      this.syncCanvases();
    }, delay);
  }

  /**
   * 同步画布内容
   */
  private async syncCanvases() {
    if (!this.syncEnabled || this.syncInProgress) return;

    this.syncInProgress = true;
    this.pendingSync = false;

    try {
      // 清空演示画布
      this.targetCanvas.clear();

      // 同步背景色
      if (this.sourceCanvas.backgroundColor) {
        this.targetCanvas.backgroundColor = this.sourceCanvas.backgroundColor;
      }

      // 同步背景图片
      if (this.sourceCanvas.backgroundImage) {
        try {
          const originalBgImage: any = this.sourceCanvas.backgroundImage;

          // 检查背景图片类型并采用不同的克隆策略
          if (typeof originalBgImage.getSrc === "function") {
            // 获取原始图片的URL或源
            const imgSrc = originalBgImage.getSrc();

            if (imgSrc) {
              // 创建新的图片对象
              fabric.FabricImage.fromURL(imgSrc, {
                crossOrigin: "anonymous",
              }).then((newImage: fabric.Image) => {
                if (newImage) {
                  newImage.scaleX = originalBgImage.scaleX || 1;
                  newImage.scaleY = originalBgImage.scaleY || 1;
                  newImage.left = originalBgImage.left || 0;
                  newImage.top = originalBgImage.top || 0;
                  newImage.originX = originalBgImage.originX || "left";
                  newImage.originY = originalBgImage.originY || "top";
                  newImage.width = originalBgImage.width;
                  newImage.height = originalBgImage.height;

                  // 设置为目标画布的背景
                  this.targetCanvas.backgroundImage = newImage;
                  this.targetCanvas.requestRenderAll();
                }
              });
            }
          } else {
            // 尝试直接克隆背景图片
            try {
              const clonedBgImage = await originalBgImage.clone();
              this.targetCanvas.backgroundImage = clonedBgImage;
              this.targetCanvas.requestRenderAll();
            } catch (cloneError) {
              console.error("背景图片克隆失败，尝试备选方法:", cloneError);
              // 备选方法：使用JSON序列化和反序列化
              const bgImageJSON = originalBgImage.toJSON();
              const objects = await fabric.util.enlivenObjects([bgImageJSON]);
              if (objects && objects[0]) {
                this.targetCanvas.backgroundImage = objects[0] as fabric.Image;
                this.targetCanvas.requestRenderAll();
              }
            }
          }
        } catch (error) {
          console.error("背景图片同步失败:", error);
        }
      }

      // 获取主画布中的所有对象
      const objects = this.sourceCanvas.getObjects();
      
      // 直接克隆方式同步对象
      const clonePromises = objects.map(obj => 
        new Promise<fabric.Object>(async (resolve) => {
          try {
            // 直接克隆对象
            const clonedObj = await obj.clone();
            resolve(clonedObj);
          } catch (error) {
            console.error(`克隆对象失败: ${obj.type}`, error);
            // 当克隆失败时返回一个空的fabric对象而不是null
            const emptyObj = new fabric.FabricObject();
            resolve(emptyObj);
          }
        })
      );
      
      // 等待所有克隆完成
      const clonedObjects = await Promise.all(clonePromises);
      
      // 处理克隆后的对象并添加到目标画布
      clonedObjects.forEach((obj: any) => {
        if (!obj) return; // 跳过克隆失败的对象
        
        // 移除控制点和边框
        if (obj.hasOwnProperty("controls")) {
          obj.controls = {};
        }
        
        // 保存原始类型信息
        const originalType = obj.type;
        
        // 如果是Frame或PageFrame类型，取消自定义边框
        if (
          originalType === Frame.type ||
          originalType === PageFrame.type ||
          originalType === Slides.type
        ) {
          obj.customBorderColor = "transparent";
          obj.fill = "transparent";
          obj.backgroundColor = "transparent";
          // 设置边框为透明
          obj.stroke = "transparent";
          // console.log("同步对象:", obj.type , obj);
          // 根据原始类型设置特定属性
          if (originalType === Frame.type) {
            if (typeof obj.setNumberControlVisibility === 'function') {
              obj.setNumberControlVisibility(false);
            }
          }
          // 禁用选择
          obj.selectable = false;
          obj.hoverCursor = "default";
        }
        
        // 添加到演示画布
        this.targetCanvas.add(obj);
      });

      // 渲染演示画布
      this.targetCanvas.requestRenderAll();
      
      // 完成同步
      this.syncInProgress = false;

      // 如果有待处理的同步请求，安排下一次同步
      if (this.pendingSync) {
        requestAnimationFrame(() => this.syncCanvases());
      }
    } catch (error) {
      console.error("同步画布失败:", error);
      this.syncInProgress = false;
    }
  }

  /**
   * 启用/禁用同步
   * @param enabled 是否启用同步
   */
  public enableSync(enabled: boolean = true) {
    this.syncEnabled = enabled;
    if (enabled && !this.syncInProgress) {
      this.syncCanvases();
    }
  }

  /**
   * 强制同步画布
   */
  public forceSyncCanvases() {
    if (this.syncDebounceTimer !== null) {
      window.clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
    this.syncCanvases();
  }

  /**
   * 销毁同步管理器，清理事件监听
   */
  public destroy() {
    // 清除定时器
    if (this.syncDebounceTimer !== null) {
      window.clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }

    // 移除事件监听
    this.sourceCanvas.off("object:added");
    this.sourceCanvas.off("object:removed");
    this.sourceCanvas.off("object:modified");
    this.sourceCanvas.off("after:render");
    // this.sourceCanvas.off('viewport:translate');
    // this.sourceCanvas.off('viewport:scale');

    // 移除EventBus事件监听
    if (this.backgroundColorListener) {
      EventBus.off(
        EventTypes.CANVAS.BACKGROUND_COLOR_CHANGE,
        this.backgroundColorListener
      );
      this.backgroundColorListener = null;
    }

    if (this.backgroundImageListener) {
      EventBus.off(
        EventTypes.CANVAS.BACKGROUND_IMAGE_CHANGE,
        this.backgroundImageListener
      );
      this.backgroundImageListener = null;
    }
  }
}

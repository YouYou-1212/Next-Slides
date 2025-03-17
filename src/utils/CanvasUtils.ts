import * as fabric from "fabric";
import { Slides } from "../composables/slides/Slides";
import { EventBus, EventTypes } from "./EventBus";
import type { CanvasManager } from "../composables/canvas/CanvasManager";
import type { CustomCanvas } from "../composables/canvas/CustomCanvas";

// 添加全局引用存储 CanvasManager 实例
let canvasManagerInstance: CanvasManager | null = null;

// 设置和获取 CanvasManager 实例的方法
export function setCanvasManager(manager: CanvasManager) {
  canvasManagerInstance = manager;
  // console.log("CanvasUtils: 已存储 CanvasManager 实例");
}

export function getCanvasManager(): CanvasManager | null {
  return canvasManagerInstance;
}

export function setBackgroundImage(
  canvas: fabric.Canvas,
  image: HTMLImageElement
) {
  // 创建一个新的fabric.Image对象
  const bgImage = new fabric.FabricImage(image, {
    left: 0,
    top: 0,
    width: canvas.width!,
    height: canvas.height!,
    selectable: false,
    evented: false,
  });
  // 将背景图片添加到画布
  canvas.backgroundImage = bgImage;
  canvas.requestRenderAll();
  // 发出背景图片变化事件
  EventBus.emit(EventTypes.CANVAS.BACKGROUND_IMAGE_CHANGE, {
    canvas,
    image: bgImage,
  });
}

export function setBackgroundImageByUrl(canvas: fabric.Canvas, url: string) {
  // url = "https://fastly.picsum.photos/id/10/1200/1200.jpg?hmac=cleBd6wixB2iC1qAyRPV_Hyc9d-nUNRCJbSXIa2o-8c"
  // 创建加载指示器
  const loadingIndicator = new fabric.FabricText("加载中...", {
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: "center",
    originY: "center",
    fill: "#666",
    fontSize: 20,
    selectable: false,
    evented: false,
  });

  // 显示加载指示器
  canvas.add(loadingIndicator);
  canvas.requestRenderAll();

  fabric.FabricImage.fromURL(
    url,
    // 添加crossOrigin选项以支持跨域图片
    { crossOrigin: "anonymous" }
  ).then((img: any) => {
    // 获取画布和图片尺寸
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // 调整图片大小以适应画布
    const scale = Math.max(
      canvasWidth / img.width!,
      canvasHeight / img.height!
    );
    img.scale(scale);
    // 将图片居中
    img.set({
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    // 设置为背景图像
    canvas.backgroundImage = img;
    // 移除加载指示器
    canvas.remove(loadingIndicator);
    canvas.requestRenderAll();
    // URL.revokeObjectURL(url);
    // 发出背景图片变化事件
    EventBus.emit(EventTypes.CANVAS.BACKGROUND_IMAGE_CHANGE, {
      canvas,
      image: img,
    });
  });
}

export function setBackgroundColor(canvas: fabric.Canvas, color: string) {
  canvas.backgroundColor = color;
  canvas.requestRenderAll();
  EventBus.emit(EventTypes.CANVAS.CANVAS_UPDATE, {
    type: "change",
    target: canvas,
  });
  // 发出背景颜色变化事件
  EventBus.emit(EventTypes.CANVAS.BACKGROUND_COLOR_CHANGE, { canvas, color });
}


/**
 * 根据坐标位置查找当前坐标下所有的对象
 * @param x 横坐标
 * @param y 纵坐标
 * @returns 当前坐标下的所有对象
 */
export function findObjectsByPosition(
  canvas: fabric.Canvas,
  point: fabric.Point
): fabric.Object[] {
  const objects = canvas.getObjects();
  const objectsAtPosition: fabric.Object[] = [];

  // 获取画布的视口变换和缩放
  const vpt = canvas.viewportTransform!;
  const zoom = canvas.getZoom();

  // 将屏幕坐标转换为画布坐标
  const canvasPoint = fabric.util.transformPoint(
    new fabric.Point(point.x, point.y),
    fabric.util.invertTransform(vpt)
  );


  // 计算画布可见区域
  const viewportBounds = {
    left: -vpt[4] / zoom,
    top: -vpt[5] / zoom,
    width: canvas.width! / zoom,
    height: canvas.height! / zoom,
  };

  // 从上到下遍历对象（画布中的顺序是从下到上）
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];

    // 跳过不可见的对象
    if (!obj.visible) continue;

    // 首先进行快速的边界框检查
    const bounds = obj.getBoundingRect();
    // 计算缩放后的边界框坐标
    // const scaledBounds = {
    //   left: bounds.left * zoom + vpt[4],
    //   top: bounds.top * zoom + vpt[5],
    //   width: bounds.width * zoom,
    //   height: bounds.height * zoom
    // };
    // console.log("当前对象的边界框:", obj.type, bounds);

    // 检查对象是否在可见区域内
    if (
      bounds.left > viewportBounds.left + viewportBounds.width ||
      bounds.left + bounds.width < viewportBounds.left ||
      bounds.top > viewportBounds.top + viewportBounds.height ||
      bounds.top + bounds.height < viewportBounds.top
    ) {
      continue; // 对象不在可见区域内，跳过
    }

    // 检查点是否在对象边界框内
    if (
      canvasPoint.x < bounds.left ||
      canvasPoint.x > bounds.left + bounds.width ||
      canvasPoint.y < bounds.top ||
      canvasPoint.y > bounds.top + bounds.height
    ) {
      continue; // 点不在对象的边界框内，跳过
    }

    // 只有通过边界框检查的对象才进行精确的点检测
    if (obj.containsPoint(canvasPoint)) {
      objectsAtPosition.push(obj);
    }
  }

  return objectsAtPosition;
}


/**
 * 获取对象在屏幕上的实际边界框（考虑缩放和视口变换）
 * @param canvas 画布
 * @param obj 对象
 * @returns 屏幕上的实际边界框
 */
export function getScreenBoundingRect(canvas: fabric.Canvas, obj: fabric.Object) {
  const zoom = canvas.getZoom();
  const vpt = canvas.viewportTransform!;
  const bounds = obj.getBoundingRect();

  return {
    left: bounds.left * zoom + vpt[4],
    top: bounds.top * zoom + vpt[5],
    width: bounds.width * zoom,
    height: bounds.height * zoom,
    right: (bounds.left + bounds.width) * zoom + vpt[4],
    bottom: (bounds.top + bounds.height) * zoom + vpt[5]
  };
}


//检测坐标是否在指定对象的边界框内
/**
 * 检测坐标是否在指定对象的边界框内
 * @param canvas 画布
 * @param obj 对象
 * @param point 坐标点
 * @returns 是否在边界框内
 */
export function isPointInObject(
  canvas: fabric.Canvas,
  obj: fabric.Object,
  pointer: { x: number; y: number }
): boolean {
  //将屏幕坐标转成画布坐标
  const zoom = canvas.getZoom();
  const vpt = canvas.viewportTransform!;
  const canvasPoint = fabric.util.transformPoint(
    new fabric.Point(pointer.x, pointer.y),
    fabric.util.invertTransform(vpt)
  );
  const bounds = obj.getBoundingRect();

  // 检查点是否在缩放后的边界框内
  return (
    canvasPoint.x >= bounds.left &&
    canvasPoint.x <= bounds.left + bounds.width &&
    canvasPoint.y >= bounds.top &&
    canvasPoint.y <= bounds.top + bounds.height
  );
}


/**
 * 检测点是否在矩形边框上（仅边框区域，不包括内部）
 * @param point 鼠标坐标点
 * @param rect 矩形对象
 * @param borderWidth 边框宽度，默认为1
 * @returns 是否在边框上
 */
export function isPointOnRectBorder(
  point: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
  borderWidth: number = 1
): boolean {
  // 计算矩形的四个边界
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  // 计算内部矩形（不包含边框）的边界
  const innerLeft = rect.left + borderWidth;
  const innerTop = rect.top + borderWidth;
  const innerRight = right - borderWidth;
  const innerBottom = bottom - borderWidth;

  // 检查点是否在矩形范围内
  const isInsideRect =
    point.x >= rect.left &&
    point.x <= right &&
    point.y >= rect.top &&
    point.y <= bottom;

  // 检查点是否在内部矩形范围内
  const isInsideInnerRect =
    point.x >= innerLeft &&
    point.x <= innerRight &&
    point.y >= innerTop &&
    point.y <= innerBottom;

  // 如果点在矩形内但不在内部矩形内，则点在边框上
  return isInsideRect && !isInsideInnerRect;
}


 /**
   * 查找鼠标位置下的目标对象
   */
 export function findTargetObject(canvas:CustomCanvas, point: fabric.Point) {
  const targets = findObjectsByPosition(canvas, point);
  
  const slidesTarget = targets.find((obj) => {
    return obj instanceof Slides && isPointOnRectBorder(point, obj, 10);
  });

  let nonFrameTarget = null;
  if (!slidesTarget) {
    nonFrameTarget = targets.find(
      (obj) => obj.type !== Slides.type && !(obj instanceof Slides)
    );
  }

  return {
    target: nonFrameTarget || slidesTarget,
    targets
  };
}



// 添加一个互斥锁来防止并发执行
let thumbnailGenerationLock = false;
const thumbnailQueue: Array<() => Promise<void>> = [];
/**
 * 高效可靠地生成指定矩形区域内的画布缩略图
 * 使用原生Canvas API直接从渲染后的画布中提取像素
 *
 * @param canvas 源画布
 * @param thumbnailCanvas 目标缩略图画布
 * @param rect 要截取的矩形区域，如果不提供则使用整个画布
 */
export async function generateReliableThumbnail(
  canvas: fabric.Canvas,
  thumbnailCanvas: HTMLCanvasElement,
  rect?: fabric.FabricObject
): Promise<void> {
  // 创建当前任务
  const task = async () => {
    if (!canvas) return;
    const opts = {
      waitForRender: true,
    };

    if (!canvas) return;
    // 保存当前视口状态
    const originalTransform: any = canvas.viewportTransform?.slice() || [
      1, 0, 0, 1, 0, 0,
    ];
    const originalZoom = canvas.getZoom();

    try {
      // 计算视口信息
      const viewportInfo: any = calculateViewportInfo(canvas, rect);
      const ctx = thumbnailCanvas.getContext("2d");
      if (!ctx) return;

      // 设置视口变换
      canvas.setViewportTransform(viewportInfo.transform);

      // 等待画布完全渲染
      await new Promise<void>((resolve) => {
        if (opts.waitForRender) {
          // 使用requestAnimationFrame确保在下一帧渲染
          requestAnimationFrame(() => {
            // 强制重新渲染
            canvas.renderAll();

            // 再次使用requestAnimationFrame确保渲染完成
            requestAnimationFrame(() => {
              setTimeout(resolve, 500);
            });
          });
        } else {
          canvas.renderAll();
          resolve();
        }
      });

      const viewportWidth = canvas.getWidth();
      const viewportHeight = canvas.getHeight();

      // 更新缩略图画布尺寸
      thumbnailCanvas.width = viewportWidth;
      thumbnailCanvas.height = viewportHeight;

      // console.log("缩略图画板Canvas 信息:", {
      //   缩放后X坐标: viewportInfo.scaledLeft,
      //   缩放后Y坐标: viewportInfo.scaledTop,
      //   缩放后宽度: viewportInfo.scaledWidth,
      //   缩放后高度: viewportInfo.scaledHeight,
      //   缩略图画板宽度: thumbnailCanvas.width,
      //   缩略图画板高度: thumbnailCanvas.height,
      //   当前视口宽度: viewportWidth,
      //   当前视口高度: viewportHeight,
      // });

      // 清除缩略图画布
      ctx.clearRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

      // 直接从画布元素获取像素数据
      ctx.drawImage(
        canvas.lowerCanvasEl,
        0,
        0,
        viewportWidth,
        viewportHeight,
        0,
        0,
        thumbnailCanvas.width,
        thumbnailCanvas.height
      );
    } catch (e) {
      console.error("生成可靠缩略图失败:", e);
      return;
    } finally {
      // 恢复原始视口状态
      canvas.setViewportTransform(originalTransform);
      canvas.setZoom(originalZoom);
    }
  };

  // 将任务添加到队列
  return new Promise<void>((resolve, reject) => {
    thumbnailQueue.push(async () => {
      try {
        await task();
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    // 如果当前没有任务在执行，则开始处理队列
    processQueue();
  });
}

/**
 * 处理缩略图生成队列
 */
async function processQueue() {
  if (thumbnailGenerationLock || thumbnailQueue.length === 0) {
    return;
  }

  thumbnailGenerationLock = true;

  try {
    const nextTask = thumbnailQueue.shift();
    if (nextTask) {
      await nextTask();
    }
  } finally {
    thumbnailGenerationLock = false;
    // 处理队列中的下一个任务
    if (thumbnailQueue.length > 0) {
      processQueue();
    }
  }
}

/**
 * 计算指定矩形在画布中缩放到全屏的视口信息
 * @param canvas
 * @param target
 * @param xOffset
 * @param yOffset
 * @returns
 */
export function calculateViewportInfo(
  canvas: fabric.Canvas,
  target: any,
  xOffset: number = 0,
  yOffset: number = 0,
  isScreen: boolean = false,
) {
  // 保存当前视口变换
  const currentTransform = canvas.viewportTransform;
  // 重置视口变换，确保从原始状态开始计算
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  // 计算目标对象中心点
  const centerPoint = target.getCenterPoint();
  const targetCenterX = centerPoint.x;
  const targetCenterY = centerPoint.y;

  // 获取屏幕尺寸
  let viewportWidth = canvas.getWidth();
  let viewportHeight = canvas.getHeight();
  if (isScreen) {
    viewportWidth = window.screen.width * window.devicePixelRatio;
    viewportWidth = window.screen.height * window.devicePixelRatio;
  } else {
    viewportWidth = canvas.getWidth() || window.innerWidth - xOffset;
    viewportHeight = (canvas.getHeight() || window.innerHeight) - yOffset;
  }

  // 获取目标对象的边界矩形（考虑旋转等变换）
  const boundingRect = target.getBoundingRect();
  const targetWidth = boundingRect.width;
  const targetHeight = boundingRect.height;
  // 计算缩放比例，使目标对象与屏幕尺寸相同
  const scaleX = (viewportWidth * 0.99) / targetWidth;
  const scaleY = (viewportHeight * 0.99) / targetHeight;
  // 使用较小的缩放比例，确保对象完全适应屏幕
  const scale = Math.min(scaleX, scaleY);

  // 计算平移量：将目标中心点移动到画布中心点
  const translateX = viewportWidth / 2 - targetCenterX * scale;
  const translateY = viewportHeight / 2 - targetCenterY * scale;

  // 计算缩放后矩形在画布上的实际位置
  const scaledLeft = boundingRect.left * scale + translateX;
  const scaledTop = boundingRect.top * scale + translateY;
  const scaledWidth = targetWidth * scale;
  const scaledHeight = targetHeight * scale;

  // 计算视口变换矩阵
  const transform = [scale, 0, 0, scale, translateX, translateY];
  // 恢复原始视口变换，避免闪烁
  // canvas.setViewportTransform(currentTransform);

  return {
    transform,
    scale,
    centerX: targetCenterX,
    centerY: targetCenterY,
    width: targetWidth,
    height: targetHeight,
    left: boundingRect.left,
    top: boundingRect.top,
    right: boundingRect.left + targetWidth,
    bottom: boundingRect.top + targetHeight,
    scaledLeft: scaledLeft,
    scaledTop: scaledTop,
    scaledWidth: scaledWidth,
    scaledHeight: scaledHeight,
    currentTransform: currentTransform,
  };
}

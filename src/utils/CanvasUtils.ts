import * as fabric from "fabric";
import { Slides } from "../composables/slides/Slides";
import { EventBus, EventTypes } from "./EventBus";
import type { CanvasManager } from "../composables/canvas/CanvasManager";
import type { CustomCanvas } from "../composables/canvas/CustomCanvas";


let canvasManagerInstance: CanvasManager | null = null;


export function setCanvasManager(manager: CanvasManager) {
  canvasManagerInstance = manager;
  
}

export function getCanvasManager(): CanvasManager | null {
  return canvasManagerInstance;
}

export function setBackgroundImage(
  canvas: fabric.Canvas,
  image: HTMLImageElement
) {
  
  const bgImage = new fabric.FabricImage(image, {
    left: 0,
    top: 0,
    width: canvas.width!,
    height: canvas.height!,
    selectable: false,
    evented: false,
  });
  
  canvas.backgroundImage = bgImage;
  canvas.requestRenderAll();
  
  EventBus.emit(EventTypes.CANVAS.BACKGROUND_IMAGE_CHANGE, {
    canvas,
    image: bgImage,
  });
}

export function setBackgroundImageByUrl(canvas: fabric.Canvas, url: string) {
  
  
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

  
  canvas.add(loadingIndicator);
  canvas.requestRenderAll();

  fabric.FabricImage.fromURL(
    url,
    
    { crossOrigin: "anonymous" }
  ).then((img: any) => {
    
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    
    const scale = Math.max(
      canvasWidth / img.width!,
      canvasHeight / img.height!
    );
    img.scale(scale);
    
    img.set({
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
    });
    
    canvas.backgroundImage = img;
    
    canvas.remove(loadingIndicator);
    canvas.requestRenderAll();
    
    
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
  
  EventBus.emit(EventTypes.CANVAS.BACKGROUND_COLOR_CHANGE, { canvas, color });
}



export function findObjectsByPosition(
  canvas: fabric.Canvas,
  point: fabric.Point
): fabric.Object[] {
  const objects = canvas.getObjects();
  
  const objectsAtPosition: fabric.Object[] = [];

  
  const vpt = canvas.viewportTransform!;
  const zoom = canvas.getZoom();

  
  const canvasPoint = fabric.util.transformPoint(
    new fabric.Point(point.x, point.y),
    fabric.util.invertTransform(vpt)
  );


  
  const viewportBounds = {
    left: -vpt[4] / zoom,
    top: -vpt[5] / zoom,
    width: canvas.width! / zoom,
    height: canvas.height! / zoom,
  };

  
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];

    
    if (!obj.visible) continue;

    
    const bounds = obj.getBoundingRect();
    
    
    
    
    
    
    
    

    
    if (
      bounds.left > viewportBounds.left + viewportBounds.width ||
      bounds.left + bounds.width < viewportBounds.left ||
      bounds.top > viewportBounds.top + viewportBounds.height ||
      bounds.top + bounds.height < viewportBounds.top
    ) {
      continue; 
    }

    
    if (
      canvasPoint.x < bounds.left ||
      canvasPoint.x > bounds.left + bounds.width ||
      canvasPoint.y < bounds.top ||
      canvasPoint.y > bounds.top + bounds.height
    ) {
      continue; 
    }

    
    if (obj.containsPoint(canvasPoint)) {
      objectsAtPosition.push(obj);
    }
  }

  return objectsAtPosition;
}



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




export function isPointInObject(
  canvas: fabric.Canvas,
  obj: fabric.Object,
  pointer: { x: number; y: number }
): boolean {
  
  const zoom = canvas.getZoom();
  const vpt = canvas.viewportTransform!;
  const canvasPoint = fabric.util.transformPoint(
    new fabric.Point(pointer.x, pointer.y),
    fabric.util.invertTransform(vpt)
  );
  const bounds = obj.getBoundingRect();

  
  return (
    canvasPoint.x >= bounds.left &&
    canvasPoint.x <= bounds.left + bounds.width &&
    canvasPoint.y >= bounds.top &&
    canvasPoint.y <= bounds.top + bounds.height
  );
}



export function isPointOnRectBorder(canvas: CustomCanvas,
  point: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
  borderWidth: number = 10
): boolean {
  
  const vpt = canvas.viewportTransform!;
  const zoom = canvas.getZoom();

  
  const canvasPoint = fabric.util.transformPoint(
    new fabric.Point(point.x, point.y),
    fabric.util.invertTransform(vpt)
  );

  
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  
  const adjustedBorderWidth = borderWidth / zoom;
  
  const halfBorderWidth = (adjustedBorderWidth) / 2;

  const offsetCorrection = 0.5;
  const outerLeft = rect.left - halfBorderWidth + offsetCorrection;
  const outerTop = rect.top - halfBorderWidth + offsetCorrection;
  const outerRight = right + halfBorderWidth + offsetCorrection;
  const outerBottom = bottom + halfBorderWidth + offsetCorrection;

  const innerLeft = rect.left + halfBorderWidth + offsetCorrection;
  const innerTop = rect.top + halfBorderWidth + offsetCorrection;
  const innerRight = right - halfBorderWidth + offsetCorrection;
  const innerBottom = bottom - halfBorderWidth + offsetCorrection;

  
  const isInsideOuterRect =
    canvasPoint.x >= outerLeft &&
    canvasPoint.x <= outerRight &&
    canvasPoint.y >= outerTop &&
    canvasPoint.y <= outerBottom;

  
  const isInsideInnerRect =
    canvasPoint.x >= innerLeft &&
    canvasPoint.x <= innerRight &&
    canvasPoint.y >= innerTop &&
    canvasPoint.y <= innerBottom;

  
  
  
  
  

  
  return isInsideOuterRect && !isInsideInnerRect;
}



export function findTargetObject(canvas: CustomCanvas, point: fabric.Point) {
  const targets = findObjectsByPosition(canvas, point);
  const slidesTarget = targets.find((obj) => {
    const isPointOnBorder = isPointOnRectBorder(canvas, point, obj, 10)
    return obj instanceof Slides && isPointOnBorder;
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




let thumbnailGenerationLock = false;
const thumbnailQueue: Array<() => Promise<void>> = [];

export async function generateReliableThumbnail(
  canvas: fabric.Canvas,
  thumbnailCanvas: HTMLCanvasElement,
  rect?: fabric.FabricObject
): Promise<void> {
  
  const task = async () => {
    if (!canvas) return;
    const opts = {
      waitForRender: true,
    };

    if (!canvas) return;
    
    const originalTransform: any = canvas.viewportTransform?.slice() || [
      1, 0, 0, 1, 0, 0,
    ];
    const originalZoom = canvas.getZoom();

    try {
      
      const viewportInfo: any = calculateViewportInfo(canvas, rect as fabric.FabricObject);
      const ctx = thumbnailCanvas.getContext("2d");
      if (!ctx) return;

      
      canvas.setViewportTransform(viewportInfo.transform);

      
      await new Promise<void>((resolve) => {
        if (opts.waitForRender) {
          
          requestAnimationFrame(() => {
            
            canvas.renderAll();

            
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

      
      thumbnailCanvas.width = viewportWidth;
      thumbnailCanvas.height = viewportHeight;

      
      
      
      
      
      
      
      
      
      

      
      ctx.clearRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

      
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
      console.error("生成缩略图失败:", e);
      return;
    } finally {
      
      canvas.setViewportTransform(originalTransform);
      canvas.setZoom(originalZoom);
    }
  };

  
  return new Promise<void>((resolve, reject) => {
    thumbnailQueue.push(async () => {
      try {
        await task();
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    
    processQueue();
  });
}


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
    
    if (thumbnailQueue.length > 0) {
      processQueue();
    }
  }
}


export function calculateViewportInfo(
  canvas: fabric.Canvas,
  target: fabric.FabricObject,
  xOffset: number = 0,
  yOffset: number = 0,
  isScreen: boolean = false,
) {
  
  const currentTransform = canvas.viewportTransform;
  
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  
  const centerPoint = target.getCenterPoint();
  const targetCenterX = centerPoint.x;
  const targetCenterY = centerPoint.y;
  
  let viewportWidth = canvas.getWidth();
  let viewportHeight = canvas.getHeight();
  if (isScreen) {
    viewportWidth = window.screen.width * window.devicePixelRatio;
    viewportHeight = window.screen.height * window.devicePixelRatio;
  } else {
    viewportWidth = canvas.getWidth() || window.innerWidth - xOffset;
    viewportHeight = (canvas.getHeight() || window.innerHeight) - yOffset;
  }

  
  const boundingRect = target.getBoundingRect();
  const targetWidth = boundingRect.width;
  const targetHeight = boundingRect.height;

  
  
  const scaleX = (viewportWidth * 1) / targetWidth;
  const scaleY = (viewportHeight * 1) / targetHeight;
  
  const scale = Math.min(scaleX, scaleY);

  
  const translateX = viewportWidth / 2 - targetCenterX * scale;
  const translateY = viewportHeight / 2 - targetCenterY * scale;

  
  const scaledLeft = boundingRect.left * scale + translateX;
  const scaledTop = boundingRect.top * scale + translateY;
  const scaledWidth = targetWidth * scale;
  const scaledHeight = targetHeight * scale;

  
  const transform = [scale, 0, 0, scale, translateX, translateY];
  
  

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

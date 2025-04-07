
import { ref } from "vue";
import * as fabric from "fabric";
import { PresentPlayManager } from "../present/PresentPlayManager";
import type { PlayAction } from "../present/Present";
import { PageFrame } from "../slides/PageFrame";
import { Frame } from "../slides/Frame";

export enum EditorMode {
  EDIT = "edit",
  PRESENT = "present",
}

export class ModeManager {
  private currentMode = ref<EditorMode>(EditorMode.EDIT);
  private canvas: any;
  private presentationCanvas: any;

  private presentPlayManager: PresentPlayManager | null = null;
  private lastPosX = 0;
  private lastPosY = 0;
  private isDragging = false;

  constructor(canvas: any, presentationCanvas: any) {
    this.canvas = canvas;
    this.presentationCanvas = presentationCanvas;
    this.initPresentationMode();


    this.initPresentationEvents();

    document.addEventListener(
      "fullscreenchange",
      this.handleFullscreenChange.bind(this)
    );


    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  private initPresentationMode() {


  }

  private handleFullscreenChange() {

    if (
      !document.fullscreenElement &&
      this.currentMode.value === EditorMode.PRESENT
    ) {
      this.exitPresentMode();
    }
  }


  private initPresentationEvents() {

    this.presentationCanvas.on("mouse:down", (opt: any) => {
      this.isDragging = true;
      this.lastPosX = opt.e.clientX;
      this.lastPosY = opt.e.clientY;
      this.presentationCanvas.defaultCursor = "grabbing";
    });

    this.presentationCanvas.on("mouse:move", (opt: any) => {
      if (this.isDragging) {
        const deltaX = opt.e.clientX - this.lastPosX;
        const deltaY = opt.e.clientY - this.lastPosY;

        const vpt = this.presentationCanvas.viewportTransform!;
        vpt[4] += deltaX;
        vpt[5] += deltaY;

        this.presentationCanvas.setViewportTransform(vpt);
        this.lastPosX = opt.e.clientX;
        this.lastPosY = opt.e.clientY;
      }
    });

    this.presentationCanvas.on("mouse:up", () => {
      this.isDragging = false;
      this.presentationCanvas.defaultCursor = "default";
    });


    this.presentationCanvas.on("mouse:wheel", (opt: any) => {
      const delta = opt.e.deltaY;
      let zoom = this.presentationCanvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(0.1, zoom), 20);

      const point = {
        x: opt.e.offsetX,
        y: opt.e.offsetY,
      };

      this.presentationCanvas.zoomToPoint(
        new fabric.Point(point.x, point.y),
        zoom
      );
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }

  public async enterPresentMode() {
    this.currentMode.value = EditorMode.PRESENT;


    this.showPresentationCanvas();

    this.presentPlayManager = new PresentPlayManager(this.presentationCanvas);


    const playActions: PlayAction[] = [];


    this.presentationCanvas.forEachObject((obj: any) => {
      obj.selectable = true;
      obj.lockMovementX = true;
      obj.lockMovementY = true;
      obj.lockRotation = true;
      obj.lockScalingX = true;
      obj.lockScalingY = true;
      obj.hasControls = false;
      obj.hasBorders = true;













    });


    const pageFrame = this.presentationCanvas
      .getObjects()
      .find((obj: any) => obj.type === PageFrame.type);

    if (pageFrame) {
      playActions.push({
        type: "pageframe",
        target: pageFrame,
      });
    }
    const frames = this.presentationCanvas
      .getObjects()
      .filter((obj: any) => obj.type === Frame.type);

    frames.sort((a: any, b: any) => {
      return (a.order || 0) - (b.order || 0);
    });

    frames.forEach((frame: any) => {
      playActions.push({
        type: "frame",
        target: frame,
      });
    });

    this.presentPlayManager.play(playActions);
  }

  public exitPresentMode() {
    this.currentMode.value = EditorMode.EDIT;

    if (this.presentPlayManager) {
      this.presentPlayManager.destroy();
      this.presentPlayManager = null;
    }
    this.hidePresentationCanvas();
  }

  public async cloneCanvasContent() {


    this.presentationCanvas.clear();
    this.presentationCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const objects = this.canvas.getObjects();


    for (const obj of objects) {

      try {
        await obj.clone("type", "name").then((clonedObj: any) => {

          if (obj.type === "pageframe" || obj.type === "frame") {
            clonedObj.set({
              stroke: "transparent",
              shadow: null,
              strokeWidth: 0,
            });
          }


          clonedObj.set({
            left: obj.left,
            top: obj.top,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            angle: obj.angle,

            selectable: true,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            hasControls: true,
            hasBorders: true,
          });



          this.presentationCanvas.add(clonedObj);
        });
      } catch (error) {
        console.error(`克隆对象失败: ${obj.type}, id: ${obj.id}`, error);
      }
    }

    console.log(
      `演示画布现在有 ${this.presentationCanvas.getObjects().length} 个对象`
    );

    this.presentationCanvas.requestRenderAll();
  }

  private showPresentationCanvas() {

    if (this.canvas.wrapperEl) {
      this.canvas.wrapperEl.style.display = "none";
    }


    if (this.presentationCanvas.wrapperEl) {
      const wrapper = this.presentationCanvas.wrapperEl;

      Object.assign(wrapper.style, {
        display: "block",
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "9999",
        backgroundColor: "#fff",
      });

      this.ensureCanvasLayersVisible();
    }


    this.enterFullscreen();


    this.adjustPresentationSize();

    this.presentationCanvas.requestRenderAll();
  }


  private ensureCanvasLayersVisible() {

    const lowerCanvas = this.presentationCanvas.lowerCanvasEl;
    if (lowerCanvas) {
      lowerCanvas.style.display = "block";
      lowerCanvas.style.visibility = "visible";
    }


    const upperCanvas = this.presentationCanvas.upperCanvasEl;
    if (upperCanvas) {
      upperCanvas.style.display = "block";
      upperCanvas.style.visibility = "visible";
    }


    const cacheCanvas = this.presentationCanvas.cacheCanvasEl;
    if (cacheCanvas) {
      cacheCanvas.style.display = "block";
      cacheCanvas.style.visibility = "visible";
    }
  }


  private hidePresentationCanvas() {

    this.exitFullscreen();

    if (this.presentationCanvas.wrapperEl) {
      this.presentationCanvas.wrapperEl.style.display = "none";
    }


    if (this.canvas.wrapperEl) {
      this.canvas.wrapperEl.style.display = "block";
    }
  }




























  private handleKeyDown(e: KeyboardEvent) {
    if (this.currentMode.value !== EditorMode.PRESENT) return;
    switch (e.key) {
      case "Escape":
        this.exitPresentMode();
        break;
    }
  }


  private handleResize() {
    if (this.currentMode.value === EditorMode.PRESENT) {
      this.adjustPresentationSize();
    }
  }

  private adjustPresentationSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;


    this.presentationCanvas.setDimensions({ width, height });

    this.presentationCanvas.requestRenderAll();

    this.ensureCanvasLayersVisible();
  }

  private async enterFullscreen() {
    try {
      if (this.presentationCanvas.wrapperEl) {
        if (this.presentationCanvas.wrapperEl.requestFullscreen) {
          await this.presentationCanvas.wrapperEl.requestFullscreen();
        }
      }
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
    }
  }

  private async exitFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Failed to exit fullscreen:", error);
    }
  }
}

// import 'fabric';

// declare module 'fabric' {
//   namespace fabric {
//     // 扩展 fabric 命名空间，添加 Slides 类
//     class Slides extends Rect {
//       static type: string;
//       canvas: fabric.Canvas;
//       customBorderColor: string;
//       customControls: string[];
//       controlsVisibilityMap: Record<string, boolean>;
      
//       constructor(options: any);
//       initializeControls(): void;
//       thumbnail(): Promise<string | null>;
//       setControlVisibility(controlKey: string, visible: boolean): void;
//       setControlsVisibilityBatch(controlsMap: Record<string, boolean>): void;
//     }
    
//     // 添加 Frame 类
//     class Frame extends Slides {
//       static type: string;
//       id: string;
//       parentPage: any;
//       contents: Set<any>;
//       _originalLeft: number;
//       _originalTop: number;
//       order: number;
//       isCurrentSelected: boolean;
      
//       constructor(options: any);
//       initFrameNumberControl(): void;
//       setNumberControlVisibility(isShow: boolean): void;
//       isMouseOverControl(e: any): boolean;
//       updateContents(): void;
//       addContent(object: any): void;
//       removeContent(object: any): void;
//       setOrder(order: number): void;
//       toggleContentSelectable(selectable: boolean): void;
//     }
    
//     // 添加 PageFrame 类
//     class PageFrame extends Slides {
//       static type: string;
//       initialLeft: number;
//       initialTop: number;
      
//       constructor(options: any);
//       initializeControls(): void;
//     }
//   }
// }
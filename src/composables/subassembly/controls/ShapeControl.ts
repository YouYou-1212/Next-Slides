import * as fabric from 'fabric';
import { ControlProxy } from '../ControlProxy';

export class ShapeControl extends fabric.FabricObject {
  static type = 'ShapeControl';
  private controlProxy: ControlProxy;
  
  static create(type: string, options: any) {
    let shape;
    const defaultOptions = {
      cornerSize: 8,
      cornerColor: "#1890ff",
      cornerStyle: "circle",
      transparentCorners: false,
      lockRotation: true,
      hasRotatingPoint: false,
      padding: 0,
      borderColor: "#1890ff",
      
      ...options
    };

    switch (type) {
      case "square":
      case "rect":
        shape = new fabric.Rect(defaultOptions);
        shape.type = "Control_Rect";
        break;
      case "circle":
        shape = new fabric.Circle(defaultOptions);
        shape.type = "Control_Circle";
        break;
      case "triangle":
        shape = new fabric.Triangle(defaultOptions);
        shape.type = "Control_Triangle";
        break;
      case "line":
        shape = new fabric.Line([0, 0, defaultOptions.width, 0], {
          ...defaultOptions,
          stroke: defaultOptions.stroke || "#333",
          strokeWidth: defaultOptions.strokeWidth || 2
        });
        shape.type = "Control_Line";
        break;
      case "arrow":
        const arrowWidth = defaultOptions.width || 100;
        const headSize = 20;
        const points = [
          { x: 0, y: 0 },                           
          { x: arrowWidth - headSize, y: 0 },       
          { x: arrowWidth - headSize, y: -10 },     
          { x: arrowWidth, y: 0 },                  
          { x: arrowWidth - headSize, y: 10 },      
          { x: arrowWidth - headSize, y: 0 }        
        ];
        shape = new fabric.Polyline(points, {
          ...defaultOptions,
          fill: 'transparent',
          stroke: defaultOptions.stroke || "#333",
          strokeWidth: defaultOptions.strokeWidth || 2,
          strokeLineJoin: 'round',
          strokeLineCap: 'round'
        });
        shape.type = "Control_Arrow";
        break;
    }

    if (shape) {
      
      Object.defineProperty(shape, 'type', {
        value: ShapeControl.type,
        configurable: false,
        writable: false
      });

      
      shape.setControlsVisibility({
        mtr: false,
      });
    }

    return shape;
  }

constructor(){
  super();
  this.controlProxy = new ControlProxy(this);
}

}
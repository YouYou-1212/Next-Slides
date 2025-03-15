import { COLORS, SIZES } from "../../../constants/theme";
import * as fabric from "fabric";

export class ImageControl extends fabric.FabricImage {
  static type = "image";

  static async create(url: string, options: any) {

    return new Promise((resolve, reject) => {
      // 设置默认以中心点为基准
      const defaultOptions = {
        originX: 'center',
        originY: 'center',
        //内边距
        padding: 0,
        ...options
      };
      ImageControl.fromURL(url, { crossOrigin: 'anonymous' }, defaultOptions).then((fabricImage) => {
        resolve(fabricImage);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  constructor(element: HTMLImageElement, options: any) {
    const defaultOptions = {
      cornerSize: SIZES.CORNER_SIZE,
      cornerColor: COLORS.PRIMARY,
      cornerStyle: "circle",
      transparentCorners: false,
      hasRotatingPoint: false,
      padding: 0,
      borderColor: COLORS.PRIMARY,
      lockRotation: true,
      // 添加缩放相关配置
      lockScalingX: false,
      lockScalingY: false,
      lockUniScaling: false,  // 允许非等比缩放
      ...options,
    };

    super(element, defaultOptions);

    // 隐藏旋转控制点
    this.setControlsVisibility({
      mtr: false,
    });

    // 设置对象类型
    Object.defineProperty(this, 'type', {
      value: ImageControl.type,
      configurable: false,
      writable: false
    });
  }
}


export interface PageFrameOptions {
    width: number
    height: number
    left: number
    top: number
    fill: string
    shadow?: string
    hasControls?: boolean
    lockRotation?: boolean
    lockScalingX?: boolean
    lockScalingY?: boolean
    selectable?: boolean
  }
  
  export interface FrameOptions {
    id?: string
    width: number
    height: number
    left: number
    top: number
    
    strokeWidth?: number
    shadow?: string
    stroke?: string
    hasControls?: boolean
    parentPage?: any
    order?: number
  }

  export interface FrameNumberStyle {
    selectable?: boolean;
    evented?: boolean;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
    width?: number;
    height?: number;
    paddingX?: number;
    offset?: {
      x: number;
      y: number;
    };
  }

  export interface FrameContent {
    id: string
    type: string
    data: any
  }
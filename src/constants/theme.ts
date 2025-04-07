

export const PAGE_SIZE = {
  FRAME: {
    WIDTH: 426.67, 
    HEIGHT: 240,  
  },
  PAGE_FRAME: {
    WIDTH: 1280,
    HEIGHT: 720,
  },
};


export const SLIDE_STYLES = {
  COMMON: {
    FILL: "transparent",
    
    SHADOW: {
      COLOR: "#747C87",
      OFFSET_Y: 4,
      BLUR: 12,
    },
  },
};


export const LIMITS = {
  PAGE: {
    MIN_WIDTH: 400,
    MIN_HEIGHT: 300,
    MAX_WIDTH: 2000,
    MAX_HEIGHT: 1500,
  },
};


export const PERFORMANCE = {
  UPDATE_INTERVAL: 32, 
};


export const COLORS = {
  
  PRIMARY: "#3564FF",
  TRANSPARENT: "transparent",
  
  
  TEXT: "#333333",

  
  BORDER: {
    DEFAULT: "transparent",
    HOVER: "#3564FF",
    SLIDES_HOVER: "#2ecc71",
    SLIDES_SELECTED: "#2ecc71",
    SLIDES_DEFAULT: "#111111",
    SELECTED: "#3564FF",
    UNSELECTED: "#747C87",  
  },

  
  BACKGROUND: {
    DEFAULT: "#ffffff",
    HOVER: "#f0f0f0",
  },
};


export const SIZES = {
  PADDING_0: 0,
  PADDING_5: 5,
  CORNER_SIZE: 8,
  STROKE_WIDTH: 1,
  BORDER_LINE_WIDTH_TEXT: 1.5,
  BORDER_SCALE_FACTOR: 1,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 100,
};


export const STYLES = {
  CORNER: {
    STYLE: "circle" as "rect" | "circle",
    SLIDES_DEFAULT_COLOR: COLORS.BORDER.SLIDES_DEFAULT,
    COLOR: COLORS.BORDER.SELECTED,
    SLIDES_COLOR: COLORS.BORDER.SLIDES_SELECTED,
    SIZE: SIZES.CORNER_SIZE,
    TRANSPARENT: false,
  },
};

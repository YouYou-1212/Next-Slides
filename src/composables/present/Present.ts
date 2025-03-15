export interface PlayAction {
    type: 'pageframe' | 'frame' | 'animation';
    target: any;
    options?: any;
  }
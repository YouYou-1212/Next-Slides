  /**
   * 菜单项配置接口
   */
  export interface MenuItemConfig {
    label: string;
    action: () => void;
    icon?: string;
    disabled?: boolean;
    separator?: boolean;
  }
export interface TbLog {
  module: 'tb-phototag-lib';
  type: 'info' | 'success' | 'warning' | 'error';
  message_fr: string;
  description?: string;
}

export interface TbLog {
  module: 'tb-tag-lib';
  type: 'info' | 'success' | 'warning' | 'error';
  message_fr: string;
  description?: string;
}

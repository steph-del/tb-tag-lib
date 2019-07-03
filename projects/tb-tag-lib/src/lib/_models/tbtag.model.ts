export interface TbTag {
  id: number;
  userId: number;
  name: string;
  path: string;
  objectId?: number;
  pending?: boolean;
  unlinking?: boolean;
}

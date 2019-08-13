export interface TbTag {
  id: number;
  userId: number;
  name: string;
  path: string;
  objectId?: number;
  pending?: boolean;
  depth?: number;
  children?: Array<TbTag>;
  selected?: boolean;
  loading?: boolean;
  linking?: boolean;
  unlinking?: boolean;
}

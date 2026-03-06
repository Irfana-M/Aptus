export const SlotType = {
  GROUP : 'group',
  ONE_TO_ONE : 'one-to-one',
}as const;
export type SlotType =
  (typeof SlotType)[keyof typeof SlotType];

export type CheckoutOrderProduct = {
  id: string;
  title: string;
  quantity: number;
  imageUrl: string | null;
  modifierSummary: string | null;
  lineTotalFormatted: string;
};

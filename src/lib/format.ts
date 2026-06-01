export function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumberID(amount: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    amount,
  );
}


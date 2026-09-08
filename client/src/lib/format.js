export function formatMoney(value) {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

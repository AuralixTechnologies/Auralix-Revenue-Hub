export const formatINR = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getStatusBadgeStyle = (status: string): string => {
  const s = status ? status.toLowerCase() : '';
  if (s === 'paid' || s === 'completed' || s === 'active') {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
  if (s === 'partially paid' || s === 'in progress') {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  if (s === 'pending') {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }
  if (s === 'overdue' || s === 'cancelled' || s === 'inactive') {
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }
  return 'bg-slate-700/30 text-slate-300 border-slate-600/30';
};

import moment from 'moment';

export const formatDate = (date) => {
  if (!date) return '—';
  const m = moment(date);
  return m.isValid() ? m.format('MMM D, YYYY') : '—';
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  const m = moment(date);
  return m.isValid() ? m.format('MMM D, YYYY, h:mm A') : '—';
};

export const formatDateFromNow = (date) => {
  if (!date) return '—';
  return moment(date).fromNow();
};

export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

export const statusColors = {
  // Lead statuses
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  proposal: 'bg-orange-100 text-orange-700',
  negotiation: 'bg-pink-100 text-pink-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  // User roles
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-purple-100 text-purple-700',
  sales: 'bg-blue-100 text-blue-700',
  support: 'bg-teal-100 text-teal-700',
  // Generic active
  true: 'bg-green-100 text-green-700',
  false: 'bg-gray-100 text-gray-500',
};

export const sourceColors = {
  website: 'bg-emerald-100 text-emerald-700',
  referral: 'bg-blue-100 text-blue-700',
  social_media: 'bg-pink-100 text-pink-700',
  email_campaign: 'bg-orange-100 text-orange-700',
  cold_call: 'bg-cyan-100 text-cyan-700',
  event: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-50 text-gray-400',
};

export const capitalize = (str) =>
  str ? str.charAt(0)?.toUpperCase() + str?.slice(1)?.replace(/_/g, ' ') : '';

export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const objectToQueryString = (obj) => {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  return params.toString();
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const avatarColors = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500',
  'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];

export const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
};

export const debounce = (fn, ms = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

export const buildColumnFilters = (params, colFilters) => {
  Object.entries(colFilters).forEach(([k, config]) => {
    if (!config || !config.operator) return;

    const { operator, value, value2 } = config;

    // Skip if value is missing (unless it's an operator that doesn't need one)
    const valMissing = (value === undefined || value === '');
    const isUnary = ['is_empty', 'is_not_empty'].includes(operator);

    if (valMissing && !isUnary) {
      return; 
    }

    switch (operator) {
      // Text
      case 'is':
        params.set(k, value);
        break;
      case 'isn\'t':
        params.set(`${k}[ne]`, value);
        break;
      case 'contains':
        params.set(`${k}[regex]`, value);
        params.set(`${k}[options]`, 'i');
        break;
      case 'not_contains':
        params.set(`${k}[not_regex]`, value);
        break;
      case 'starts_with':
        params.set(`${k}[regex]`, `^${value}`);
        params.set(`${k}[options]`, 'i');
        break;
      case 'ends_with':
        params.set(`${k}[regex]`, `${value}$`);
        params.set(`${k}[options]`, 'i');
        break;
      case 'is_empty':
        params.set(`${k}[is_empty]`, 'true');
        break;
      case 'is_not_empty':
        params.set(`${k}[is_not_empty]`, 'true');
        break;
      case 'in':
        if (Array.isArray(value) && value.length > 0) {
          params.set(`${k}[in]`, value.join(','));
        }
        break;
      
      // Numbers & Dates
      case 'equals':
      case 'equals_text':
        params.set(k, value);
        break;
      case 'gt':
        params.set(`${k}[gt]`, value);
        break;
      case 'lt':
        params.set(`${k}[lt]`, value);
        break;
      case 'between':
        if (value && value2) {
          params.set(`${k}[gte]`, value);
          params.set(`${k}[lte]`, value2);
        } else if (value) {
          // If only start date/value is provided, treat as >=
          params.set(`${k}[gte]`, value);
        }
        break;
      default:
        break;
    }
  });
  return params;
};

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\\//g, '&#x2F;') // Handle escaped slashes
    .trim();
}

export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  return phone.replace(/[^\d+]/g, '');
}

export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  const sanitized = sanitizeInput(email.toLowerCase().trim());
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
}

export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  return sanitizeInput(name)
    .replace(/[^a-zA-Z0-9\s\-']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    return '';
  }
  return sanitizeInput(address)
    .replace(/[^a-zA-Z0-9\s\.,\-/#()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return sanitizeInput(text).substring(0, 1000);
}

export function sanitizeNumber(value: string): number | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const sanitized = value.replace(/[^\d.]/g, '');
  const num = parseFloat(sanitized);
  return isNaN(num) ? null : num;
}

export function sanitizeDate(date: string): string {
  if (!date || typeof date !== 'string') {
    return '';
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date) ? date : '';
}

export function sanitizeArray(arr: any[]): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(item => sanitizeInput(item.trim()));
}

// Additional security functions
export function validateAndSanitizeId(id: any): number | null {
  if (!id) return null;
  const numId = parseInt(id.toString());
  return (isNaN(numId) || numId <= 0) ? null : numId;
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'number') {
      sanitized[key] = isNaN(value) ? 0 : value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = Boolean(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = sanitizeArray(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

export function rateLimitKey(ip: string, endpoint: string): string {
  return `rate_limit:${ip}:${endpoint}`;
}

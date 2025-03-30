 /**
 * Format currency amount with proper thousands separators and decimal places
 */
export function formatCurrency(amount: number, currency = 'KRW', locale = 'ko-KR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }
  
  /**
   * Format date in a localized format
   */
  export function formatDate(date: Date | string, locale = 'ko-KR'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  }
  
  /**
   * Mask sensitive information like account numbers
   */
  export function maskAccountNumber(accountNo: string): string {
    if (!accountNo || accountNo.length < 4) return accountNo;
    return accountNo.substring(0, 4) + '*'.repeat(accountNo.length - 4);
  }
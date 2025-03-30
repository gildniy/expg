 /**
 * Validate Korean mobile phone number
 */
export function isValidKoreanMobileNumber(phone: string): boolean {
    const regex = /^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/;
    return regex.test(phone.replace(/-/g, ''));
  }
  
  /**
   * Validate Korean bank code
   */
  export function isValidKoreanBankCode(bankCode: string): boolean {
    const validBankCodes = [
      '002', // KDB
      '003', // IBK
      '004', // KB
      '007', // Suhyup
      '011', // NH
      '020', // Woori
      '023', // SC
      '027', // Citibank
      '031', // Daegu
      '032', // Busan
      '034', // Gwangju
      '035', // Jeju
      '037', // Jeonbuk
      '039', // Kyongnam
      '045', // Saemaul
      '048', // Specialty
      '071', // Postgiro
      '081', // KEB Hana
      '088', // Shinhan
      '089', // K Bank
      '090', // Kakao Bank
    ];
  
    return validBankCodes.includes(bankCode);
  }
  
  /**
   * Validate email address
   */
  export function isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
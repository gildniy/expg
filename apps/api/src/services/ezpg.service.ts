import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Service for interacting with the EZPG payment gateway API
 * Handles virtual accounts, withdrawals, transactions, and notification validations
 */
@Injectable()
export class EzpgService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Creates a virtual account in the EZPG system
   *
   * @param data - Object containing virtual account creation parameters
   * @returns Object with the created virtual account details and transaction ID
   * @throws HttpException if the API call fails
   */
  async createVirtualAccount(data: {
    merchantId: string;
    bankCd: string;
    accountNo: string;
    accountName: string;
    fixYn: string;
    depositAmt: number;
    currency: string;
  }): Promise<{
    transactionId: string;
    bankCd: string;
    accountNo: string;
    accountName: string;
    userSeq: string;
  }> {
    try {
      const response = await axios.post(
        `${this.configService.get('EZPG_API_URL')}/virtual-accounts`,
        {
          merchantId: data.merchantId,
          bankCd: data.bankCd,
          accountNo: data.accountNo,
          accountName: data.accountName,
          fixYn: data.fixYn,
          depositAmt: data.depositAmt,
          currency: data.currency,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.configService.get('EZPG_API_KEY')}`,
          },
        },
      );

      return {
        transactionId: response.data.transactionId,
        bankCd: response.data.bankCd,
        accountNo: response.data.accountNo,
        accountName: response.data.accountName,
        userSeq: response.data.userSeq,
      };
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create virtual account',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves the status of a virtual account from EZPG
   *
   * @param virtualAccountId - The ID of the virtual account to check
   * @returns The virtual account status details
   * @throws HttpException if the API call fails
   */
  async getVirtualAccountStatus(virtualAccountId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.configService.get('EZPG_API_URL')}/virtual-accounts/${virtualAccountId}/status`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('EZPG_API_KEY')}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Initiates a withdrawal through the EZPG system
   *
   * @param data - Object containing withdrawal details
   * @returns Object with transaction ID and status of the withdrawal
   * @throws HttpException if the API call fails
   */
  async withdraw(data: {
    amount: number;
    bankCd: string;
    accountNo: string;
    accountName: string;
  }): Promise<{
    transactionId: string;
    status: string;
  }> {
    try {
      const response = await axios.post(
        `${this.configService.get('EZPG_API_URL')}/withdrawals`,
        {
          amount: data.amount,
          bankCd: data.bankCd,
          accountNo: data.accountNo,
          accountName: data.accountName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.configService.get('EZPG_API_KEY')}`,
          },
        },
      );

      return {
        transactionId: response.data.transactionId,
        status: response.data.status,
      };
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to process withdrawal',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Retrieves transaction details from EZPG
   *
   * @param transactionId - The ID of the transaction to retrieve
   * @returns The transaction details
   * @throws HttpException if the API call fails
   */
  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.configService.get('EZPG_API_URL')}/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('EZPG_API_KEY')}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Validates a deposit notification received from EZPG
   *
   * @param notification - The notification object to validate
   * @returns Boolean indicating if the notification is valid
   * @throws HttpException if the API call fails
   */
  async validateDepositNotification(notification: any): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.configService.get('EZPG_API_URL')}/notifications/deposit/validate`,
        notification,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('EZPG_API_KEY')}`,
          },
        },
      );
      return response.data.isValid;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Validates a withdrawal notification received from EZPG
   *
   * @param notification - The notification object to validate
   * @returns Boolean indicating if the notification is valid
   * @throws HttpException if the API call fails
   */
  async validateWithdrawalNotification(notification: any): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.configService.get('EZPG_API_URL')}/notifications/withdrawal/validate`,
        notification,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('EZPG_API_KEY')}`,
          },
        },
      );
      return response.data.isValid;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handles errors from EZPG API calls and throws appropriate HttpExceptions
   *
   * @param error - The error object to handle
   * @throws HttpException with appropriate status and message
   */
  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      throw new HttpException(
        error.response?.data?.message || 'EZPG API error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    throw new HttpException('EZPG API error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

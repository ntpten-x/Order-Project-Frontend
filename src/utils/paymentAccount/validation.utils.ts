/**
 * Shared validation utilities for Payment Accounts
 */

/**
 * Validates if a string is a valid 10-digit phone/PromptPay number
 * @param value The string to validate
 * @returns boolean
 */
export const isValidPhoneNumber = (value: string): boolean => {
    return /^\d{10}$/.test(value);
};

/**
 * Filters input to allow only digits and limit length
 * Useful for onKeyPress or onChange handlers
 * @param value The raw input value
 * @param maxLength Maximum allowed length
 * @returns Filtered numeric string
 */
export const filterNumericInput = (value: string, maxLength: number = 10): string => {
    return value.replace(/\D/g, '').slice(0, maxLength);
};

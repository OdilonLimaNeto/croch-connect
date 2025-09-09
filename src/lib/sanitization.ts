import DOMPurify from 'dompurify';
import { z } from 'zod';

/**
 * Sanitization utility to prevent XSS attacks and ensure data integrity
 */
export class DataSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true 
    });
  }

  /**
   * Sanitize text input by removing potentially harmful characters
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>\"'&]/g, '') // Remove potentially harmful characters
      .replace(/^\s+|\s+$/g, '') // Remove leading/trailing spaces but keep internal spaces
      .slice(0, 1000); // Limit length to prevent buffer overflow
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^\w@.-]/g, '') // Keep only valid email characters
      .slice(0, 254); // RFC 5321 email length limit
  }

  /**
   * Sanitize phone number input
   */
  static sanitizePhone(phone: string): string {
    if (typeof phone !== 'string') return '';
    
    return phone
      .replace(/[^\d\s\-\(\)\+]/g, '') // Keep only phone-related characters
      .trim()
      .slice(0, 20);
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: string | number): string {
    if (typeof input === 'number') return input.toString();
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[^\d.,\-]/g, '') // Keep only numeric characters
      .trim()
      .slice(0, 20);
  }

  /**
   * Comprehensive form data sanitization
   */
  static sanitizeFormData<T extends Record<string, any>>(data: T): T {
    const sanitized = { ...data } as Record<string, any>;

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (key.toLowerCase().includes('phone')) {
          sanitized[key] = this.sanitizePhone(value);
        } else if (key.toLowerCase().includes('price') || key.toLowerCase().includes('amount')) {
          sanitized[key] = this.sanitizeNumber(value);
        } else {
          sanitized[key] = this.sanitizeText(value);
        }
      }
    }

    return sanitized as T;
  }
}

/**
 * Enhanced Zod schemas with sanitization
 */
export const createSafeSchema = {
  email: () => z.string()
    .transform(DataSanitizer.sanitizeEmail)
    .pipe(z.string().email('Email inválido')),
    
  text: (minLength = 1, maxLength = 1000) => z.string()
    .transform(DataSanitizer.sanitizeText)
    .pipe(z.string().min(minLength, `Mínimo ${minLength} caracteres`).max(maxLength, `Máximo ${maxLength} caracteres`)),
    
  phone: () => z.string()
    .transform(DataSanitizer.sanitizePhone)
    .pipe(z.string().optional()),
    
  number: () => z.string()
    .transform(DataSanitizer.sanitizeNumber)
    .pipe(z.string().regex(/^\d+([.,]\d+)?$/, 'Número inválido')),
    
  currency: () => z.string()
    .transform(DataSanitizer.sanitizeNumber)
    .pipe(z.string().regex(/^\d+([.,]\d{1,2})?$/, 'Valor monetário inválido'))
};
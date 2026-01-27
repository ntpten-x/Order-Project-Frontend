import { formatCurrency, formatDateKeys } from '@/utils/format.utils';

describe('Format Utilities', () => {
    describe('formatCurrency', () => {
        it('should format numbers correctly as Thai Baht', () => {
            // Use regex or toContain to ignore non-breaking space (\u00A0) often used by Intl.NumberFormat
            expect(formatCurrency(100)).toMatch(/฿\s?100\.00/);
            expect(formatCurrency(1000.5)).toMatch(/฿\s?1,000\.50/);
            expect(formatCurrency(0)).toMatch(/฿\s?0\.00/);
        });

        it('should handle negative numbers', () => {
            const result = formatCurrency(-100);
            expect(result).toContain('100.00');
            expect(result).toContain('฿');
        });
    });

    describe('formatDateKeys', () => {
        it('should format date correctly in Thai', () => {
            const date = new Date('2024-01-01T00:00:00Z');
            const formatted = formatDateKeys(date);
            // Ignore spaces/NBSP
            expect(formatted.replace(/\s/g, ' ')).toContain('2567');
            expect(formatted.replace(/\s/g, ' ')).toContain('มกราคม');
        });
    });
});

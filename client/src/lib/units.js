/**
 * Unit Conversion Utilities
 * 
 * Constants and helpers for converting between Metric (mm) and Imperial (in) units.
 * All canonical storage in the DB and calculation logic uses Metric (mm).
 */

export const UNITS = {
    LENGTH: {
        MM: 'mm',
        IN: 'in'
    },
    AREA: {
        MM2: 'mm2',
        IN2: 'in2'
    },
    SPEED: {
        MM_MIN: 'mm_min',
        IN_MIN: 'in_min'
    }
};

const CONVERSION_FACTORS = {
    // Length: in -> mm
    LENGTH: 25.4,
    // Area: in² -> mm² (25.4 * 25.4)
    AREA: 645.16,
    // Speed: in/min -> mm/min
    SPEED: 25.4,
};

/**
 * Parse a number that might be a fraction, decimal, or mixed number.
 * Supports:
 * - Decimals: "0.125", "10.5"
 * - Fractions: "1/8", "3/16"
 * - Mixed: "1 1/4", "1-1/4"
 * 
 * @param {string|number} input - The input value
 * @returns {number} The parsed number, or NaN if invalid
 */
export function parseFractionalInput(input) {
    if (typeof input === 'number') return input;
    if (!input || typeof input !== 'string') return NaN;

    const trimmed = input.trim();
    if (trimmed === '') return NaN;

    // Check for "1 1/4" or "1-1/4" (mixed number)
    const mixedMatch = trimmed.match(/^(\d+)[-\s]+(\d+)\/(\d+)$/);
    if (mixedMatch) {
        const whole = parseInt(mixedMatch[1], 10);
        const num = parseInt(mixedMatch[2], 10);
        const den = parseInt(mixedMatch[3], 10);
        if (den === 0) return NaN;
        return whole + (num / den);
    }

    // Check for simple fraction "1/8"
    const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
        const num = parseInt(fractionMatch[1], 10);
        const den = parseInt(fractionMatch[2], 10);
        if (den === 0) return NaN;
        return num / den;
    }

    // If it contains '/' but didn't match patterns above, it's invalid
    if (trimmed.includes('/')) return NaN;

    // Attempt standard float parse
    return parseFloat(trimmed);
}

/**
 * Convert a value from a specific unit to the canonical metric unit.
 * 
 * @param {string|number} value - The input value (e.g., "1/8", "0.125")
 * @param {string} unit - The unit of the input value ('mm', 'in', 'in2', etc.)
 * @returns {number} The canonical metric value
 */
export function toCanonical(value, unit) {
    if (value === '' || value === null || value === undefined) return 0;

    // Use fractional parser instead of parseFloat
    const num = parseFractionalInput(value);
    if (isNaN(num)) return 0;

    switch (unit) {
        case UNITS.LENGTH.IN:
            return num * CONVERSION_FACTORS.LENGTH; // in -> mm
        case UNITS.LENGTH.MM:
            return num;

        case UNITS.AREA.IN2:
            return num / CONVERSION_FACTORS.AREA; // $/in² -> $/mm²

        case UNITS.AREA.MM2:
            return num;

        case UNITS.SPEED.IN_MIN:
            return num * CONVERSION_FACTORS.SPEED; // in/min -> mm/min
        case UNITS.SPEED.MM_MIN:
            return num;

        default:
            return num;
    }
}

/**
 * Convert a canonical metric value to a specific unit for display.
 * 
 * @param {number} canonicalValue - The stored metric value
 * @param {string} targetUnit - The unit to display in
 * @returns {number} The value in the target unit
 */
export function fromCanonical(canonicalValue, targetUnit) {
    if (canonicalValue === '' || canonicalValue === null || canonicalValue === undefined) return 0;

    switch (targetUnit) {
        case UNITS.LENGTH.IN:
            return canonicalValue / CONVERSION_FACTORS.LENGTH; // mm -> in
        case UNITS.LENGTH.MM:
            return canonicalValue;

        case UNITS.AREA.IN2:
            return canonicalValue * CONVERSION_FACTORS.AREA; // $/mm² -> $/in²

        case UNITS.AREA.MM2:
            return canonicalValue;

        case UNITS.SPEED.IN_MIN:
            return canonicalValue / CONVERSION_FACTORS.SPEED; // mm/min -> in/min
        case UNITS.SPEED.MM_MIN:
            return canonicalValue;

        default:
            return canonicalValue;
    }
}

/**
 * Format value with high precision for inputs, stripping trailing zeros if needed
 */
export function formatInput(value) {
    if (!value && value !== 0) return '';
    if (typeof value === 'string') return value; // Pass through strings (display values)
    return parseFloat(value.toFixed(6)).toString();
}

/**
 * Calculate price based on DXF metrics and pricing configuration
 * 
 * @param {Object} metrics - DXF metrics { width, height, totalLength, area }
 * @param {Object} pricingEntry - Pricing config { costPerArea, costPerTime, cutSpeed }
 * @param {Object} settings - Global settings { markup, minCharge, currency }
 * @returns {Object} Price breakdown
 */
export function calculatePrice(metrics, pricingEntry, settings) {
    if (!metrics || !pricingEntry || !settings) {
        return createEmptyBreakdown(settings?.currency || 'USD');
    }

    const { width, height, totalLength, area } = metrics;
    const { costPerArea, costPerTime, cutSpeed } = pricingEntry;
    const { markup = 0, minCharge = 0, currency = 'USD' } = settings;

    // Calculate area cost (bounding box area * cost per mm²)
    const effectiveArea = area || (width * height);
    const areaCost = effectiveArea * costPerArea;

    // Calculate time cost (total cut length / speed * hourly rate)
    const cutTimeMinutes = cutSpeed > 0 ? totalLength / cutSpeed : 0;
    const cutTimeHours = cutTimeMinutes / 60;
    const timeCost = cutTimeHours * costPerTime;

    // Subtotal before markup
    const subtotal = areaCost + timeCost;

    // Apply markup percentage
    const markupAmount = subtotal * (markup / 100);
    const withMarkup = subtotal + markupAmount;

    // Apply minimum charge
    const finalPrice = Math.max(withMarkup, minCharge);

    return {
        areaCost,
        timeCost,
        subtotal,
        markupPercent: markup,
        markupAmount,
        withMarkup,
        finalPrice,
        minChargeApplied: withMarkup < minCharge,
        minCharge,
        currency,
        // Details for display
        details: {
            area: effectiveArea,
            cutLength: totalLength,
            cutTimeMinutes,
            cutSpeed,
            costPerArea,
            costPerTime,
        }
    };
}

/**
 * Create empty price breakdown
 */
function createEmptyBreakdown(currency = 'USD') {
    return {
        areaCost: 0,
        timeCost: 0,
        subtotal: 0,
        markupPercent: 0,
        markupAmount: 0,
        withMarkup: 0,
        finalPrice: 0,
        minChargeApplied: false,
        minCharge: 0,
        currency,
        details: {
            area: 0,
            cutLength: 0,
            cutTimeMinutes: 0,
            cutSpeed: 0,
            costPerArea: 0,
            costPerTime: 0,
        }
    };
}

/**
 * Format currency value
 */
export function formatCurrency(value, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format number with units
 */
export function formatNumber(value, unit = '', decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) return '—';
    return `${value.toFixed(decimals)}${unit ? ' ' + unit : ''}`;
}

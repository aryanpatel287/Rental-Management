export function calculateDuration(startDate, endDate, rentPeriod = 'Day') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    
    if (isNaN(diffMs) || diffMs <= 0) return 0;

    switch (rentPeriod) {
        case 'Hour':
            return Math.ceil(diffMs / (1000 * 60 * 60));
        case 'Week':
            return Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
        case 'Day':
        default:
            return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }
}

export function calculateRental(duration, price, quantity) {
    return Number((duration * price * quantity).toFixed(2));
}

export function calculateGST(subtotal) {
    return Number((subtotal * 0.18).toFixed(2));
}

export function calculateDeposit(product, variant, quantity) {
    // If we have a variant price or product sale price or cost price, use 10%
    const basePrice = Number(variant?.price || product?.salePrice || product?.costPrice || 0);
    const depositPerUnit = basePrice > 0 ? Number((basePrice * 0.10).toFixed(2)) : 5000;
    return Number((depositPerUnit * quantity).toFixed(2));
}

export function calculateCartSummary(items) {
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const deposit = items.reduce((sum, item) => sum + (item.deposit || 0), 0);
    const gst = calculateGST(subtotal);
    const discount = 0;
    const grandTotal = Number((subtotal + gst + deposit - discount).toFixed(2));

    return {
        subtotal,
        gst,
        deposit,
        discount,
        grandTotal
    };
}

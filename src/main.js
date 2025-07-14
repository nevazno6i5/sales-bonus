/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции
    const discount = 1 - (purchase.discount / 100);
    return _product.sale_price * (purchase.quantity || 1) * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    if(index === 0) {
        return 0.15;
    }
    else if(index ===1 || index ===2) {
        return 0.10;
    }
    else if (index === total - 1) {
        return 0;
    }
    else {
        return 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций
    if (!options || typeof options.calculateRevenue !== 'function' || typeof options.calculateBonus !== 'function') {
    throw new Error('Опции должны содержать функции calculateRevenue и calculateBonus');
}
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller =>({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
        top_products: {},   
        bonus: 0
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(data.sellers.map(seller  => [seller.id, seller]));
    const productIndex = {}; 
    data.products.forEach(product => { productIndex[product.sku] = product;
    });

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) {
            console.warn(`Продавец ${record.seller_id} не найден`);
            return;
        }

        const sellerStat = sellerStats.find(s => s.seller_id === record.seller_id);
        if (!sellerStat) return;

        sellerStat.sales_count += 1;
        sellerStat.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) {
                console.warn(`Товар с SKU ${item.sku} не найден, пропускаем`);
                return;
            } 

            const cost = product.purchase_price * (item.quantity || 1);
            const revenue = options.calculateRevenue(item, product);
            const profit = revenue - cost;

            sellerStat.profit += profit;
            totalCost += cost;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += (item.quantity || 1);
    });
});

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);

    sellerStats.forEach(sellerStat => {
    sellerStat.top_products = Object.entries(sellerStat.products_sold || {})
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    });

    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));

    // @TODO: Назначение премий на основе ранжирования


    // @TODO: Подготовка итоговой коллекции с нужными полями
}
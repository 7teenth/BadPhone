document.getElementById('dataForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Запобігаємо перезавантаженню сторінки

    const category = document.getElementById('category').value;
    const itemname = document.getElementById('itemname').value;
    const shtrihcode = document.getElementById('shtrihcode').value;
    const buy_price = document.getElementById('buy_price').value;
    const sale_price = document.getElementById('sale_price').value;
    const quantity = document.getElementById('quantity').value;

    // Створення або оновлення Excel-файлу
    const wb = XLSX.utils.book_new(); // Створюємо нову книгу
    const data = [["Категорія", "Найменування","Штрихкод","Ціна закупки","Ціна продажу","Кількість"],
        [category, itemname,shtrihcode,buy_price,sale_price,quantity]]; // Дані для Excel
    const ws = XLSX.utils.aoa_to_sheet(data); // Перетворюємо дані у формат Excel
    XLSX.utils.book_append_sheet(wb, ws, "Дані"); // Додаємо лист у книгу

    // Завантаження Excel-файлу
    XLSX.writeFile(wb, 'data.xlsx');

    document.getElementById('status').textContent = "Дані збережено";
});

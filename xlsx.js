document.addEventListener("DOMContentLoaded", function() {
    const exportButton = document.getElementById('exportButton');

    // Проверка на существование кнопки
    if (exportButton) {
        exportButton.addEventListener('click', function () {
            console.log("Кнопка нажата!"); // Проверка срабатывания обработчика

            // Получаем данные из формы
            const category = document.getElementById('category').value;
            const itemname = document.getElementById('itemname').value;
            const shtrihcode = document.getElementById('shtrihcode').value;
            const buy_price = document.getElementById('buy_price').value;
            const sale_price = document.getElementById('sale_price').value;
            const quantity = document.getElementById('quantity').value;

            // Проверка, чтобы все поля были заполнены
            if (!category || !itemname || !shtrihcode || !buy_price || !sale_price || !quantity) {
                alert("Будь ласка, заповніть всі поля!");
                return;
            }

            // Формируем массив данных для Excel
            const data = [
                ["Категорія", "Найменування", "Штрихкод", "Ціна закупки", "Ціна продажу", "Кількість"],
                [category, itemname, shtrihcode, buy_price, sale_price, quantity]
            ];

            // Создаём новую книгу и лист
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(data); // Преобразуем массив в лист

            // Добавляем лист в книгу
            XLSX.utils.book_append_sheet(wb, ws, "Товари");

            // Генерация и сохранение Excel-файла
            XLSX.writeFile(wb, "товари.xlsx");
        });
    } else {
        console.log("Кнопка не найдена.");
    }
});

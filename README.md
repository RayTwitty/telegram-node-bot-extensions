# telegram-node-bot-extensions
Этот небольшой проект представляет собой расширения стандартного функционала для библиотеки [telegram-node-bot](https://github.com/Naltox/telegram-node-bot).

## Установка
Добавление пакета в проект через [npm](https://www.npmjs.com):
```bash
npm install --save telegram-node-bot-extensions
```
Инициализация модуля:
```js
require('telegram-node-bot-extensions')(Telegram, tg)
```
## Мульти-формы
Вы можете создавать сложные формы с высокой степенью вложенности. Используйте `$.runMultiForm` для запуска.
```js
const form = {
	category: {
		question: 'Выбери категорию',
		error: 'Ты неправильно ввел категорию!',
		keyboard: [['Курьер', 'Ремонт']],
		'Курьер': {
			subcategory: {
				question: 'Выбери подкатегорию',
				error: 'Ты неправильно ввел подкатегорию!',
				keyboard: [['Пеший курьер', 'Доставка продуктов']]
			},
			size: {
				question: 'Установить размер посылки?',
				keyboard: [['Да', 'Нет']],
				values: {'Да': true, 'Нет': false},
				'Да': {
					length: {
						question: 'Задай длину посылки (см)',
						validator: (message) => {
							return Number.isInteger(parseInt(message.text))
						}
					},
					width: {
						question: 'Задай ширину посылки (см)',
						validator: (message) => {
							return Number.isInteger(parseInt(message.text))
						}
					}
				}
			},
			weight: {
				question: 'Задай вес посылки',
				validator: (message) => {
					return Number.isInteger(parseInt(message.text))
				}
			}
		},
		'Ремонт': {
			subcategory: {
				question: 'Выбери подкатегорию',
				keyboard: [['Ремонт мебели', 'Отделочные работы']]
			}
		}
	},
	contacts: {
		question: 'Оставить контакты?',
		keyboard: [['Да', 'Нет']]
	}
}

const config = {
	buttons: {
		cancel: 'Отменить',
		back: 'Назад'
	},
	messages: {
		canceled: 'Заполнение формы отменено.',
		completed: 'Форма успешно заполнена.'
	},
	disable_notification: true,
	disable_web_page_preview: true,
	parse_mode: 'HTML'
}

$.runMultiForm(form, result => {
	console.log(result)
}, config)
```
### Структура формы
Каждая форма состоит из вопросов, на которые должен ответить пользователь. Каждый вопрос должен включать в себя текст вопроса и ответ на него. В качестве проверки ответа выступает функция-валидатор, возвращающая логическое значение, либо текст из кнопок клавиатуры. Если указано и то и другое, функция-валидатор будет иметь приоритет.
```js
...
	validator: (message) => {
		return Number.isInteger(parseInt(message.text))
	}
...
```
В случае, если ответ не прошел проверку, может быть выведено сообщение об ошибке, которое устанавливается полем `error`.
```js
...
	question: 'Выбери подкатегорию',
	error: 'Ты неправильно ввел подкатегорию!',
...
```
При каждом правильном ответе на вопрос производится поиск дочерней формы, объект которой называется именем этого ответа.
```js
...
	question: 'Выбери категорию',
	error: 'Ты неправильно ввел категорию!',
	keyboard: [['Курьер', 'Ремонт']],
	'Курьер': {...},
	'Ремонт': {...}
...
```
Есть возможность переопределения текстовых значений, которые будут записаны в результат. Для этого служит поле `values`.
```js
...
	question: 'Установить размер посылки?',
	keyboard: [['Да', 'Нет']],
	values: {'Да': true, 'Нет': false},
...
```
### Настройка формы
Доступна установка дополнительных параметров формы через конфиг, который можно передать в конструктор.
```js
const config = {
	buttons: {
		cancel: 'Отменить',
		back: 'Назад'
	},
	messages: {
		canceled: 'Заполнение формы отменено.',
		completed: 'Форма успешно заполнена.'
	},
	disable_notification: true,
	disable_web_page_preview: true,
	parse_mode: 'HTML'
}
```
В объекте `buttons` задается использование кнопок. Можно включить кнопки отмены и возвращения к предыдущему вопросу. Аналогичным образом, в объекте `messages` можно включить сообщения при завершении и при отмене формы.

Помимо этого, доступен к изменению ряд стандартных параметров: `disable_notification`, `disable_web_page_preview` и `parse_mode`.

Важно отметить, что конфиг совершенно опционален. Все функции, которыми он управляет по умолчанию выключены. Поэтому, если вы не хотите, допустим, использовать кнопку "Назад", просто не указывайте ее в конфиге.

## Инлайновое меню с вкладками
Для создания такого меню можно воспользоваться методом `$.runInlineTabsMenu`.
```js
const tabs = [
	{
		message: 'Первая вкладка',
		menu: [
			[
				{text: 'Один', callback: callbackQuery => console.log('one')},
				{text: 'Два', callback: callbackQuery => console.log('two')}
			],
			[
				{text: 'Три', callback: callbackQuery => console.log('three')}
			]
		]
	},
	{
		message: 'Вторая вкладка',
		menu: [
			[
				{text: 'Четыре', callback: callbackQuery => console.log('four')}
			],
			[
				{text: 'Пять', callback: callbackQuery => console.log('five')}
			]
		]
	},
	{
		message: 'Третья вкладка'
	},
	{
		message: 'Четвертая вкладка'
	},
	{
		message: 'Пятая вкладка'
	},
	{
		message: 'Шестая вкладка'
	}
]

const config = {
	title: '<b>Заголовок</b>',
	max_buttons: 5,
	disable_notification: true,
	disable_web_page_preview: true,
	parse_mode: 'HTML'
}

$.runInlineTabsMenu(tabs, config)
```
### Структура меню
Массив вкладок содержит объекты, которые описывают каждую отдельную вкладку. В свою очередь, вкладка должна содержать текст (поле `message`) и может содержать меню с инлайновыми кнопками (поле `menu`).
```js
...
	message: 'Первая вкладка',
	menu: [
		[
			{text: 'Один', callback: callbackQuery => console.log('one')},
			{text: 'Два', callback: callbackQuery => console.log('two')}
		],
		[
			{text: 'Три', callback: callbackQuery => console.log('three')}
		]
	]
...
```
Меню описывает набор строк и кнопок в них. Каждая кнопка должна содержать текст (поле `text`) и функцию-колбек (поле `callback`), которая будет вызвана при нажатии на эту кнопку.
```js
...
	{text: 'Один', callback: callbackQuery => console.log('one')}
...
```
### Настройка меню
В конфиге, который передается вторым необязательным параметром в конструктор, можно задать использование заголовка (поле `title`), который будет добавляться перед текстом вкладки. Поле `max_buttons` устанавливает максимальное количество кнопок для навигации по вкладкам (по умолчанию **5**). Количество кнопок должно быть нечетным.
```js
const config = {
	title: '<b>Заголовок</b>',
	max_buttons: 5,
	disable_notification: true,
	disable_web_page_preview: true,
	parse_mode: 'HTML'
}
```
Также можно установить значения для стандартных параметров: `disable_notification`, `disable_web_page_preview` и `parse_mode`.

## Инлайновые клавиатуры
Появился простой механизм для создания инлайновых клавиатур:
```js
let keyboard = $.genInlineKeyboard('Один', 'one', 'Два', 'two')
$.sendMessage('Выбери действие', {reply_markup: keyboard})
```
Метод `$.genInlineKeyboard` генерирует инлайновую клавиатуру из переданных пар аргументов: первый параметр устанавливает текст кнопки, второй устанавливает данные (`callback_data`). Оба переданных значения должны быть строкового типа.

Также параметры могут быть переданы в виде массива:
```js
let buttons = ['Один', 'one', 'Два', 'two']
$.sendMessage('Выбери действие', {reply_markup: $.genInlineKeyboard(buttons)})
```
Можно использовать вложенные массивы для создания нескольких кнопок на одной строке:
```js
let buttons = [['Один', 'one'], ['Два', 'two', 'Три', 'three'], 'Четыре', 'four', ['Пять', 'five']]
$.sendMessage('Выбери действие', {reply_markup: $.genInlineKeyboard(buttons)})
```

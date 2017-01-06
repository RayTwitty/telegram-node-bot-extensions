'use strict'

require('js-standard-library-extensions')

module.exports = (Telegram, tg) => {
	require('./MultiForm')(Telegram, tg)
	require('./InlineTabsMenu')(Telegram, tg)
	require('./InlineKeyboard')(Telegram, tg)
}

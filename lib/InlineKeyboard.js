//////////////////////////////////////////////////////////
/*
	telegram-node-bot-extensions
	module: InlineKeyboard.js
	author: Evgeniy Litvinov <raytwitty@gmail.com>
	license: MIT licensed
*/
//////////////////////////////////////////////////////////

'use strict'

module.exports = (Telegram, tg) => {
	class InlineKeyboardScopeExtension extends Telegram.BaseScopeExtension {
		process() {
			let args = Array.isArray(arguments[0]) ? arguments[0] : arguments
			let keyboard = {inline_keyboard: []}

			for (let i = 0; i < args.length; i++) {
				let value = args[i]
				let buttons = []

				if (Array.isArray(value)) {
					for (let j = 0; j < value.length; j = j + 2) {
						buttons.push({
							text: value[j],
							callback_data: value[j + 1]
						})
					}
				} else {
					buttons.push({
						text: args[i],
						callback_data: args[i + 1]
					})

					i++
				}

				keyboard.inline_keyboard.push(buttons)
			}

			return JSON.stringify(keyboard)
		}

		get name() {
			return 'genInlineKeyboard'
		}
	}

	tg.addScopeExtension(InlineKeyboardScopeExtension)
}

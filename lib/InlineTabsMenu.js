//////////////////////////////////////////////////////////
/*
	telegram-node-bot-extensions
	module: InlineTabsMenu.js
	author: Evgeniy Litvinov <raytwitty@gmail.com>
	license: MIT licensed
*/
//////////////////////////////////////////////////////////

'use strict'

module.exports = (Telegram, tg) => {
	class InlineTabsMenuScopeExtension extends Telegram.BaseScopeExtension {
		process(tabs, config) {
			let cur_idx = 0, message_id
			const max_idx = tabs.length - 1
			const max_buttons = config && config.max_buttons || 5
			const len = tabs.length > max_buttons ? max_buttons : tabs.length

			if (max_buttons % 2 == 0)
				throw new Error('max_buttons should be odd!')

			let getStartIndex = () => {
				if (cur_idx > max_idx || cur_idx < 0)
					throw new Error('Invalid index!')

				let idx = 0

				if (tabs.length > max_buttons) {
					let offset = Math.floor(max_buttons / 2)
					let offset_l = cur_idx - offset
					let offset_r = cur_idx + offset

					idx = Math.clamp(offset_l, max_idx)

					if (offset_r > max_idx)
						idx -= offset_r - max_idx
				}

				return idx
			}

			let runMenu = () => {
				let idx = getStartIndex()
				let keyboard = {inline_keyboard: []}
				let buttons = []

				for (let i = 0; i < len; i++) {
					let n = idx + i

					let text
					if (!i && n) {
						n = 0
						text = '«1'
					}
					else if (i == len - 1 && n != max_idx) {
						n = max_idx
						text = `${n + 1}»`
					}

					if (!text)
						text = cur_idx == n ? `·${n + 1}·` : `${n + 1}`

					let token = Math.random().toString(36).substring(7)
					buttons.push({text: text, callback_data: token})

					this.waitForCallbackQuery(token, callbackQuery => {
						cur_idx = n
						runMenu()
					})
				}

				keyboard.inline_keyboard.push(buttons)

				let tab = tabs[cur_idx]
				if (tab.menu) {
					for (let item of tab.menu) {
						buttons = []

						for (let button of item) {
							let token = Math.random().toString(36).substring(7)
							buttons.push({text: button.text, callback_data: token})

							this.waitForCallbackQuery(token, button.callback)
						}

						keyboard.inline_keyboard.push(buttons)
					}
				}

				let text = tab.message
				let options = {reply_markup: JSON.stringify(keyboard)}

				if (config) {
					if (config.title)
						text = `${config.title}\n${tab.message}`

					if (config.disable_notification)
						options.disable_notification = config.disable_notification

					if (config.disable_web_page_preview)
						options.disable_web_page_preview = config.disable_web_page_preview

					if (config.parse_mode)
						options.parse_mode = config.parse_mode
				}

				if (message_id)
					this.api.editMessageText(text, Object.assign(options, {chat_id: this.chatId, message_id: message_id}))
				else
					this.sendMessage(text, options).then(message => message_id = message.messageId)
			}

			runMenu()
		}

		get name() {
			return 'runInlineTabsMenu'
		}
	}

	tg.addScopeExtension(InlineTabsMenuScopeExtension)
}

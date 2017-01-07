//////////////////////////////////////////////////////////
/*
	telegram-node-bot-extensions
	module: MultiForm.js
	author: Evgeniy Litvinov <raytwitty@gmail.com>
	license: MIT licensed
*/
//////////////////////////////////////////////////////////

'use strict'

module.exports = (Telegram, tg) => {
	class MultiFormScopeExtension extends Telegram.BaseScopeExtension {
		process(root_form, callback, config) {
			root_form = Object.copy(root_form)
			let marked = []
			let answers = {}
			let options = {}
			const ignored = ['$name', '$parent', '$last', 'values']

			let checkKeyboard = (keyboard, answer) => {
				for (let value of keyboard) {
					if (value == answer || (Array.isArray(value) && checkKeyboard(value, answer)))
						return true
				}
			}

			let sendMsg = (text, keyboard) => {
				if (text) {
					this.sendMessage(text, Object.assign(options, {
						reply_markup: JSON.stringify(keyboard ? {
							one_time_keyboard: true,
							resize_keyboard: true,
							keyboard: keyboard
						} : {remove_keyboard: true})
					}))
				}
			}

			let makeMap = form => {
				let last
				Object.forEach(form, (key, value) => {
					if (ignored.indexOf(key) == -1 && isObject(value)) {
						makeMap(value)

						value.$name = key
						value.$parent = form
						value.$last = last
						last = value
					}
				})
			}

			let clearForm = form => {
				marked.remove(form.$name)

				Object.forEach(form, (key, value) => {
					if (ignored.indexOf(key) == -1 && isObject(value))
						clearForm(value)
				})
			}

			let runForm = form => {
				let question
				for (let key in form) {
					if (ignored.indexOf(key) == -1 && marked.indexOf(key) == -1) {
						question = key
						break
					}
				}

				let parent_form = form.$parent ? form.$parent.$parent : form.$parent

				if (!question) {
					if (parent_form)
						runForm(parent_form)
					else {
						if (config && config.messages)
							sendMsg(config.messages.completed)

						let result = {}
						for (let question of marked)
							result[question] = answers[question]

						callback(result)
					}
				}
				else {
					let item = form[question]
					let last_form = item.$last

					let keyboard = []
					if (item.keyboard)
						keyboard = item.keyboard.slice()

					let cancel = false
					let back = false

					if (config && config.buttons) {
						let buttons = []
						if (config.buttons.cancel) {
							buttons.push(config.buttons.cancel)
							cancel = true
						}

						if (config.buttons.back && (last_form || parent_form)) {
							buttons.push(config.buttons.back)
							back = true
						}

						if (buttons.length)
							keyboard.push(buttons)
					}

					sendMsg(item.question, keyboard)
					this.waitForRequest.then($ => {
						if (cancel && $.message.text == config.buttons.cancel) {
							if (config.messages)
								sendMsg(config.messages.canceled)

							callback({})
						}
						else if (back && $.message.text == config.buttons.back) {
							if (last_form) {
								clearForm(last_form)
								runForm(form)
							}
							else {
								clearForm(parent_form)
								runForm(parent_form)
							}
						}
						else {
							if (item.validator) {
								if (!item.validator($.message)) {
									sendMsg(item.error)
									return runForm(form)
								}
							}
							else if (!checkKeyboard(keyboard, $.message.text)) {
								sendMsg(item.error)
								return runForm(form)
							}

							marked.push(question)

							if ($.message.text)
								answers[question] = item.values ? item.values[$.message.text] : $.message.text
							else if ($.message.location)
								answers[question] = $.message.location
							else if ($.message.photo)
								answers[question] = $.message.photo
							else if ($.message.contact)
								answers[question] = $.message.contact.phoneNumber
							else
								throw new Error('Unsupported answer type!')

							runForm(item[$.message.text] || form)
						}
					})
				}
			}

			if (config) {
				if (config.disable_notification)
					options.disable_notification = config.disable_notification

				if (config.disable_web_page_preview)
					options.disable_web_page_preview = config.disable_web_page_preview

				if (config.parse_mode)
					options.parse_mode = config.parse_mode
			}

			makeMap(root_form)
			runForm(root_form)
		}

		get name() {
			return 'runMultiForm'
		}
	}

	tg.addScopeExtension(MultiFormScopeExtension)
}

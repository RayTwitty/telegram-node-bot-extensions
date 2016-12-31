//////////////////////////////////////////////////////////
/*
	module: extensions.js
	author: Evgeniy Litvinov (raytwitty@gmail.com)
	description: extensions of telegram-node-bot module
*/
//////////////////////////////////////////////////////////

'use strict'

module.exports = (Telegram, tg) => {
	class MultiFormScopeExtension extends Telegram.BaseScopeExtension {
		process(root_form, callback, config) {
			let marked = []
			let answers = {}
			let ignored = ['$name', '$parent', '$last', 'values']

			let checkKeyboard = (keyboard, answer) => {
				for (let value of keyboard) {
					if (value == answer || (Array.isArray(value) && checkKeyboard(value, answer)))
						return true
				}
			}

			let sendMsg = (text, keyboard) => {
				if (text) {
					this.sendMessage(text, {
						disable_web_page_preview: true,
						parse_mode: 'HTML',
						reply_markup: JSON.stringify(keyboard ? {
							one_time_keyboard: true,
							resize_keyboard: true,
							keyboard: keyboard
						} : {remove_keyboard: true})
					})
				}
			}

			let makeMap = form => {
				let last
				for (let key in form) {
					if (ignored.indexOf(key) == -1) {
						let field = form[key]

						if (typeof field == 'object' && !Array.isArray(field)) {
							makeMap(field)

							field.$name = key
							field.$parent = form
							field.$last = last
							last = field
						}
					}
				}
			}

			let clearForm = form => {
				let idx = marked.indexOf(form.$name)
				if (idx != -1)
					marked.splice(idx, 1)

				for (let key in form) {
					if (ignored.indexOf(key) == -1) {
						let field = form[key]

						if (typeof field == 'object' && !Array.isArray(field))
							clearForm(field)
					}
				}
			}

			let runForm = form => {
				let question
				for (let item in form) {
					if (ignored.indexOf(item) == -1 && marked.indexOf(item) == -1) {
						question = item
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
				} else {
					let last_form = form[question].$last

					let keyboard = []
					if (form[question].keyboard)
						keyboard = form[question].keyboard.slice()

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

					sendMsg(form[question].title, keyboard)
					this.waitForRequest.then($ => {
						if (cancel && $.message.text == config.buttons.cancel) {
							if (config.messages)
								sendMsg(config.messages.canceled)

							callback({})
						} else if (back && $.message.text == config.buttons.back) {
							if (last_form) {
								clearForm(last_form)
								runForm(form)
							} else {
								clearForm(parent_form)
								runForm(parent_form)
							}
						} else {
							if (form[question].validator) {
								if (!form[question].validator($.message)) {
									sendMsg(form[question].error)
									return runForm(form)
								}
							} else if (!checkKeyboard(keyboard, $.message.text)) {
								sendMsg(form[question].error)
								return runForm(form)
							}

							marked.push(question)

							if ($.message.text) {
								if (form[question].values)
									answers[question] = form[question].values[$.message.text]
								else
									answers[question] = $.message.text
							} else if ($.message.location)
								answers[question] = $.message.location
							else if ($.message.photo)
								answers[question] = $.message.photo
							else if ($.message.contact)
								answers[question] = $.message.contact.phoneNumber
							else
								throw new Error('Unsupported answer type!')

							if (form[question][$.message.text])
								runForm(form[question][$.message.text])
							else
								runForm(form)
						}
					})
				}
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

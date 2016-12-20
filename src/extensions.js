'use strict'

class MultiFormScopeExtension extends Telegram.BaseScopeExtension {
	process(root_form, config, callback) {
		let marked = []
		let result = {}

		let check = (keyboard, answer) => {
			for (let value of keyboard) {
				if (value == answer || (Array.isArray(value) && check(value, answer)))
					return true
			}
		}

		let msg = (text, keyboard) => {
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

		let getLast = (parent, current_form) => {
			for (let i in parent) {
				let form = parent[i]

				if (form == current_form && i)
					return parent[i - 1]
			}
		}

		let run = form => {
			let question
			for (let item in form) {
				if (marked.indexOf(item) == -1) {
					question = item
					break
				}
			}

			let parent = getParent(root_form, form)
			let parent_form = getParent(root_form, parent)
			let last_form = getLast(parent, form)

			if (!question) {
				if (parent_form)
					run(parent_form)
				else {
					// msg('final msg.') // TODO
					callback(result)
				}
			} else {
				let keyboard = []
				if (form[question].keyboard)
					keyboard = form[question].keyboard.slice()

				let cancel = false
				let back = false

				if (config) {
					let key = []
					if (config.cancel) {
						key.push(config.cancel.text)
						cancel = true
					}

					if (config.back && (last_form || parent_form)) {
						key.push(config.back.text)
						back = true
					}

					if (key.length)
						keyboard.push(key)
				}

				msg(form[question].title, keyboard)
				this.waitForRequest.then($ => {
					let answer = $.message.text

					if (cancel && answer == config.cancel.text) {
						msg(config.cancel.message)
						callback({})
					} else if (back && answer == config.back.text) {
						run(last_form ? last_form : parent_form)
						//if (parent_form)
							// TODO: clear marked
							// TODO: clear result
							//run(parent_form)
						//else
						//	run(form)
					} else {
						if (form[question].validator) {
							if (!form[question].validator($.message)) {
								msg(form[question].error)
								return run(form)
							}
						} else if (!check(keyboard, answer)) {
							msg(form[question].error)
							return run(form)
						}

						marked.push(question)
						if (form[question].values)
							result[question] = form[question].values[answer]
						else
							result[question] = answer

						if (form[question][answer])
							run(form[question][answer])
						else
							run(form)
					}
				})
			}
		}

		run(root_form)
	}

	get name() {
		return 'runMultiForm'
	}
}

module.exports = {
	MultiFormScopeExtension
}

let getParent = (rootObj, childObj) => {
	//if (rootObj == childObj)

	if (childObj) {
		for (let i in rootObj) {
			let key = rootObj[i]

			if (typeof key == 'object' && !Array.isArray(key)) {
				if (key == childObj)
					return rootObj

				let res = getParent(key, childObj)
				if (res)
					return res
			}
		}
	}
}

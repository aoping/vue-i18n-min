/* @flow */

import { install, Vue } from './install'
import {
    isNull,
    parseArgs,
    fetchChoice,
    remove
} from './util'
import BaseFormatter from './format'


export default class VueI18n {
    static install: () => void

    _vm: any
    _formatter: Formatter

    constructor(options: I18nOptions = {}) {
        const locale: Locale = options.locale || 'en-US'
        const messages: LocaleMessages = options.messages || {}

        this._vm = null
        this._formatter = new BaseFormatter()

        this._initVM({
            locale,
            messages
        })
    }

    _initVM(data: {
        locale: Locale,
        messages: LocaleMessages
    }): void {
        this._vm = new Vue({ data })
    }

    get vm(): any { return this._vm }

    get locale(): Locale { return this._vm.locale }
    set locale(locale: Locale): void {
        this._vm.$set(this._vm, 'locale', locale)
    }

    _getMessages(): LocaleMessages { return this._vm.messages }

    _interpolate(
        locale: Locale,
        message: LocaleMessageObject,
        key: Path,
        interpolateMode: string,
        values: any
    ): any {
        if (!message) { return null }

        const pathRet: string = message[key]
        if (Array.isArray(pathRet)) { return pathRet }

        let ret: mixed
        if (isNull(pathRet)) {
            return null
        } else {
            /* istanbul ignore else */
            if (typeof pathRet === 'string') {
                ret = pathRet
            } else {
                return null
            }
        }

        return !values ? ret : this._render(ret, interpolateMode, values)
    }

    _render(message: string, interpolateMode: string, values: any): any {
        const ret = this._formatter.interpolate(message, values)
        return interpolateMode === 'string' ? ret.join('') : ret
    }

    _translate(
        messages: LocaleMessages,
        locale: Locale,
        key: Path,
        interpolateMode: string,
        args: any
    ): any {
        let res: any =
            this._interpolate(locale, messages[locale], key, interpolateMode, args)

        if (!isNull(res)) {
            return res
        } else {
            return null
        }
    }

    _t(key: Path, _locale: Locale, messages: LocaleMessages, ...values: any): any {
        if (!key) { return '' }

        const parsedArgs = parseArgs(...values)
        const locale: Locale = parsedArgs.locale || _locale

        const ret: any = this._translate(
            messages, locale, key,
            'string', parsedArgs.params
        )
        return ret
    }

    _tc(
        key: Path,
        _locale: Locale,
        messages: LocaleMessages,
        choice ? : number,
        ...values: any
    ): any {
        if (!key) { return '' }
        if (choice === undefined) {
            choice = 1
        }
        return fetchChoice(this._t(key, _locale, messages, ...values), choice)
    }

}

VueI18n.install = install

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(VueI18n)
}
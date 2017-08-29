/* @flow */

import { install, Vue } from './install'
import {
    isNull,
    parseArgs,
    fetchChoice,
    looseClone,
    remove
} from './util'
import BaseFormatter from './format'


export default class VueI18n {
    static install: () => void

    _vm: any
    _formatter: Formatter
    _root: ? I18n

    constructor(options: I18nOptions = {}) {
        const locale: Locale = options.locale || 'en-US'
        const messages: LocaleMessages = options.messages || {}

        this._vm = null
        this._formatter = options.formatter || new BaseFormatter()
        this._root = options.root || null
        this._sync = options.sync === undefined ? true : !!options.sync


        this._initVM({
            locale,
            messages
        })
    }

    _initVM(data: {
        locale: Locale,
        messages: LocaleMessages
    }): void {
        const silent = Vue.config.silent
        Vue.config.silent = true
        this._vm = new Vue({ data })
        Vue.config.silent = silent
    }

    get vm(): any { return this._vm }

    get messages(): LocaleMessages { return looseClone(this._getMessages()) }

    get locale(): Locale { return this._vm.locale }
    set locale(locale: Locale): void {
        this._vm.$set(this._vm, 'locale', locale)
    }


    get formatter(): Formatter { return this._formatter }
    set formatter(formatter: Formatter): void { this._formatter = formatter }



    _getMessages(): LocaleMessages { return this._vm.messages }

    _interpolate(
        locale: Locale,
        message: LocaleMessageObject,
        key: Path,
        host: any,
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
            // if interpolateMode is **not** 'string' ('row'),
            // return the compiled data (e.g. ['foo', VNode, 'bar']) with formatter
        return interpolateMode === 'string' ? ret.join('') : ret
    }

    _translate(
        messages: LocaleMessages,
        locale: Locale,
        key: Path,
        host: any,
        interpolateMode: string,
        args: any
    ): any {
        let res: any =
            this._interpolate(locale, messages[locale], key, host, interpolateMode, args)

        if (!isNull(res)) {
            return res
        } else {
            return null
        }
    }

    _t(key: Path, _locale: Locale, messages: LocaleMessages, host: any, ...values: any): any {
        if (!key) { return '' }

        const parsedArgs = parseArgs(...values)
        const locale: Locale = parsedArgs.locale || _locale

        const ret: any = this._translate(
            messages, locale, key,
            host, 'string', parsedArgs.params
        )
        return ret
    }

    _tc(
        key: Path,
        _locale: Locale,
        messages: LocaleMessages,
        host: any,
        choice ? : number,
        ...values: any
    ): any {
        if (!key) { return '' }
        if (choice === undefined) {
            choice = 1
        }
        return fetchChoice(this._t(key, _locale, messages, host, ...values), choice)
    }

}

VueI18n.install = install

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(VueI18n)
}
/* @flow */

import { install, Vue } from './install'
import {
    isNull,
    parseArgs,
    fetchChoice,
    isPlainObject,
    looseClone,
    remove
} from './util'
import BaseFormatter from './format'


export default class VueI18n {
    static install: () => void

    _vm: any
    _formatter: Formatter
    _root: ? I18n
    _sync: boolean
    _missing: ? MissingHandler
    _watcher: any
    _i18nWatcher: Function
    _silentTranslationWarn: boolean
    _dateTimeFormatters: Object
    _numberFormatters: Object

    constructor(options: I18nOptions = {}) {
        const locale: Locale = options.locale || 'en-US'
        const messages: LocaleMessages = options.messages || {}

        this._vm = null
        this._formatter = options.formatter || new BaseFormatter()
        this._missing = options.missing || null
        this._root = options.root || null
        this._sync = options.sync === undefined ? true : !!options.sync

        this._silentTranslationWarn = options.silentTranslationWarn === undefined ?
            false :
            !!options.silentTranslationWarn
        this._dateTimeFormatters = {}
        this._numberFormatters = {}

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

    get missing(): ? MissingHandler { return this._missing }
    set missing(handler: MissingHandler): void { this._missing = handler }

    get formatter(): Formatter { return this._formatter }
    set formatter(formatter: Formatter): void { this._formatter = formatter }

    get silentTranslationWarn(): boolean { return this._silentTranslationWarn }
    set silentTranslationWarn(silent: boolean): void { this._silentTranslationWarn = silent }

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
        console.info(message)
        console.info(key)
        console.info(pathRet)
        if (Array.isArray(pathRet)) { return pathRet }

        let ret: mixed
        if (isNull(pathRet)) {
            /* istanbul ignore else */
            if (isPlainObject(message)) {
                ret = message[key]
                if (typeof ret !== 'string') {
                    if (process.env.NODE_ENV !== 'production' && !this._silentTranslationWarn) {
                        console.warn(`Value of key '${key}' is not a string!`)
                    }
                    return null
                }
            } else {
                return null
            }
        } else {
            /* istanbul ignore else */
            if (typeof pathRet === 'string') {
                ret = pathRet
            } else {
                if (process.env.NODE_ENV !== 'production' && !this._silentTranslationWarn) {
                    console.warn(`Value of key '${key}' is not a string!`)
                }
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

    t(key: Path, ...values: any): TranslateResult {
        return this._t(key, this.locale, this._getMessages(), null, ...values)
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

    tc(key: Path, choice ? : number, ...values: any): TranslateResult {
        return this._tc(key, this.locale, this._getMessages(), null, choice, ...values)
    }

}

VueI18n.install = install

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(VueI18n)
}
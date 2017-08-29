/* @flow */

export default function extend(Vue: any): void {
    Vue.prototype.$t = function(key: Path, args: any): TranslateResult {
        const i18n = this.$i18n
        return i18n._t(key, i18n.locale, i18n._getMessages(), args)
    }
    Vue.prototype.$tc = function(key: Path, choice ? : number, args: any): TranslateResult {
        const i18n = this.$i18n
        return i18n._tc(key, i18n.locale, i18n._getMessages(), choice, args)
    }
}
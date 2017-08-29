/* @flow */

import VueI18n from './index'
import { isPlainObject, merge } from './util'

export default {
    beforeCreate(): void {
        const options: any = this.$options
        if (options.i18n) {
            if (options.i18n instanceof VueI18n) {
                this._i18n = options.i18n
            }
        }
    },

    beforeDestroy(): void {
        if (!this._i18n) { return }
        this._i18n = null
    }
}
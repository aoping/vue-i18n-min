import extend from './extend'
import mixin from './mixin'

export let Vue

export function install(_Vue) {
    Vue = _Vue

    // already installed
    if (install.installed) {
        return
    }
    install.installed = true

    Object.defineProperty(Vue.prototype, '$i18n', {
        get() { return this._i18n }
    })

    extend(Vue)
    Vue.mixin(mixin)
}
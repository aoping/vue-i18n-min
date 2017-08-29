import extend from './extend'
import mixin from './mixin'
import component from './component'

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
    Vue.component(component.name, component)

    // use object-based merge strategy
    const strats = Vue.config.optionMergeStrategies
    strats.i18n = strats.methods
}
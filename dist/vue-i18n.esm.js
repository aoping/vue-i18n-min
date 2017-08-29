/*!
 * vue-i18n v1.0.0 
 * (c) 2017 undefined
 * Released under the MIT License.
 */
/*  */

function extend(Vue) {
    Vue.prototype.$t = function(key, args) {
        var i18n = this.$i18n;
        return i18n._t(key, i18n.locale, i18n._getMessages(), args)
    };
    Vue.prototype.$tc = function(key, choice  , args) {
        var i18n = this.$i18n;
        return i18n._tc(key, i18n.locale, i18n._getMessages(), choice, args)
    };
}

/*  */

/**
 * utilites
 */

function isObject(obj) {
    return obj !== null && typeof obj === 'object'
}



function isNull(val) {
    return val === null || val === undefined
}

function fetchChoice(message, choice) {
    /* istanbul ignore if */
    if (!message && typeof message !== 'string') { return null }
    var choices = message.split('|');
    if (choice === 1) { choice = 0; }
    else { choice = 1; }
    if (!choices[choice]) { return message }
    return choices[choice].trim()
}



var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn(obj , key) {
    return hasOwnProperty.call(obj, key)
}

function merge(target) {
    var arguments$1 = arguments;

    var output = Object(target);
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments$1[i];
        if (source !== undefined && source !== null) {
            var key = (void 0);
            for (key in source) {
                if (hasOwn(source, key)) {
                    if (isObject(source[key])) {
                        output[key] = merge(output[key], source[key]);
                    } else {
                        output[key] = source[key];
                    }
                }
            }
        }
    }
    return output
}

/*  */

var mixin = {
    beforeCreate: function beforeCreate() {
        var options = this.$options;
        if (options.i18n) {
            if (options.i18n instanceof VueI18n) {
                this._i18n = options.i18n;
            }
        }
    },

    beforeDestroy: function beforeDestroy() {
        if (!this._i18n) { return }
        this._i18n = null;
    }
};

var Vue;

function install(_Vue) {
    Vue = _Vue;

    // already installed
    if (install.installed) {
        return
    }
    install.installed = true;

    Object.defineProperty(Vue.prototype, '$i18n', {
        get: function get() { return this._i18n }
    });

    extend(Vue);
    Vue.mixin(mixin);
}

/*  */
var BaseFormatter = function BaseFormatter() {
    this._caches = Object.create(null);
};

BaseFormatter.prototype.interpolate = function interpolate (message, values) {
    var tokens = this._caches[message];
    console.log(tokens);
    if (!tokens) {
        tokens = parse(message);
        this._caches[message] = tokens;
    }
    return compile(tokens, values)
};

var RE_TOKEN_LIST_VALUE = /^(\d)+/;
var RE_TOKEN_NAMED_VALUE = /^(\w)+/;

function parse(format) {
    var tokens = [];
    var position = 0;

    var text = '';
    while (position < format.length) {
        var char = format[position++];
        if (char === '{') {
            if (text) {
                tokens.push({ type: 'text', value: text });
            }

            text = '';
            var sub = '';
            char = format[position++];
            while (char !== '}') {
                sub += char;
                char = format[position++];
            }

            var type = RE_TOKEN_LIST_VALUE.test(sub) ?
                'list' :
                RE_TOKEN_NAMED_VALUE.test(sub) ?
                'named' :
                'unknown';
            tokens.push({ value: sub, type: type });
        } else {
            text += char;
        }
    }

    text && tokens.push({ type: 'text', value: text });

    return tokens
}

function compile(tokens , values ) {
    var compiled = [];
    var index = 0;

    var mode = Array.isArray(values) ?
        'list' : isObject(values) ?
        'named' : 'unknown';
    if (mode === 'unknown') { return compiled }

    while (index < tokens.length) {
        var token = tokens[index];
        switch (token.type) {
            case 'text':
                compiled.push(token.value);
                break
            case 'list':
                if (mode === 'list') {
                    compiled.push(values[parseInt(token.value, 10)]);
                } else {
                    if (process.env.NODE_ENV !== 'production') {
                        console.warn(("Type of token '" + (token.type) + "' and format of value '" + mode + "' don't match!"));
                    }
                }
                break
            case 'named':
                if (mode === 'named') {
                    compiled.push((values)[token.value]);
                } else {
                    if (process.env.NODE_ENV !== 'production') {
                        console.warn(("Type of token '" + (token.type) + "' and format of value '" + mode + "' don't match!"));
                    }
                }
                break
            case 'unknown':
                if (process.env.NODE_ENV !== 'production') {
                    warn("Detect 'unknown' type of token!");
                }
                break
        }
        index++;
    }

    return compiled
}

/*  */

var VueI18n = function VueI18n(options) {
    if ( options === void 0 ) options = {};

    var locale = options.locale || 'en-US';
    var messages = options.messages || {};

    this._vm = null;
    this._formatter = new BaseFormatter();

    this._initVM({
        locale: locale,
        messages: messages
    });
};

var prototypeAccessors = { vm: {},locale: {} };
VueI18n.prototype._initVM = function _initVM (data) {
    this._vm = new Vue({ data: data });
};
prototypeAccessors.vm.get = function () { return this._vm };
prototypeAccessors.locale.get = function () { return this._vm.locale };
VueI18n.prototype._getMessages = function _getMessages () { return this._vm.messages };
VueI18n.prototype._interpolate = function _interpolate (
    message,
    key,
    interpolateMode,
    values
) {
    if (!message) { return null }

    var pathRet = message[key];
    var ret;
    if (typeof pathRet === 'string') {
        ret = pathRet;
    } else {
        return null
    }

    return !values ? ret : this._render(ret, interpolateMode, values)
};
VueI18n.prototype._render = function _render (message, interpolateMode, values) {
    var ret = this._formatter.interpolate(message, values);
    return interpolateMode === 'string' ? ret.join('') : ret
};
VueI18n.prototype._translate = function _translate (
    messages,
    locale,
    key,
    interpolateMode,
    args
) {
    var res =
        this._interpolate(messages[locale], key, interpolateMode, args);

    if (!isNull(res)) {
        return res
    } else {
        return null
    }
};
VueI18n.prototype._t = function _t (key, _locale, messages, args) {
    if (!key) { return '' }
    var ret = this._translate(
        messages, _locale, key,
        'string', args
    );
    return ret
};
VueI18n.prototype._tc = function _tc (
    key,
    _locale,
    messages,
    choice  ,
    args
) {
    if (!key) { return '' }
    if (choice === undefined) {
        choice = 1;
    }
    return fetchChoice(this._t(key, _locale, messages, args), choice)
};

Object.defineProperties( VueI18n.prototype, prototypeAccessors );

VueI18n.install = install;
if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(VueI18n);
}

export default VueI18n;

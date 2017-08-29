/*!
 * vue-i18n v7.1.1 
 * (c) 2017 kazuya kawaguchi
 * Released under the MIT License.
 */
/*  */

function extend(Vue) {
    Vue.prototype.$t = function(key) {
        var values = [], len = arguments.length - 1;
        while ( len-- > 0 ) values[ len ] = arguments[ len + 1 ];

        var i18n = this.$i18n;
        return i18n._t.apply(i18n, [ key, i18n.locale, i18n._getMessages() ].concat( values ))
    };

    Vue.prototype.$tc = function(key, choice) {
        var values = [], len = arguments.length - 2;
        while ( len-- > 0 ) values[ len ] = arguments[ len + 2 ];

        var i18n = this.$i18n;
        return i18n._tc.apply(i18n, [ key, i18n.locale, i18n._getMessages(), choice ].concat( values ))
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

function parseArgs() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var locale = null;
    var params = null;
    if (args.length === 1) {
        if (isObject(args[0]) || Array.isArray(args[0])) {
            params = args[0];
        } else if (typeof args[0] === 'string') {
            locale = args[0];
        }
    } else if (args.length === 2) {
        if (typeof args[0] === 'string') {
            locale = args[0];
        }
        /* istanbul ignore if */
        if (isObject(args[1]) || Array.isArray(args[1])) {
            params = args[1];
        }
    }

    return { locale: locale, params: params }
}

function getOldChoiceIndexFixed(choice) {
    return choice ?
        choice > 1 ?
        1 :
        0 :
        1
}

function getChoiceIndex(choice, choicesLength) {
    choice = Math.abs(choice);

    if (choicesLength === 2) { return getOldChoiceIndexFixed(choice) }

    return choice ? Math.min(choice, 2) : 0
}

function fetchChoice(message, choice) {
    /* istanbul ignore if */
    if (!message && typeof message !== 'string') { return null }
    var choices = message.split('|');

    choice = getChoiceIndex(choice, choices.length);
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
        options.i18n = options.i18n;
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
        } else if (char === '%') {
            // when found rails i18n syntax, skip text capture
            if (format[(position)] !== '{') {
                text += char;
            }
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
        'list' :
        isObject(values) ?
        'named' :
        'unknown';
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
prototypeAccessors.locale.set = function (locale) {
    this._vm.$set(this._vm, 'locale', locale);
};

VueI18n.prototype._getMessages = function _getMessages () { return this._vm.messages };

VueI18n.prototype._interpolate = function _interpolate (
    locale,
    message,
    key,
    interpolateMode,
    values
) {
    if (!message) { return null }

    var pathRet = message[key];
    if (Array.isArray(pathRet)) { return pathRet }

    var ret;
    if (isNull(pathRet)) {
        return null
    } else {
        /* istanbul ignore else */
        if (typeof pathRet === 'string') {
            ret = pathRet;
        } else {
            return null
        }
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
        this._interpolate(locale, messages[locale], key, interpolateMode, args);

    if (!isNull(res)) {
        return res
    } else {
        return null
    }
};

VueI18n.prototype._t = function _t (key, _locale, messages) {
        var values = [], len = arguments.length - 3;
        while ( len-- > 0 ) values[ len ] = arguments[ len + 3 ];

    if (!key) { return '' }

    var parsedArgs = parseArgs.apply(void 0, values);
    var locale = parsedArgs.locale || _locale;

    var ret = this._translate(
        messages, locale, key,
        'string', parsedArgs.params
    );
    return ret
};

VueI18n.prototype._tc = function _tc (
    key,
    _locale,
    messages,
    choice
) {
        var values = [], len = arguments.length - 4;
        while ( len-- > 0 ) values[ len ] = arguments[ len + 4 ];

    if (!key) { return '' }
    if (choice === undefined) {
        choice = 1;
    }
    return fetchChoice((ref = this)._t.apply(ref, [ key, _locale, messages ].concat( values )), choice)
        var ref;
};

Object.defineProperties( VueI18n.prototype, prototypeAccessors );

VueI18n.install = install;

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
    window.Vue.use(VueI18n);
}

export default VueI18n;

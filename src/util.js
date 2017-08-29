/* @flow */

/**
 * utilites
 */

export function isObject(obj: mixed): boolean {
    return obj !== null && typeof obj === 'object'
}

const toString: Function = Object.prototype.toString
const OBJECT_STRING: string = '[object Object]'
export function isPlainObject(obj: any): boolean {
    return toString.call(obj) === OBJECT_STRING
}

export function isNull(val: mixed): boolean {
    return val === null || val === undefined
}

export function fetchChoice(message: string, choice: number): ? string {
    /* istanbul ignore if */
    if (!message && typeof message !== 'string') { return null }
    const choices: Array < string > = message.split('|')
    if (choice === 1) choice = 0
    else choice = 1
    if (!choices[choice]) { return message }
    return choices[choice].trim()
}

export function remove(arr: Array < any > , item: any) : Array < any > | void {
    if (arr.length) {
        const index = arr.indexOf(item)
        if (index > -1) {
            return arr.splice(index, 1)
        }
    }
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn(obj: Object | Array < * > , key: string): boolean {
    return hasOwnProperty.call(obj, key)
}

export function merge(target: Object): Object {
    const output = Object(target)
    for (let i = 1; i < arguments.length; i++) {
        const source = arguments[i]
        if (source !== undefined && source !== null) {
            let key
            for (key in source) {
                if (hasOwn(source, key)) {
                    if (isObject(source[key])) {
                        output[key] = merge(output[key], source[key])
                    } else {
                        output[key] = source[key]
                    }
                }
            }
        }
    }
    return output
}
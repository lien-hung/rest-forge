/**
 * Checks if `value` is an empty object, array or string.
 *
 * Objects are considered empty if they have no own enumerable string keyed
 * properties.
 *
 * Values such as strings, arrays are considered empty if they have a `length` of `0`.
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * isEmpty(null)
 * // => true
 *
 * isEmpty(true)
 * // => true
 *
 * isEmpty(1)
 * // => true
 *
 * isEmpty([1, 2, 3])
 * // => false
 *
 * isEmpty('abc')
 * // => false
 *
 * isEmpty({ 'a': 1 })
 * // => false
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (Array.isArray(value) || typeof value === 'string' || typeof value.splice === 'function') {
    return !value.length;
  }

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if `value` is `undefined`.
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
 * @example
 *
 * isUndefined(void 0)
 * // => true
 *
 * isUndefined(null)
 * // => false
 */
export function isUndefined(value: any): boolean {
  return value === undefined;
}

/**
 * Checks if `func` is classified as a `Function` object.
 *
 * @param {*} func The value to check.
 * @returns {boolean} Returns `true` if `func` is a function, else `false`.
 * @example
 *
 * isFunction(self.isEmpty)
 * // => true
 *
 * isFunction(/abc/)
 * // => false
 */
export function isFunction(func: any): boolean {
  return typeof func === 'function';
}

/**
 * Converts the first character of `string` to upper case and the remaining
 * to lower case.
 *
 * @param {string} [string=''] The string to capitalize.
 * @returns {string} Returns the capitalized string.
 * @example
 *
 * capitalize('FRED')
 * // => 'Fred'
 *
 * capitalize('john')
 * // => 'John'
 */
export function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * Iterates over elements of `collection` and invokes `iteratee` for each element.
 * The iteratee is invoked with three arguments: (value, index|key, collection).
 *
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 * @example
 *
 * forEach([1, 2], value => console.log(value))
 * // => Logs `1` then `2`.
 *
 * forEach({ 'a': 1, 'b': 2 }, (value, key) => console.log(key))
 * // => Logs 'a' then 'b'
 */
export function forEach(collection: Array<any> | object, iteratee: (value: any, index: string | number, array?: Array<any>) => void): Array<any> | object | undefined {
  if (collection === null) {
    return;
  }

  if (Array.isArray(collection)) {
    collection.forEach(iteratee);
    return;
  }
  const iterable = Object(collection), props = Object.keys(collection);
  var index = -1, key, i;

  for (i = 0; i < props.length; i++) {
    key = props[++index];
    iteratee(iterable[key], key, iterable);
  }
  return collection;
}

/**
 * Checks if `value` is in `collection`. If `collection` is a string, it's
 * checked for a substring of `value`, otherwise it checks if the `value` is present
 * as a key in a `collection` object.
 *
 * @param {Array|Object|string} collection The collection to inspect.
 * @param {*} value The value to search for.
 * @returns {boolean} Returns `true` if `value` is found, else `false`.
 * @example
 *
 * _.includes([1, 2, 3], 1);
 * // => true
 *
 * _.includes({ 'a': 1, 'b': 2 }, 1);
 * // => true
 *
 * _.includes('abcd', 'bc');
 * // => true
 */
export function includes(collection: any[] | Record<string, any> | string, value: any): boolean {
  if (Array.isArray(collection) || typeof collection === 'string') {
    return collection.includes(value);
  }
  for (var key in collection) {
    if (collection.hasOwnProperty(key)) {
      if (collection[key] === value) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Gets the size of `collection` by returning its length for array and strings.
 * For objects it returns the number of enumerable string keyed
 * properties.
 *
 * @param {Array|Object|string} collection The collection to inspect.
 * @returns {number} Returns the collection size.
 * @example
 *
 * size([1, 2, 3])
 * // => 3
 *
 * size({ 'a': 1, 'b': 2 })
 * // => 2
 *
 * size('pebbles')
 * // => 7
 */
export function size(collection: Array<any> | object | string): number {
  if (collection === null || collection === undefined) {
    return 0;
  }
  if (Array.isArray(collection) || typeof collection === 'string') {
    return collection.length;
  }

  return Object.keys(collection).length;
}

/**
 * Removes trailing whitespace or specified characters from `string`.
 *
 * @param {string} [string=''] The string to trim.
 * @param {string} [chars=whitespace] The characters to trim.
 * @returns {string} Returns the trimmed string.
 * @example
 *
 * trimEnd('  abc  ')
 * // => '  abc'
 *
 * trimEnd('-_-abc-_-', '_-')
 * // => '-_-abc'
 */
export function trimEnd(string: string, chars: string): string {
  if (!string) {
    return '';
  }
  if (string && !chars) {
    return string.replace(/\s*$/, '');
  }
  chars += '$';
  return string.replace(new RegExp(chars, 'g'), '');
}

/**
 * Returns the index of the first
 * element `predicate` returns truthy for.
 *
 * @param {Array} array The array to inspect.
 * @param {Object} predicate The exact object to be searched for in the array.
 * @returns {number} Returns the index of the found element, else `-1`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'active': false },
 *   { 'user': 'fred',    'active': false },
 *   { 'user': 'pebbles', 'active': true }
 * ];
 *
 * _.findIndex(users, { 'user': 'fred', 'active': false });
 * // => 1
 *
 * _.findIndex(users, {'active' : false});
 * // => 0
 *
 */
export function findIndex(array: Array<any>, predicate: object): number {
  var length = array === null ? 0 : array.length, index = -1, keys = Object.keys(predicate), found, i: number;
  if (!length) {
    return -1;
  }
  for (i = 0; i < array.length; i++) {
    found = true;
    keys.forEach((key) => {
      // @ts-expect-error
      if (!(array[i][key] && array[i][key] === predicate[key])) {
        found = false;
      }
    });
    if (found) {
      index = i;
      break;
    }
  }
  return index;
}

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @param {Object} object The object to query.
 * @param {string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * const object = { a: {b : 'c'} }
 *
 *
 * get(object, 'a.b.c', 'default')
 * // => 'default'
 *
 * get(object, 'a.b', 'default')
 * // => 'c'
 */
export function get(object: object, path: string, defaultValue?: any): any {
  if (object === null) {
    return undefined;
  }
  var arr = path.split('.'), res = object, i;
  for (i = 0; i < arr.length; i++) {
    // @ts-expect-error
    res = res[arr[i]];
    if (res === undefined) {
      return defaultValue;
    }
  }
  return res;
}

/**
 * Checks if `predicate` returns truthy for **all** elements of `array`.
 * Iteration is stopped once `predicate` returns falsey. The predicate is
 * invoked with three arguments: (value, index, array).
 *
 * @param {Array} array The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 * @example
 *
 * every([true, 1, null, 'yes'], Boolean)
 * // => false
 */
export function every(array: Array<any>, predicate: Function): boolean {
  var index = -1, length = array === null ? 0 : array.length;

  while (++index < length) {
    if (!predicate(array[index], index, array)) {
      return false;
    }
  }
  return true;
}

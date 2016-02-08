/**
 * Decypher Utils
 * ===============
 *
 */
exports.assign = function() {
  var args = Array.prototype.slice.call(arguments),
      o = args[0],
      k,
      i,
      l;

  if (!o)
    return {};

  for (i = 1, l = args.length; i < l; i++) {
    for (k in args[i] || {})
      o[k] = args[i][k];
  }

  return o;
};

exports.isPlainObject = function(target) {
  return target &&
         typeof target === 'object' &&
         !Array.isArray(target) &&
         !(target instanceof Date) &&
         !(target instanceof RegExp);
};

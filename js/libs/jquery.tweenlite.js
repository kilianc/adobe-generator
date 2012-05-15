/*!
 * TweenLite jQuery plugin v0.0.1
 *
 * Copyright (c) 2011 Kilian Ciuffolo, me@nailik.org
 *
 * Licensed under the MIT license.
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * Date: Wed Jul 4 16:00:34 2012 -0700
 */

/*global TweenLite*/

;(function () {
  "use strict";

  ['to', 'from', 'fromTo', 'set'].forEach(function (methodName) {
    $.fn[methodName] = function (css, time, options, callback) {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }

      options = options || {}
      options.css = css
      options.onComplete = options.onComplete || callback

      TweenLite[methodName](this[0], time, options)
      return this
    }
  })
})()
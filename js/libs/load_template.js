/*global dust:true*/

;(function (exports) {
  "use strict";

  function compileTemplate(name, tag, data) {
    var el
    // sync function written with async pattern, awesome :|
    dust.render(name, data || {}, function (err, html) {
      if (err) throw err
      el = $('<' + tag + '>' + html + '</' + tag + '>')[0].firstChild
    })
    return el
  }

  exports.loadTemplate = function loadTemplate(name, callback) {
    $.get('views/' + name + '.js', function (template) {
      var tag = template.match(/<tr[\s\S]*?<\/tr>/g) ? 'tbody' : 'div'
      dust.loadSource(template)
      callback(null, compileTemplate.bind(null, name, tag))
    })
  }
})(window)

// var layerRows = {
//   'LayerKind.GROUP': '<li id="{id}" class="{focus}"><a class="handle" href=""></a><input type="checkbox" {isVisible}><a class="preview group"></a>{name}<a class="disclosure" href=""></a></li>',
//   'LayerKind.TEXT': '<li id="{id}" class="{focus}"><a class="handle" href=""></a><input type="checkbox" {isVisible}><a class="preview type"></a>{name}<a class="disclosure" href=""></a></li>',
//   'LayerKind.NORMAL': '<li id="{id}" class="{focus}"><a class="handle" href=""></a><input type="checkbox" {isVisible}><a class="preview thumb" style="background-image: url(\'images/layers/{name}.png\')"></a>{name}<a class="disclosure" href=""></a></li>',
//   'LayerKind.SOLIDFILL': '<li id="{id}" class="{focus}"><a class="handle" href=""></a><input type="checkbox" {isVisible}><a class="preview shape"></a>{name}<a class="disclosure" href=""></a></li>'
// }

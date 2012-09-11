var fontList = app.fonts
var fontNames = []

for (var i = 0, l = fontList.length; i < l; i++) {
  fontNames.push(fontList[i].postScriptName)
}

JSON.stringify(fontNames)
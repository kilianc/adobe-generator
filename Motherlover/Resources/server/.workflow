{
  "js": {
    "targets": [{
      "output": "public/js/main.min.js",
      "src": [
        "js/vendor/greensock/CSSPlugin.js",
        "js/vendor/greensock/TweenLite.js",
        "js/vendor/async.min.js",
        "js/vendor/socket.io.js",
        "js/vendor/jquery-1.7.2.min.js",
        "js/libs/jquery.tweenlite.js",
        "js/main.js --check"
      ]
    }]
  },
  "stylus": {
    "targets": [{
      "src": "stylus/main.styl",
      "output": "public/css/main.css --min"
    }]
  }
}
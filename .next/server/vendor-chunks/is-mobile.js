"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-mobile";
exports.ids = ["vendor-chunks/is-mobile"];
exports.modules = {

/***/ "(ssr)/./node_modules/is-mobile/index.js":
/*!*****************************************!*\
  !*** ./node_modules/is-mobile/index.js ***!
  \*****************************************/
/***/ ((module) => {

eval("\n\nmodule.exports = isMobile\nmodule.exports.isMobile = isMobile\nmodule.exports[\"default\"] = isMobile\n\nconst mobileRE = /(android|bb\\d+|meego).+mobile|armv7l|avantgo|bada\\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|plucker|pocket|psp|redmi|series[46]0|samsungbrowser.*mobile|symbian|treo|up\\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i\nconst notMobileRE = /CrOS/\n\nconst tabletRE = /android|ipad|playbook|silk/i\n\nfunction isMobile (opts) {\n  if (!opts) opts = {}\n  let ua = opts.ua\n  if (!ua && typeof navigator !== 'undefined') ua = navigator.userAgent\n  if (ua && ua.headers && typeof ua.headers['user-agent'] === 'string') {\n    ua = ua.headers['user-agent']\n  }\n  if (typeof ua !== 'string') return false\n\n  let result =\n    (mobileRE.test(ua) && !notMobileRE.test(ua)) ||\n    (!!opts.tablet && tabletRE.test(ua))\n\n  if (\n    !result &&\n    opts.tablet &&\n    opts.featureDetect &&\n    navigator &&\n    navigator.maxTouchPoints > 1 &&\n    ua.indexOf('Macintosh') !== -1 &&\n    ua.indexOf('Safari') !== -1\n  ) {\n    result = true\n  }\n\n  return result\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvaXMtbW9iaWxlL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFZOztBQUVaO0FBQ0EsdUJBQXVCO0FBQ3ZCLHlCQUFzQjs7QUFFdEI7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9vcmRlci1mcm9udGVuZC8uL25vZGVfbW9kdWxlcy9pcy1tb2JpbGUvaW5kZXguanM/YTMxZCJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBpc01vYmlsZVxubW9kdWxlLmV4cG9ydHMuaXNNb2JpbGUgPSBpc01vYmlsZVxubW9kdWxlLmV4cG9ydHMuZGVmYXVsdCA9IGlzTW9iaWxlXG5cbmNvbnN0IG1vYmlsZVJFID0gLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhcm12N2x8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHJlZG1pfHNlcmllc1s0Nl0wfHNhbXN1bmdicm93c2VyLiptb2JpbGV8c3ltYmlhbnx0cmVvfHVwXFwuKGJyb3dzZXJ8bGluayl8dm9kYWZvbmV8d2FwfHdpbmRvd3MgKGNlfHBob25lKXx4ZGF8eGlpbm8vaVxuY29uc3Qgbm90TW9iaWxlUkUgPSAvQ3JPUy9cblxuY29uc3QgdGFibGV0UkUgPSAvYW5kcm9pZHxpcGFkfHBsYXlib29rfHNpbGsvaVxuXG5mdW5jdGlvbiBpc01vYmlsZSAob3B0cykge1xuICBpZiAoIW9wdHMpIG9wdHMgPSB7fVxuICBsZXQgdWEgPSBvcHRzLnVhXG4gIGlmICghdWEgJiYgdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcpIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudFxuICBpZiAodWEgJiYgdWEuaGVhZGVycyAmJiB0eXBlb2YgdWEuaGVhZGVyc1sndXNlci1hZ2VudCddID09PSAnc3RyaW5nJykge1xuICAgIHVhID0gdWEuaGVhZGVyc1sndXNlci1hZ2VudCddXG4gIH1cbiAgaWYgKHR5cGVvZiB1YSAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZVxuXG4gIGxldCByZXN1bHQgPVxuICAgIChtb2JpbGVSRS50ZXN0KHVhKSAmJiAhbm90TW9iaWxlUkUudGVzdCh1YSkpIHx8XG4gICAgKCEhb3B0cy50YWJsZXQgJiYgdGFibGV0UkUudGVzdCh1YSkpXG5cbiAgaWYgKFxuICAgICFyZXN1bHQgJiZcbiAgICBvcHRzLnRhYmxldCAmJlxuICAgIG9wdHMuZmVhdHVyZURldGVjdCAmJlxuICAgIG5hdmlnYXRvciAmJlxuICAgIG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyA+IDEgJiZcbiAgICB1YS5pbmRleE9mKCdNYWNpbnRvc2gnKSAhPT0gLTEgJiZcbiAgICB1YS5pbmRleE9mKCdTYWZhcmknKSAhPT0gLTFcbiAgKSB7XG4gICAgcmVzdWx0ID0gdHJ1ZVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/is-mobile/index.js\n");

/***/ })

};
;
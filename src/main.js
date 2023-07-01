import { ms } from "./util/misc"
// import { DynamicWorkerWithoutAck } from "./util/dynamic-worker-classes"
// import { AshSim } from "./ash-sim"

console.log('ash-js loaded correctly!')

let fName = '_Object'

window[fName] = (type='', attributes={}, children=['']) => {
  var element = document.createElement(type)
  // Functionality to add onclick function with the same name as the id
  // if (attributes.onclick === undefined && attributes.id != undefined) {
  //     attributes.onclick = attributes.id + '();'
  //     if (window[attributes.id]===undefined) window[attributes.id] = new Function('args', '')
  // }
  for (let key in attributes) element.setAttribute(key, attributes[key])
  if (typeof children === 'string' || children[0] === undefined) children = [children]
  children.forEach( child => { 
      if (typeof child === 'string') element.appendChild(document.createTextNode(child))
      else element.appendChild(child)
  })
  return element
}

window['_css'] = (attributes = {}) => {
  let textCSS = ''
  for (let attribute in attributes) textCSS += '\n' + attribute + ': ' + attributes[attribute] + ';'
  return textCSS 
}

for(let HTMLTag of [
  'html', 'head', 'body', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'b', 'i', 'em', 'mark', 'small', 'strong', 'sub', 'sup', 'br', 'wbr',
  'abbr','address', 'bdi', 'bdo', 'pre', 'u', 'blockquote', 'cite', 'code', 'q', 'rt', 'samp',
  'del', 's', 'ins', 'ruby', 'dfn', 'rp', 'kbd', 'meter', 'progress', 'template', 'time',
  'form', 'input', 'textarea', 'button', 'fieldset', 'legend', 'datalist', 'output', 'label', 'select', 'optgroup', 'option',
  'iframe', 'img', 'map', 'area', 'canvas', 'figure', 'picture', 'svg', 'figcaption', 'audio', 'source', 'track', 'video',
  'a', 'link', 'nav', 'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'caption', 'th', 'tr', 'td', 'thead', 'tbody', 'tfoot', 'col', 'colgroup',
  'style', 'div', 'span', 'header', 'footer', 'main', 'section', 'article', 'aside', 'details', 'dialog', 'summary', 'data',
  'meta', 'base', 'script', 'noscript', 'embed', 'object', 'param'
]) window['_'+HTMLTag] = new Function('attributes', 'children', 'return '+fName+'("'+HTMLTag+'", attributes, children)')

let ash = {
  wait: {
    ms: ms
  },
  // AshSim: AshSim
};

export {ash}
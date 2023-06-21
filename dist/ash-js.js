function d(a) {
  return new Promise((e) => setTimeout(e, a));
}
function i(a) {
  return window.URL.createObjectURL(
    new Blob(
      [a],
      { type: "text/javascript" }
    )
  );
}
function l(a) {
  let e = "";
  const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let s = 0; s < a; s++)
    e += t.charAt(Math.floor(Math.random() * t.length));
  return e;
}
const u = `onmessage = (msg) => postMessage({result: self[msg.data.do](msg.data), ack: msg.data.id})
addFn = (args) => importScripts(args.script)
removeFn = (args) => self[args.name] = () => {}`;
class p {
  constructor() {
    this._worker = new Worker(i(u)), this._worker.onmessage = (e) => {
      console.log("RECEIVING <-", e.data), this._ack[e.data.ack] = {
        received: 1,
        result: e.data.result
      };
    }, this._ack = {};
  }
  async _postMessage(e) {
    return new Promise(async (t, s) => {
      let r = l(16);
      for (this._ack[r] = {
        received: 0,
        result: void 0
      }, e.id = r, console.log("SENDING -> ", e), this._worker.postMessage(e); this._ack[r].received == 0; )
        await d(1);
      let o = this._ack[r].result;
      delete this._ack[r], t(o);
    });
  }
  async addFn(e) {
    return new Promise(async (t, s) => {
      await this._postMessage({ do: "addFn", script: i(e.toString()) }), this[e.name] = async (r) => {
        let o = { do: e.name };
        for (let n in r)
          o[n] = r[n];
        return await this._postMessage(o);
      }, t(1);
    });
  }
  async addCode(e) {
    return new Promise(async (t, s) => {
      await this._postMessage({ do: "addFn", script: i(e) }), t();
    });
  }
  async removeFn(e) {
    delete this[e];
  }
}
console.log("ash-js loaded correctly!");
let c = "_Object";
window[c] = (a = "", e = {}, t = [""]) => {
  var s = document.createElement(a);
  for (key in e)
    s.setAttribute(key, e[key]);
  return (typeof t == "string" || t[0] === void 0) && (t = [t]), t.forEach((r) => {
    typeof r == "string" ? s.appendChild(document.createTextNode(r)) : s.appendChild(r);
  }), s;
};
window._css = (a = {}) => {
  let e = "";
  for (let t in a)
    e += `
` + t + ": " + a[t] + ";";
  return e;
};
for (let a of [
  "html",
  "head",
  "body",
  "title",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "b",
  "i",
  "em",
  "mark",
  "small",
  "strong",
  "sub",
  "sup",
  "br",
  "wbr",
  "abbr",
  "address",
  "bdi",
  "bdo",
  "pre",
  "u",
  "blockquote",
  "cite",
  "code",
  "q",
  "rt",
  "samp",
  "del",
  "s",
  "ins",
  "ruby",
  "dfn",
  "rp",
  "kbd",
  "meter",
  "progress",
  "template",
  "time",
  "form",
  "input",
  "textarea",
  "button",
  "fieldset",
  "legend",
  "datalist",
  "output",
  "label",
  "select",
  "optgroup",
  "option",
  "iframe",
  "img",
  "map",
  "area",
  "canvas",
  "figure",
  "picture",
  "svg",
  "figcaption",
  "audio",
  "source",
  "track",
  "video",
  "a",
  "link",
  "nav",
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",
  "table",
  "caption",
  "th",
  "tr",
  "td",
  "thead",
  "tbody",
  "tfoot",
  "col",
  "colgroup",
  "style",
  "div",
  "span",
  "header",
  "footer",
  "main",
  "section",
  "article",
  "aside",
  "details",
  "dialog",
  "summary",
  "data",
  "meta",
  "base",
  "script",
  "noscript",
  "embed",
  "object",
  "param"
])
  window["_" + a] = new Function("attributes", "children", "return " + c + '("' + a + '", attributes, children)');
let m = {
  wait: {
    ms: d
  }
};
export {
  p as DynamicWorker,
  m as ash
};

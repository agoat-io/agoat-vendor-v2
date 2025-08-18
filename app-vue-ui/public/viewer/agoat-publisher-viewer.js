import { defineComponent as De, ref as A, computed as Pe, onMounted as qe, watch as wt, createElementBlock as v, openBlock as _, createElementVNode as x, toDisplayString as U, createCommentVNode as Y, Fragment as sn, renderList as on, withModifiers as et, createBlock as tt, createStaticVNode as an, createApp as ln } from "vue";
function Fe() {
  return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null };
}
var Z = Fe();
function yt(t) {
  Z = t;
}
var ee = { exec: () => null };
function R(t, e = "") {
  let n = typeof t == "string" ? t : t.source, s = { replace: (r, i) => {
    let o = typeof i == "string" ? i : i.source;
    return o = o.replace($.caret, "$1"), n = n.replace(r, o), s;
  }, getRegex: () => new RegExp(n, e) };
  return s;
}
var $ = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceTabs: /^\t+/, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] /, listReplaceTask: /^\[[ xX]\] +/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (t) => new RegExp(`^( {0,3}${t})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}#`), htmlBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}<(?:[a-z].*>|!--)`, "i") }, cn = /^(?:[ \t]*(?:\n|$))+/, un = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, pn = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, ne = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, hn = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, je = /(?:[*+-]|\d{1,9}[.)])/, St = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, Rt = R(St).replace(/bull/g, je).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), dn = R(St).replace(/bull/g, je).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), Me = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, fn = /^[^\n]+/, He = /(?!\s*\])(?:\\.|[^\[\]\\])+/, gn = R(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", He).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), mn = R(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, je).getRegex(), ke = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Ve = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, bn = R("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", Ve).replace("tag", ke).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Et = R(Me).replace("hr", ne).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ke).getRegex(), kn = R(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Et).getRegex(), Je = { blockquote: kn, code: un, def: gn, fences: pn, heading: hn, hr: ne, html: bn, lheading: Rt, list: mn, newline: cn, paragraph: Et, table: ee, text: fn }, nt = R("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", ne).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ke).getRegex(), xn = { ...Je, lheading: dn, table: nt, paragraph: R(Me).replace("hr", ne).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", nt).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ke).getRegex() }, wn = { ...Je, html: R(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Ve).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: ee, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: R(Me).replace("hr", ne).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Rt).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, yn = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Sn = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Tt = /^( {2,}|\\)\n(?!\s*$)/, Rn = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, xe = /[\p{P}\p{S}]/u, Ze = /[\s\p{P}\p{S}]/u, _t = /[^\s\p{P}\p{S}]/u, En = R(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Ze).getRegex(), At = /(?!~)[\p{P}\p{S}]/u, Tn = /(?!~)[\s\p{P}\p{S}]/u, _n = /(?:[^\s\p{P}\p{S}]|~)/u, An = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<(?! )[^<>]*?>/g, vt = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, vn = R(vt, "u").replace(/punct/g, xe).getRegex(), Pn = R(vt, "u").replace(/punct/g, At).getRegex(), Pt = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", Cn = R(Pt, "gu").replace(/notPunctSpace/g, _t).replace(/punctSpace/g, Ze).replace(/punct/g, xe).getRegex(), On = R(Pt, "gu").replace(/notPunctSpace/g, _n).replace(/punctSpace/g, Tn).replace(/punct/g, At).getRegex(), $n = R("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, _t).replace(/punctSpace/g, Ze).replace(/punct/g, xe).getRegex(), Ln = R(/\\(punct)/, "gu").replace(/punct/g, xe).getRegex(), Bn = R(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Nn = R(Ve).replace("(?:-->|$)", "-->").getRegex(), zn = R("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Nn).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), de = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Un = R(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", de).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), Ct = R(/^!?\[(label)\]\[(ref)\]/).replace("label", de).replace("ref", He).getRegex(), Ot = R(/^!?\[(ref)\](?:\[\])?/).replace("ref", He).getRegex(), In = R("reflink|nolink(?!\\()", "g").replace("reflink", Ct).replace("nolink", Ot).getRegex(), We = { _backpedal: ee, anyPunctuation: Ln, autolink: Bn, blockSkip: An, br: Tt, code: Sn, del: ee, emStrongLDelim: vn, emStrongRDelimAst: Cn, emStrongRDelimUnd: $n, escape: yn, link: Un, nolink: Ot, punctuation: En, reflink: Ct, reflinkSearch: In, tag: zn, text: Rn, url: ee }, Dn = { ...We, link: R(/^!?\[(label)\]\((.*?)\)/).replace("label", de).getRegex(), reflink: R(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", de).getRegex() }, Ce = { ...We, emStrongRDelimAst: On, emStrongLDelim: Pn, url: R(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/, text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/ }, qn = { ...Ce, br: R(Tt).replace("{2,}", "*").getRegex(), text: R(Ce.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, le = { normal: Je, gfm: xn, pedantic: wn }, G = { normal: We, gfm: Ce, breaks: qn, pedantic: Dn }, Fn = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, rt = (t) => Fn[t];
function q(t, e) {
  if (e) {
    if ($.escapeTest.test(t)) return t.replace($.escapeReplace, rt);
  } else if ($.escapeTestNoEncode.test(t)) return t.replace($.escapeReplaceNoEncode, rt);
  return t;
}
function st(t) {
  try {
    t = encodeURI(t).replace($.percentDecode, "%");
  } catch {
    return null;
  }
  return t;
}
function ot(t, e) {
  let n = t.replace($.findPipe, (i, o, a) => {
    let l = !1, c = o;
    for (; --c >= 0 && a[c] === "\\"; ) l = !l;
    return l ? "|" : " |";
  }), s = n.split($.splitPipe), r = 0;
  if (s[0].trim() || s.shift(), s.length > 0 && !s.at(-1)?.trim() && s.pop(), e) if (s.length > e) s.splice(e);
  else for (; s.length < e; ) s.push("");
  for (; r < s.length; r++) s[r] = s[r].trim().replace($.slashPipe, "|");
  return s;
}
function Q(t, e, n) {
  let s = t.length;
  if (s === 0) return "";
  let r = 0;
  for (; r < s && t.charAt(s - r - 1) === e; )
    r++;
  return t.slice(0, s - r);
}
function jn(t, e) {
  if (t.indexOf(e[1]) === -1) return -1;
  let n = 0;
  for (let s = 0; s < t.length; s++) if (t[s] === "\\") s++;
  else if (t[s] === e[0]) n++;
  else if (t[s] === e[1] && (n--, n < 0)) return s;
  return n > 0 ? -2 : -1;
}
function it(t, e, n, s, r) {
  let i = e.href, o = e.title || null, a = t[1].replace(r.other.outputLinkReplace, "$1");
  s.state.inLink = !0;
  let l = { type: t[0].charAt(0) === "!" ? "image" : "link", raw: n, href: i, title: o, text: a, tokens: s.inlineTokens(a) };
  return s.state.inLink = !1, l;
}
function Mn(t, e, n) {
  let s = t.match(n.other.indentCodeCompensation);
  if (s === null) return e;
  let r = s[1];
  return e.split(`
`).map((i) => {
    let o = i.match(n.other.beginningSpace);
    if (o === null) return i;
    let [a] = o;
    return a.length >= r.length ? i.slice(r.length) : i;
  }).join(`
`);
}
var fe = class {
  options;
  rules;
  lexer;
  constructor(t) {
    this.options = t || Z;
  }
  space(t) {
    let e = this.rules.block.newline.exec(t);
    if (e && e[0].length > 0) return { type: "space", raw: e[0] };
  }
  code(t) {
    let e = this.rules.block.code.exec(t);
    if (e) {
      let n = e[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: e[0], codeBlockStyle: "indented", text: this.options.pedantic ? n : Q(n, `
`) };
    }
  }
  fences(t) {
    let e = this.rules.block.fences.exec(t);
    if (e) {
      let n = e[0], s = Mn(n, e[3] || "", this.rules);
      return { type: "code", raw: n, lang: e[2] ? e[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : e[2], text: s };
    }
  }
  heading(t) {
    let e = this.rules.block.heading.exec(t);
    if (e) {
      let n = e[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let s = Q(n, "#");
        (this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
      }
      return { type: "heading", raw: e[0], depth: e[1].length, text: n, tokens: this.lexer.inline(n) };
    }
  }
  hr(t) {
    let e = this.rules.block.hr.exec(t);
    if (e) return { type: "hr", raw: Q(e[0], `
`) };
  }
  blockquote(t) {
    let e = this.rules.block.blockquote.exec(t);
    if (e) {
      let n = Q(e[0], `
`).split(`
`), s = "", r = "", i = [];
      for (; n.length > 0; ) {
        let o = !1, a = [], l;
        for (l = 0; l < n.length; l++) if (this.rules.other.blockquoteStart.test(n[l])) a.push(n[l]), o = !0;
        else if (!o) a.push(n[l]);
        else break;
        n = n.slice(l);
        let c = a.join(`
`), p = c.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        s = s ? `${s}
${c}` : c, r = r ? `${r}
${p}` : p;
        let h = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(p, i, !0), this.lexer.state.top = h, n.length === 0) break;
        let g = i.at(-1);
        if (g?.type === "code") break;
        if (g?.type === "blockquote") {
          let b = g, d = b.raw + `
` + n.join(`
`), k = this.blockquote(d);
          i[i.length - 1] = k, s = s.substring(0, s.length - b.raw.length) + k.raw, r = r.substring(0, r.length - b.text.length) + k.text;
          break;
        } else if (g?.type === "list") {
          let b = g, d = b.raw + `
` + n.join(`
`), k = this.list(d);
          i[i.length - 1] = k, s = s.substring(0, s.length - g.raw.length) + k.raw, r = r.substring(0, r.length - b.raw.length) + k.raw, n = d.substring(i.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: s, tokens: i, text: r };
    }
  }
  list(t) {
    let e = this.rules.block.list.exec(t);
    if (e) {
      let n = e[1].trim(), s = n.length > 1, r = { type: "list", raw: "", ordered: s, start: s ? +n.slice(0, -1) : "", loose: !1, items: [] };
      n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
      let i = this.rules.other.listItemRegex(n), o = !1;
      for (; t; ) {
        let l = !1, c = "", p = "";
        if (!(e = i.exec(t)) || this.rules.block.hr.test(t)) break;
        c = e[0], t = t.substring(c.length);
        let h = e[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (w) => " ".repeat(3 * w.length)), g = t.split(`
`, 1)[0], b = !h.trim(), d = 0;
        if (this.options.pedantic ? (d = 2, p = h.trimStart()) : b ? d = e[1].length + 1 : (d = e[2].search(this.rules.other.nonSpaceChar), d = d > 4 ? 1 : d, p = h.slice(d), d += e[1].length), b && this.rules.other.blankLine.test(g) && (c += g + `
`, t = t.substring(g.length + 1), l = !0), !l) {
          let w = this.rules.other.nextBulletRegex(d), m = this.rules.other.hrRegex(d), E = this.rules.other.fencesBeginRegex(d), P = this.rules.other.headingBeginRegex(d), C = this.rules.other.htmlBeginRegex(d);
          for (; t; ) {
            let z = t.split(`
`, 1)[0], N;
            if (g = z, this.options.pedantic ? (g = g.replace(this.rules.other.listReplaceNesting, "  "), N = g) : N = g.replace(this.rules.other.tabCharGlobal, "    "), E.test(g) || P.test(g) || C.test(g) || w.test(g) || m.test(g)) break;
            if (N.search(this.rules.other.nonSpaceChar) >= d || !g.trim()) p += `
` + N.slice(d);
            else {
              if (b || h.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || E.test(h) || P.test(h) || m.test(h)) break;
              p += `
` + g;
            }
            !b && !g.trim() && (b = !0), c += z + `
`, t = t.substring(z.length + 1), h = N.slice(d);
          }
        }
        r.loose || (o ? r.loose = !0 : this.rules.other.doubleBlankLine.test(c) && (o = !0));
        let k = null, f;
        this.options.gfm && (k = this.rules.other.listIsTask.exec(p), k && (f = k[0] !== "[ ] ", p = p.replace(this.rules.other.listReplaceTask, ""))), r.items.push({ type: "list_item", raw: c, task: !!k, checked: f, loose: !1, text: p, tokens: [] }), r.raw += c;
      }
      let a = r.items.at(-1);
      if (a) a.raw = a.raw.trimEnd(), a.text = a.text.trimEnd();
      else return;
      r.raw = r.raw.trimEnd();
      for (let l = 0; l < r.items.length; l++) if (this.lexer.state.top = !1, r.items[l].tokens = this.lexer.blockTokens(r.items[l].text, []), !r.loose) {
        let c = r.items[l].tokens.filter((h) => h.type === "space"), p = c.length > 0 && c.some((h) => this.rules.other.anyLine.test(h.raw));
        r.loose = p;
      }
      if (r.loose) for (let l = 0; l < r.items.length; l++) r.items[l].loose = !0;
      return r;
    }
  }
  html(t) {
    let e = this.rules.block.html.exec(t);
    if (e) return { type: "html", block: !0, raw: e[0], pre: e[1] === "pre" || e[1] === "script" || e[1] === "style", text: e[0] };
  }
  def(t) {
    let e = this.rules.block.def.exec(t);
    if (e) {
      let n = e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = e[2] ? e[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = e[3] ? e[3].substring(1, e[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : e[3];
      return { type: "def", tag: n, raw: e[0], href: s, title: r };
    }
  }
  table(t) {
    let e = this.rules.block.table.exec(t);
    if (!e || !this.rules.other.tableDelimiter.test(e[2])) return;
    let n = ot(e[1]), s = e[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = e[3]?.trim() ? e[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], i = { type: "table", raw: e[0], header: [], align: [], rows: [] };
    if (n.length === s.length) {
      for (let o of s) this.rules.other.tableAlignRight.test(o) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? i.align.push("left") : i.align.push(null);
      for (let o = 0; o < n.length; o++) i.header.push({ text: n[o], tokens: this.lexer.inline(n[o]), header: !0, align: i.align[o] });
      for (let o of r) i.rows.push(ot(o, i.header.length).map((a, l) => ({ text: a, tokens: this.lexer.inline(a), header: !1, align: i.align[l] })));
      return i;
    }
  }
  lheading(t) {
    let e = this.rules.block.lheading.exec(t);
    if (e) return { type: "heading", raw: e[0], depth: e[2].charAt(0) === "=" ? 1 : 2, text: e[1], tokens: this.lexer.inline(e[1]) };
  }
  paragraph(t) {
    let e = this.rules.block.paragraph.exec(t);
    if (e) {
      let n = e[1].charAt(e[1].length - 1) === `
` ? e[1].slice(0, -1) : e[1];
      return { type: "paragraph", raw: e[0], text: n, tokens: this.lexer.inline(n) };
    }
  }
  text(t) {
    let e = this.rules.block.text.exec(t);
    if (e) return { type: "text", raw: e[0], text: e[0], tokens: this.lexer.inline(e[0]) };
  }
  escape(t) {
    let e = this.rules.inline.escape.exec(t);
    if (e) return { type: "escape", raw: e[0], text: e[1] };
  }
  tag(t) {
    let e = this.rules.inline.tag.exec(t);
    if (e) return !this.lexer.state.inLink && this.rules.other.startATag.test(e[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(e[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(e[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(e[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: e[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: e[0] };
  }
  link(t) {
    let e = this.rules.inline.link.exec(t);
    if (e) {
      let n = e[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n)) return;
        let i = Q(n.slice(0, -1), "\\");
        if ((n.length - i.length) % 2 === 0) return;
      } else {
        let i = jn(e[2], "()");
        if (i === -2) return;
        if (i > -1) {
          let o = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + i;
          e[2] = e[2].substring(0, i), e[0] = e[0].substring(0, o).trim(), e[3] = "";
        }
      }
      let s = e[2], r = "";
      if (this.options.pedantic) {
        let i = this.rules.other.pedanticHrefTitle.exec(s);
        i && (s = i[1], r = i[3]);
      } else r = e[3] ? e[3].slice(1, -1) : "";
      return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), it(e, { href: s && s.replace(this.rules.inline.anyPunctuation, "$1"), title: r && r.replace(this.rules.inline.anyPunctuation, "$1") }, e[0], this.lexer, this.rules);
    }
  }
  reflink(t, e) {
    let n;
    if ((n = this.rules.inline.reflink.exec(t)) || (n = this.rules.inline.nolink.exec(t))) {
      let s = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), r = e[s.toLowerCase()];
      if (!r) {
        let i = n[0].charAt(0);
        return { type: "text", raw: i, text: i };
      }
      return it(n, r, n[0], this.lexer, this.rules);
    }
  }
  emStrong(t, e, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(t);
    if (!(!s || s[3] && n.match(this.rules.other.unicodeAlphaNumeric)) && (!(s[1] || s[2]) || !n || this.rules.inline.punctuation.exec(n))) {
      let r = [...s[0]].length - 1, i, o, a = r, l = 0, c = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, e = e.slice(-1 * t.length + r); (s = c.exec(e)) != null; ) {
        if (i = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !i) continue;
        if (o = [...i].length, s[3] || s[4]) {
          a += o;
          continue;
        } else if ((s[5] || s[6]) && r % 3 && !((r + o) % 3)) {
          l += o;
          continue;
        }
        if (a -= o, a > 0) continue;
        o = Math.min(o, o + a + l);
        let p = [...s[0]][0].length, h = t.slice(0, r + s.index + p + o);
        if (Math.min(r, o) % 2) {
          let b = h.slice(1, -1);
          return { type: "em", raw: h, text: b, tokens: this.lexer.inlineTokens(b) };
        }
        let g = h.slice(2, -2);
        return { type: "strong", raw: h, text: g, tokens: this.lexer.inlineTokens(g) };
      }
    }
  }
  codespan(t) {
    let e = this.rules.inline.code.exec(t);
    if (e) {
      let n = e[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return s && r && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: e[0], text: n };
    }
  }
  br(t) {
    let e = this.rules.inline.br.exec(t);
    if (e) return { type: "br", raw: e[0] };
  }
  del(t) {
    let e = this.rules.inline.del.exec(t);
    if (e) return { type: "del", raw: e[0], text: e[2], tokens: this.lexer.inlineTokens(e[2]) };
  }
  autolink(t) {
    let e = this.rules.inline.autolink.exec(t);
    if (e) {
      let n, s;
      return e[2] === "@" ? (n = e[1], s = "mailto:" + n) : (n = e[1], s = n), { type: "link", raw: e[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  url(t) {
    let e;
    if (e = this.rules.inline.url.exec(t)) {
      let n, s;
      if (e[2] === "@") n = e[0], s = "mailto:" + n;
      else {
        let r;
        do
          r = e[0], e[0] = this.rules.inline._backpedal.exec(e[0])?.[0] ?? "";
        while (r !== e[0]);
        n = e[0], e[1] === "www." ? s = "http://" + e[0] : s = e[0];
      }
      return { type: "link", raw: e[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  inlineText(t) {
    let e = this.rules.inline.text.exec(t);
    if (e) {
      let n = this.lexer.state.inRawBlock;
      return { type: "text", raw: e[0], text: e[0], escaped: n };
    }
  }
}, F = class Oe {
  tokens;
  options;
  state;
  tokenizer;
  inlineQueue;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Z, this.options.tokenizer = this.options.tokenizer || new fe(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 };
    let n = { other: $, block: le.normal, inline: G.normal };
    this.options.pedantic ? (n.block = le.pedantic, n.inline = G.pedantic) : this.options.gfm && (n.block = le.gfm, this.options.breaks ? n.inline = G.breaks : n.inline = G.gfm), this.tokenizer.rules = n;
  }
  static get rules() {
    return { block: le, inline: G };
  }
  static lex(e, n) {
    return new Oe(n).lex(e);
  }
  static lexInline(e, n) {
    return new Oe(n).inlineTokens(e);
  }
  lex(e) {
    e = e.replace($.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let n = 0; n < this.inlineQueue.length; n++) {
      let s = this.inlineQueue[n];
      this.inlineTokens(s.src, s.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, n = [], s = !1) {
    for (this.options.pedantic && (e = e.replace($.tabCharGlobal, "    ").replace($.spaceLine, "")); e; ) {
      let r;
      if (this.options.extensions?.block?.some((o) => (r = o.call({ lexer: this }, e, n)) ? (e = e.substring(r.raw.length), n.push(r), !0) : !1)) continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let o = n.at(-1);
        r.raw.length === 1 && o !== void 0 ? o.raw += `
` : n.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let o = n.at(-1);
        o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.at(-1).src = o.text) : n.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), n.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), n.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), n.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), n.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), n.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), n.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let o = n.at(-1);
        o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.raw, this.inlineQueue.at(-1).src = o.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, n.push(r));
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), n.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), n.push(r);
        continue;
      }
      let i = e;
      if (this.options.extensions?.startBlock) {
        let o = 1 / 0, a = e.slice(1), l;
        this.options.extensions.startBlock.forEach((c) => {
          l = c.call({ lexer: this }, a), typeof l == "number" && l >= 0 && (o = Math.min(o, l));
        }), o < 1 / 0 && o >= 0 && (i = e.substring(0, o + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(i))) {
        let o = n.at(-1);
        s && o?.type === "paragraph" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : n.push(r), s = i.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let o = n.at(-1);
        o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : n.push(r);
        continue;
      }
      if (e) {
        let o = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(o);
          break;
        } else throw new Error(o);
      }
    }
    return this.state.top = !0, n;
  }
  inline(e, n = []) {
    return this.inlineQueue.push({ src: e, tokens: n }), n;
  }
  inlineTokens(e, n = []) {
    let s = e, r = null;
    if (this.tokens.links) {
      let a = Object.keys(this.tokens.links);
      if (a.length > 0) for (; (r = this.tokenizer.rules.inline.reflinkSearch.exec(s)) != null; ) a.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (s = s.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + s.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(s)) != null; ) s = s.slice(0, r.index) + "++" + s.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; (r = this.tokenizer.rules.inline.blockSkip.exec(s)) != null; ) s = s.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + s.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    let i = !1, o = "";
    for (; e; ) {
      i || (o = ""), i = !1;
      let a;
      if (this.options.extensions?.inline?.some((c) => (a = c.call({ lexer: this }, e, n)) ? (e = e.substring(a.raw.length), n.push(a), !0) : !1)) continue;
      if (a = this.tokenizer.escape(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.tag(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.link(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(a.raw.length);
        let c = n.at(-1);
        a.type === "text" && c?.type === "text" ? (c.raw += a.raw, c.text += a.text) : n.push(a);
        continue;
      }
      if (a = this.tokenizer.emStrong(e, s, o)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.codespan(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.br(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.del(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (a = this.tokenizer.autolink(e)) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      if (!this.state.inLink && (a = this.tokenizer.url(e))) {
        e = e.substring(a.raw.length), n.push(a);
        continue;
      }
      let l = e;
      if (this.options.extensions?.startInline) {
        let c = 1 / 0, p = e.slice(1), h;
        this.options.extensions.startInline.forEach((g) => {
          h = g.call({ lexer: this }, p), typeof h == "number" && h >= 0 && (c = Math.min(c, h));
        }), c < 1 / 0 && c >= 0 && (l = e.substring(0, c + 1));
      }
      if (a = this.tokenizer.inlineText(l)) {
        e = e.substring(a.raw.length), a.raw.slice(-1) !== "_" && (o = a.raw.slice(-1)), i = !0;
        let c = n.at(-1);
        c?.type === "text" ? (c.raw += a.raw, c.text += a.text) : n.push(a);
        continue;
      }
      if (e) {
        let c = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(c);
          break;
        } else throw new Error(c);
      }
    }
    return n;
  }
}, ge = class {
  options;
  parser;
  constructor(t) {
    this.options = t || Z;
  }
  space(t) {
    return "";
  }
  code({ text: t, lang: e, escaped: n }) {
    let s = (e || "").match($.notSpaceStart)?.[0], r = t.replace($.endingNewline, "") + `
`;
    return s ? '<pre><code class="language-' + q(s) + '">' + (n ? r : q(r, !0)) + `</code></pre>
` : "<pre><code>" + (n ? r : q(r, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: t }) {
    return `<blockquote>
${this.parser.parse(t)}</blockquote>
`;
  }
  html({ text: t }) {
    return t;
  }
  def(t) {
    return "";
  }
  heading({ tokens: t, depth: e }) {
    return `<h${e}>${this.parser.parseInline(t)}</h${e}>
`;
  }
  hr(t) {
    return `<hr>
`;
  }
  list(t) {
    let e = t.ordered, n = t.start, s = "";
    for (let o = 0; o < t.items.length; o++) {
      let a = t.items[o];
      s += this.listitem(a);
    }
    let r = e ? "ol" : "ul", i = e && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + r + i + `>
` + s + "</" + r + `>
`;
  }
  listitem(t) {
    let e = "";
    if (t.task) {
      let n = this.checkbox({ checked: !!t.checked });
      t.loose ? t.tokens[0]?.type === "paragraph" ? (t.tokens[0].text = n + " " + t.tokens[0].text, t.tokens[0].tokens && t.tokens[0].tokens.length > 0 && t.tokens[0].tokens[0].type === "text" && (t.tokens[0].tokens[0].text = n + " " + q(t.tokens[0].tokens[0].text), t.tokens[0].tokens[0].escaped = !0)) : t.tokens.unshift({ type: "text", raw: n + " ", text: n + " ", escaped: !0 }) : e += n + " ";
    }
    return e += this.parser.parse(t.tokens, !!t.loose), `<li>${e}</li>
`;
  }
  checkbox({ checked: t }) {
    return "<input " + (t ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens: t }) {
    return `<p>${this.parser.parseInline(t)}</p>
`;
  }
  table(t) {
    let e = "", n = "";
    for (let r = 0; r < t.header.length; r++) n += this.tablecell(t.header[r]);
    e += this.tablerow({ text: n });
    let s = "";
    for (let r = 0; r < t.rows.length; r++) {
      let i = t.rows[r];
      n = "";
      for (let o = 0; o < i.length; o++) n += this.tablecell(i[o]);
      s += this.tablerow({ text: n });
    }
    return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + s + `</table>
`;
  }
  tablerow({ text: t }) {
    return `<tr>
${t}</tr>
`;
  }
  tablecell(t) {
    let e = this.parser.parseInline(t.tokens), n = t.header ? "th" : "td";
    return (t.align ? `<${n} align="${t.align}">` : `<${n}>`) + e + `</${n}>
`;
  }
  strong({ tokens: t }) {
    return `<strong>${this.parser.parseInline(t)}</strong>`;
  }
  em({ tokens: t }) {
    return `<em>${this.parser.parseInline(t)}</em>`;
  }
  codespan({ text: t }) {
    return `<code>${q(t, !0)}</code>`;
  }
  br(t) {
    return "<br>";
  }
  del({ tokens: t }) {
    return `<del>${this.parser.parseInline(t)}</del>`;
  }
  link({ href: t, title: e, tokens: n }) {
    let s = this.parser.parseInline(n), r = st(t);
    if (r === null) return s;
    t = r;
    let i = '<a href="' + t + '"';
    return e && (i += ' title="' + q(e) + '"'), i += ">" + s + "</a>", i;
  }
  image({ href: t, title: e, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    let r = st(t);
    if (r === null) return q(n);
    t = r;
    let i = `<img src="${t}" alt="${n}"`;
    return e && (i += ` title="${q(e)}"`), i += ">", i;
  }
  text(t) {
    return "tokens" in t && t.tokens ? this.parser.parseInline(t.tokens) : "escaped" in t && t.escaped ? t.text : q(t.text);
  }
}, Ke = class {
  strong({ text: t }) {
    return t;
  }
  em({ text: t }) {
    return t;
  }
  codespan({ text: t }) {
    return t;
  }
  del({ text: t }) {
    return t;
  }
  html({ text: t }) {
    return t;
  }
  text({ text: t }) {
    return t;
  }
  link({ text: t }) {
    return "" + t;
  }
  image({ text: t }) {
    return "" + t;
  }
  br() {
    return "";
  }
}, j = class $e {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || Z, this.options.renderer = this.options.renderer || new ge(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Ke();
  }
  static parse(e, n) {
    return new $e(n).parse(e);
  }
  static parseInline(e, n) {
    return new $e(n).parseInline(e);
  }
  parse(e, n = !0) {
    let s = "";
    for (let r = 0; r < e.length; r++) {
      let i = e[r];
      if (this.options.extensions?.renderers?.[i.type]) {
        let a = i, l = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (l !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(a.type)) {
          s += l || "";
          continue;
        }
      }
      let o = i;
      switch (o.type) {
        case "space": {
          s += this.renderer.space(o);
          continue;
        }
        case "hr": {
          s += this.renderer.hr(o);
          continue;
        }
        case "heading": {
          s += this.renderer.heading(o);
          continue;
        }
        case "code": {
          s += this.renderer.code(o);
          continue;
        }
        case "table": {
          s += this.renderer.table(o);
          continue;
        }
        case "blockquote": {
          s += this.renderer.blockquote(o);
          continue;
        }
        case "list": {
          s += this.renderer.list(o);
          continue;
        }
        case "html": {
          s += this.renderer.html(o);
          continue;
        }
        case "def": {
          s += this.renderer.def(o);
          continue;
        }
        case "paragraph": {
          s += this.renderer.paragraph(o);
          continue;
        }
        case "text": {
          let a = o, l = this.renderer.text(a);
          for (; r + 1 < e.length && e[r + 1].type === "text"; ) a = e[++r], l += `
` + this.renderer.text(a);
          n ? s += this.renderer.paragraph({ type: "paragraph", raw: l, text: l, tokens: [{ type: "text", raw: l, text: l, escaped: !0 }] }) : s += l;
          continue;
        }
        default: {
          let a = 'Token with "' + o.type + '" type was not found.';
          if (this.options.silent) return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return s;
  }
  parseInline(e, n = this.renderer) {
    let s = "";
    for (let r = 0; r < e.length; r++) {
      let i = e[r];
      if (this.options.extensions?.renderers?.[i.type]) {
        let a = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (a !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type)) {
          s += a || "";
          continue;
        }
      }
      let o = i;
      switch (o.type) {
        case "escape": {
          s += n.text(o);
          break;
        }
        case "html": {
          s += n.html(o);
          break;
        }
        case "link": {
          s += n.link(o);
          break;
        }
        case "image": {
          s += n.image(o);
          break;
        }
        case "strong": {
          s += n.strong(o);
          break;
        }
        case "em": {
          s += n.em(o);
          break;
        }
        case "codespan": {
          s += n.codespan(o);
          break;
        }
        case "br": {
          s += n.br(o);
          break;
        }
        case "del": {
          s += n.del(o);
          break;
        }
        case "text": {
          s += n.text(o);
          break;
        }
        default: {
          let a = 'Token with "' + o.type + '" type was not found.';
          if (this.options.silent) return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return s;
  }
}, ce = class {
  options;
  block;
  constructor(t) {
    this.options = t || Z;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(t) {
    return t;
  }
  postprocess(t) {
    return t;
  }
  processAllTokens(t) {
    return t;
  }
  provideLexer() {
    return this.block ? F.lex : F.lexInline;
  }
  provideParser() {
    return this.block ? j.parse : j.parseInline;
  }
}, Hn = class {
  defaults = Fe();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = j;
  Renderer = ge;
  TextRenderer = Ke;
  Lexer = F;
  Tokenizer = fe;
  Hooks = ce;
  constructor(...t) {
    this.use(...t);
  }
  walkTokens(t, e) {
    let n = [];
    for (let s of t) switch (n = n.concat(e.call(this, s)), s.type) {
      case "table": {
        let r = s;
        for (let i of r.header) n = n.concat(this.walkTokens(i.tokens, e));
        for (let i of r.rows) for (let o of i) n = n.concat(this.walkTokens(o.tokens, e));
        break;
      }
      case "list": {
        let r = s;
        n = n.concat(this.walkTokens(r.items, e));
        break;
      }
      default: {
        let r = s;
        this.defaults.extensions?.childTokens?.[r.type] ? this.defaults.extensions.childTokens[r.type].forEach((i) => {
          let o = r[i].flat(1 / 0);
          n = n.concat(this.walkTokens(o, e));
        }) : r.tokens && (n = n.concat(this.walkTokens(r.tokens, e)));
      }
    }
    return n;
  }
  use(...t) {
    let e = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return t.forEach((n) => {
      let s = { ...n };
      if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach((r) => {
        if (!r.name) throw new Error("extension name required");
        if ("renderer" in r) {
          let i = e.renderers[r.name];
          i ? e.renderers[r.name] = function(...o) {
            let a = r.renderer.apply(this, o);
            return a === !1 && (a = i.apply(this, o)), a;
          } : e.renderers[r.name] = r.renderer;
        }
        if ("tokenizer" in r) {
          if (!r.level || r.level !== "block" && r.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let i = e[r.level];
          i ? i.unshift(r.tokenizer) : e[r.level] = [r.tokenizer], r.start && (r.level === "block" ? e.startBlock ? e.startBlock.push(r.start) : e.startBlock = [r.start] : r.level === "inline" && (e.startInline ? e.startInline.push(r.start) : e.startInline = [r.start]));
        }
        "childTokens" in r && r.childTokens && (e.childTokens[r.name] = r.childTokens);
      }), s.extensions = e), n.renderer) {
        let r = this.defaults.renderer || new ge(this.defaults);
        for (let i in n.renderer) {
          if (!(i in r)) throw new Error(`renderer '${i}' does not exist`);
          if (["options", "parser"].includes(i)) continue;
          let o = i, a = n.renderer[o], l = r[o];
          r[o] = (...c) => {
            let p = a.apply(r, c);
            return p === !1 && (p = l.apply(r, c)), p || "";
          };
        }
        s.renderer = r;
      }
      if (n.tokenizer) {
        let r = this.defaults.tokenizer || new fe(this.defaults);
        for (let i in n.tokenizer) {
          if (!(i in r)) throw new Error(`tokenizer '${i}' does not exist`);
          if (["options", "rules", "lexer"].includes(i)) continue;
          let o = i, a = n.tokenizer[o], l = r[o];
          r[o] = (...c) => {
            let p = a.apply(r, c);
            return p === !1 && (p = l.apply(r, c)), p;
          };
        }
        s.tokenizer = r;
      }
      if (n.hooks) {
        let r = this.defaults.hooks || new ce();
        for (let i in n.hooks) {
          if (!(i in r)) throw new Error(`hook '${i}' does not exist`);
          if (["options", "block"].includes(i)) continue;
          let o = i, a = n.hooks[o], l = r[o];
          ce.passThroughHooks.has(i) ? r[o] = (c) => {
            if (this.defaults.async) return Promise.resolve(a.call(r, c)).then((h) => l.call(r, h));
            let p = a.call(r, c);
            return l.call(r, p);
          } : r[o] = (...c) => {
            let p = a.apply(r, c);
            return p === !1 && (p = l.apply(r, c)), p;
          };
        }
        s.hooks = r;
      }
      if (n.walkTokens) {
        let r = this.defaults.walkTokens, i = n.walkTokens;
        s.walkTokens = function(o) {
          let a = [];
          return a.push(i.call(this, o)), r && (a = a.concat(r.call(this, o))), a;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(t) {
    return this.defaults = { ...this.defaults, ...t }, this;
  }
  lexer(t, e) {
    return F.lex(t, e ?? this.defaults);
  }
  parser(t, e) {
    return j.parse(t, e ?? this.defaults);
  }
  parseMarkdown(t) {
    return (e, n) => {
      let s = { ...n }, r = { ...this.defaults, ...s }, i = this.onError(!!r.silent, !!r.async);
      if (this.defaults.async === !0 && s.async === !1) return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof e > "u" || e === null) return i(new Error("marked(): input parameter is undefined or null"));
      if (typeof e != "string") return i(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(e) + ", string expected"));
      r.hooks && (r.hooks.options = r, r.hooks.block = t);
      let o = r.hooks ? r.hooks.provideLexer() : t ? F.lex : F.lexInline, a = r.hooks ? r.hooks.provideParser() : t ? j.parse : j.parseInline;
      if (r.async) return Promise.resolve(r.hooks ? r.hooks.preprocess(e) : e).then((l) => o(l, r)).then((l) => r.hooks ? r.hooks.processAllTokens(l) : l).then((l) => r.walkTokens ? Promise.all(this.walkTokens(l, r.walkTokens)).then(() => l) : l).then((l) => a(l, r)).then((l) => r.hooks ? r.hooks.postprocess(l) : l).catch(i);
      try {
        r.hooks && (e = r.hooks.preprocess(e));
        let l = o(e, r);
        r.hooks && (l = r.hooks.processAllTokens(l)), r.walkTokens && this.walkTokens(l, r.walkTokens);
        let c = a(l, r);
        return r.hooks && (c = r.hooks.postprocess(c)), c;
      } catch (l) {
        return i(l);
      }
    };
  }
  onError(t, e) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, t) {
        let s = "<p>An error occurred:</p><pre>" + q(n.message + "", !0) + "</pre>";
        return e ? Promise.resolve(s) : s;
      }
      if (e) return Promise.reject(n);
      throw n;
    };
  }
}, V = new Hn();
function S(t, e) {
  return V.parse(t, e);
}
S.options = S.setOptions = function(t) {
  return V.setOptions(t), S.defaults = V.defaults, yt(S.defaults), S;
};
S.getDefaults = Fe;
S.defaults = Z;
S.use = function(...t) {
  return V.use(...t), S.defaults = V.defaults, yt(S.defaults), S;
};
S.walkTokens = function(t, e) {
  return V.walkTokens(t, e);
};
S.parseInline = V.parseInline;
S.Parser = j;
S.parser = j.parse;
S.Renderer = ge;
S.TextRenderer = Ke;
S.Lexer = F;
S.lexer = F.lex;
S.Tokenizer = fe;
S.Hooks = ce;
S.parse = S;
S.options;
S.setOptions;
S.use;
S.walkTokens;
S.parseInline;
j.parse;
F.lex;
function $t(t, e) {
  return function() {
    return t.apply(e, arguments);
  };
}
const { toString: Vn } = Object.prototype, { getPrototypeOf: Ge } = Object, { iterator: we, toStringTag: Lt } = Symbol, ye = /* @__PURE__ */ ((t) => (e) => {
  const n = Vn.call(e);
  return t[n] || (t[n] = n.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null)), I = (t) => (t = t.toLowerCase(), (e) => ye(e) === t), Se = (t) => (e) => typeof e === t, { isArray: W } = Array, te = Se("undefined");
function re(t) {
  return t !== null && !te(t) && t.constructor !== null && !te(t.constructor) && L(t.constructor.isBuffer) && t.constructor.isBuffer(t);
}
const Bt = I("ArrayBuffer");
function Jn(t) {
  let e;
  return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? e = ArrayBuffer.isView(t) : e = t && t.buffer && Bt(t.buffer), e;
}
const Zn = Se("string"), L = Se("function"), Nt = Se("number"), se = (t) => t !== null && typeof t == "object", Wn = (t) => t === !0 || t === !1, ue = (t) => {
  if (ye(t) !== "object")
    return !1;
  const e = Ge(t);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Lt in t) && !(we in t);
}, Kn = (t) => {
  if (!se(t) || re(t))
    return !1;
  try {
    return Object.keys(t).length === 0 && Object.getPrototypeOf(t) === Object.prototype;
  } catch {
    return !1;
  }
}, Gn = I("Date"), Qn = I("File"), Xn = I("Blob"), Yn = I("FileList"), er = (t) => se(t) && L(t.pipe), tr = (t) => {
  let e;
  return t && (typeof FormData == "function" && t instanceof FormData || L(t.append) && ((e = ye(t)) === "formdata" || // detect form-data instance
  e === "object" && L(t.toString) && t.toString() === "[object FormData]"));
}, nr = I("URLSearchParams"), [rr, sr, or, ir] = ["ReadableStream", "Request", "Response", "Headers"].map(I), ar = (t) => t.trim ? t.trim() : t.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function oe(t, e, { allOwnKeys: n = !1 } = {}) {
  if (t === null || typeof t > "u")
    return;
  let s, r;
  if (typeof t != "object" && (t = [t]), W(t))
    for (s = 0, r = t.length; s < r; s++)
      e.call(null, t[s], s, t);
  else {
    if (re(t))
      return;
    const i = n ? Object.getOwnPropertyNames(t) : Object.keys(t), o = i.length;
    let a;
    for (s = 0; s < o; s++)
      a = i[s], e.call(null, t[a], a, t);
  }
}
function zt(t, e) {
  if (re(t))
    return null;
  e = e.toLowerCase();
  const n = Object.keys(t);
  let s = n.length, r;
  for (; s-- > 0; )
    if (r = n[s], e === r.toLowerCase())
      return r;
  return null;
}
const M = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : global, Ut = (t) => !te(t) && t !== M;
function Le() {
  const { caseless: t } = Ut(this) && this || {}, e = {}, n = (s, r) => {
    const i = t && zt(e, r) || r;
    ue(e[i]) && ue(s) ? e[i] = Le(e[i], s) : ue(s) ? e[i] = Le({}, s) : W(s) ? e[i] = s.slice() : e[i] = s;
  };
  for (let s = 0, r = arguments.length; s < r; s++)
    arguments[s] && oe(arguments[s], n);
  return e;
}
const lr = (t, e, n, { allOwnKeys: s } = {}) => (oe(e, (r, i) => {
  n && L(r) ? t[i] = $t(r, n) : t[i] = r;
}, { allOwnKeys: s }), t), cr = (t) => (t.charCodeAt(0) === 65279 && (t = t.slice(1)), t), ur = (t, e, n, s) => {
  t.prototype = Object.create(e.prototype, s), t.prototype.constructor = t, Object.defineProperty(t, "super", {
    value: e.prototype
  }), n && Object.assign(t.prototype, n);
}, pr = (t, e, n, s) => {
  let r, i, o;
  const a = {};
  if (e = e || {}, t == null) return e;
  do {
    for (r = Object.getOwnPropertyNames(t), i = r.length; i-- > 0; )
      o = r[i], (!s || s(o, t, e)) && !a[o] && (e[o] = t[o], a[o] = !0);
    t = n !== !1 && Ge(t);
  } while (t && (!n || n(t, e)) && t !== Object.prototype);
  return e;
}, hr = (t, e, n) => {
  t = String(t), (n === void 0 || n > t.length) && (n = t.length), n -= e.length;
  const s = t.indexOf(e, n);
  return s !== -1 && s === n;
}, dr = (t) => {
  if (!t) return null;
  if (W(t)) return t;
  let e = t.length;
  if (!Nt(e)) return null;
  const n = new Array(e);
  for (; e-- > 0; )
    n[e] = t[e];
  return n;
}, fr = /* @__PURE__ */ ((t) => (e) => t && e instanceof t)(typeof Uint8Array < "u" && Ge(Uint8Array)), gr = (t, e) => {
  const s = (t && t[we]).call(t);
  let r;
  for (; (r = s.next()) && !r.done; ) {
    const i = r.value;
    e.call(t, i[0], i[1]);
  }
}, mr = (t, e) => {
  let n;
  const s = [];
  for (; (n = t.exec(e)) !== null; )
    s.push(n);
  return s;
}, br = I("HTMLFormElement"), kr = (t) => t.toLowerCase().replace(
  /[-_\s]([a-z\d])(\w*)/g,
  function(n, s, r) {
    return s.toUpperCase() + r;
  }
), at = (({ hasOwnProperty: t }) => (e, n) => t.call(e, n))(Object.prototype), xr = I("RegExp"), It = (t, e) => {
  const n = Object.getOwnPropertyDescriptors(t), s = {};
  oe(n, (r, i) => {
    let o;
    (o = e(r, i, t)) !== !1 && (s[i] = o || r);
  }), Object.defineProperties(t, s);
}, wr = (t) => {
  It(t, (e, n) => {
    if (L(t) && ["arguments", "caller", "callee"].indexOf(n) !== -1)
      return !1;
    const s = t[n];
    if (L(s)) {
      if (e.enumerable = !1, "writable" in e) {
        e.writable = !1;
        return;
      }
      e.set || (e.set = () => {
        throw Error("Can not rewrite read-only method '" + n + "'");
      });
    }
  });
}, yr = (t, e) => {
  const n = {}, s = (r) => {
    r.forEach((i) => {
      n[i] = !0;
    });
  };
  return W(t) ? s(t) : s(String(t).split(e)), n;
}, Sr = () => {
}, Rr = (t, e) => t != null && Number.isFinite(t = +t) ? t : e;
function Er(t) {
  return !!(t && L(t.append) && t[Lt] === "FormData" && t[we]);
}
const Tr = (t) => {
  const e = new Array(10), n = (s, r) => {
    if (se(s)) {
      if (e.indexOf(s) >= 0)
        return;
      if (re(s))
        return s;
      if (!("toJSON" in s)) {
        e[r] = s;
        const i = W(s) ? [] : {};
        return oe(s, (o, a) => {
          const l = n(o, r + 1);
          !te(l) && (i[a] = l);
        }), e[r] = void 0, i;
      }
    }
    return s;
  };
  return n(t, 0);
}, _r = I("AsyncFunction"), Ar = (t) => t && (se(t) || L(t)) && L(t.then) && L(t.catch), Dt = ((t, e) => t ? setImmediate : e ? ((n, s) => (M.addEventListener("message", ({ source: r, data: i }) => {
  r === M && i === n && s.length && s.shift()();
}, !1), (r) => {
  s.push(r), M.postMessage(n, "*");
}))(`axios@${Math.random()}`, []) : (n) => setTimeout(n))(
  typeof setImmediate == "function",
  L(M.postMessage)
), vr = typeof queueMicrotask < "u" ? queueMicrotask.bind(M) : typeof process < "u" && process.nextTick || Dt, Pr = (t) => t != null && L(t[we]), u = {
  isArray: W,
  isArrayBuffer: Bt,
  isBuffer: re,
  isFormData: tr,
  isArrayBufferView: Jn,
  isString: Zn,
  isNumber: Nt,
  isBoolean: Wn,
  isObject: se,
  isPlainObject: ue,
  isEmptyObject: Kn,
  isReadableStream: rr,
  isRequest: sr,
  isResponse: or,
  isHeaders: ir,
  isUndefined: te,
  isDate: Gn,
  isFile: Qn,
  isBlob: Xn,
  isRegExp: xr,
  isFunction: L,
  isStream: er,
  isURLSearchParams: nr,
  isTypedArray: fr,
  isFileList: Yn,
  forEach: oe,
  merge: Le,
  extend: lr,
  trim: ar,
  stripBOM: cr,
  inherits: ur,
  toFlatObject: pr,
  kindOf: ye,
  kindOfTest: I,
  endsWith: hr,
  toArray: dr,
  forEachEntry: gr,
  matchAll: mr,
  isHTMLForm: br,
  hasOwnProperty: at,
  hasOwnProp: at,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors: It,
  freezeMethods: wr,
  toObjectSet: yr,
  toCamelCase: kr,
  noop: Sr,
  toFiniteNumber: Rr,
  findKey: zt,
  global: M,
  isContextDefined: Ut,
  isSpecCompliantForm: Er,
  toJSONObject: Tr,
  isAsyncFn: _r,
  isThenable: Ar,
  setImmediate: Dt,
  asap: vr,
  isIterable: Pr
};
function y(t, e, n, s, r) {
  Error.call(this), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack, this.message = t, this.name = "AxiosError", e && (this.code = e), n && (this.config = n), s && (this.request = s), r && (this.response = r, this.status = r.status ? r.status : null);
}
u.inherits(y, Error, {
  toJSON: function() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: u.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }
});
const qt = y.prototype, Ft = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL"
  // eslint-disable-next-line func-names
].forEach((t) => {
  Ft[t] = { value: t };
});
Object.defineProperties(y, Ft);
Object.defineProperty(qt, "isAxiosError", { value: !0 });
y.from = (t, e, n, s, r, i) => {
  const o = Object.create(qt);
  return u.toFlatObject(t, o, function(l) {
    return l !== Error.prototype;
  }, (a) => a !== "isAxiosError"), y.call(o, t.message, e, n, s, r), o.cause = t, o.name = t.name, i && Object.assign(o, i), o;
};
const Cr = null;
function Be(t) {
  return u.isPlainObject(t) || u.isArray(t);
}
function jt(t) {
  return u.endsWith(t, "[]") ? t.slice(0, -2) : t;
}
function lt(t, e, n) {
  return t ? t.concat(e).map(function(r, i) {
    return r = jt(r), !n && i ? "[" + r + "]" : r;
  }).join(n ? "." : "") : e;
}
function Or(t) {
  return u.isArray(t) && !t.some(Be);
}
const $r = u.toFlatObject(u, {}, null, function(e) {
  return /^is[A-Z]/.test(e);
});
function Re(t, e, n) {
  if (!u.isObject(t))
    throw new TypeError("target must be an object");
  e = e || new FormData(), n = u.toFlatObject(n, {
    metaTokens: !0,
    dots: !1,
    indexes: !1
  }, !1, function(k, f) {
    return !u.isUndefined(f[k]);
  });
  const s = n.metaTokens, r = n.visitor || p, i = n.dots, o = n.indexes, l = (n.Blob || typeof Blob < "u" && Blob) && u.isSpecCompliantForm(e);
  if (!u.isFunction(r))
    throw new TypeError("visitor must be a function");
  function c(d) {
    if (d === null) return "";
    if (u.isDate(d))
      return d.toISOString();
    if (u.isBoolean(d))
      return d.toString();
    if (!l && u.isBlob(d))
      throw new y("Blob is not supported. Use a Buffer instead.");
    return u.isArrayBuffer(d) || u.isTypedArray(d) ? l && typeof Blob == "function" ? new Blob([d]) : Buffer.from(d) : d;
  }
  function p(d, k, f) {
    let w = d;
    if (d && !f && typeof d == "object") {
      if (u.endsWith(k, "{}"))
        k = s ? k : k.slice(0, -2), d = JSON.stringify(d);
      else if (u.isArray(d) && Or(d) || (u.isFileList(d) || u.endsWith(k, "[]")) && (w = u.toArray(d)))
        return k = jt(k), w.forEach(function(E, P) {
          !(u.isUndefined(E) || E === null) && e.append(
            // eslint-disable-next-line no-nested-ternary
            o === !0 ? lt([k], P, i) : o === null ? k : k + "[]",
            c(E)
          );
        }), !1;
    }
    return Be(d) ? !0 : (e.append(lt(f, k, i), c(d)), !1);
  }
  const h = [], g = Object.assign($r, {
    defaultVisitor: p,
    convertValue: c,
    isVisitable: Be
  });
  function b(d, k) {
    if (!u.isUndefined(d)) {
      if (h.indexOf(d) !== -1)
        throw Error("Circular reference detected in " + k.join("."));
      h.push(d), u.forEach(d, function(w, m) {
        (!(u.isUndefined(w) || w === null) && r.call(
          e,
          w,
          u.isString(m) ? m.trim() : m,
          k,
          g
        )) === !0 && b(w, k ? k.concat(m) : [m]);
      }), h.pop();
    }
  }
  if (!u.isObject(t))
    throw new TypeError("data must be an object");
  return b(t), e;
}
function ct(t) {
  const e = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(t).replace(/[!'()~]|%20|%00/g, function(s) {
    return e[s];
  });
}
function Qe(t, e) {
  this._pairs = [], t && Re(t, this, e);
}
const Mt = Qe.prototype;
Mt.append = function(e, n) {
  this._pairs.push([e, n]);
};
Mt.toString = function(e) {
  const n = e ? function(s) {
    return e.call(this, s, ct);
  } : ct;
  return this._pairs.map(function(r) {
    return n(r[0]) + "=" + n(r[1]);
  }, "").join("&");
};
function Lr(t) {
  return encodeURIComponent(t).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
function Ht(t, e, n) {
  if (!e)
    return t;
  const s = n && n.encode || Lr;
  u.isFunction(n) && (n = {
    serialize: n
  });
  const r = n && n.serialize;
  let i;
  if (r ? i = r(e, n) : i = u.isURLSearchParams(e) ? e.toString() : new Qe(e, n).toString(s), i) {
    const o = t.indexOf("#");
    o !== -1 && (t = t.slice(0, o)), t += (t.indexOf("?") === -1 ? "?" : "&") + i;
  }
  return t;
}
class ut {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(e, n, s) {
    return this.handlers.push({
      fulfilled: e,
      rejected: n,
      synchronous: s ? s.synchronous : !1,
      runWhen: s ? s.runWhen : null
    }), this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(e) {
    this.handlers[e] && (this.handlers[e] = null);
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    this.handlers && (this.handlers = []);
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(e) {
    u.forEach(this.handlers, function(s) {
      s !== null && e(s);
    });
  }
}
const Vt = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1
}, Br = typeof URLSearchParams < "u" ? URLSearchParams : Qe, Nr = typeof FormData < "u" ? FormData : null, zr = typeof Blob < "u" ? Blob : null, Ur = {
  isBrowser: !0,
  classes: {
    URLSearchParams: Br,
    FormData: Nr,
    Blob: zr
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
}, Xe = typeof window < "u" && typeof document < "u", Ne = typeof navigator == "object" && navigator || void 0, Ir = Xe && (!Ne || ["ReactNative", "NativeScript", "NS"].indexOf(Ne.product) < 0), Dr = typeof WorkerGlobalScope < "u" && // eslint-disable-next-line no-undef
self instanceof WorkerGlobalScope && typeof self.importScripts == "function", qr = Xe && window.location.href || "http://localhost", Fr = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv: Xe,
  hasStandardBrowserEnv: Ir,
  hasStandardBrowserWebWorkerEnv: Dr,
  navigator: Ne,
  origin: qr
}, Symbol.toStringTag, { value: "Module" })), O = {
  ...Fr,
  ...Ur
};
function jr(t, e) {
  return Re(t, new O.classes.URLSearchParams(), {
    visitor: function(n, s, r, i) {
      return O.isNode && u.isBuffer(n) ? (this.append(s, n.toString("base64")), !1) : i.defaultVisitor.apply(this, arguments);
    },
    ...e
  });
}
function Mr(t) {
  return u.matchAll(/\w+|\[(\w*)]/g, t).map((e) => e[0] === "[]" ? "" : e[1] || e[0]);
}
function Hr(t) {
  const e = {}, n = Object.keys(t);
  let s;
  const r = n.length;
  let i;
  for (s = 0; s < r; s++)
    i = n[s], e[i] = t[i];
  return e;
}
function Jt(t) {
  function e(n, s, r, i) {
    let o = n[i++];
    if (o === "__proto__") return !0;
    const a = Number.isFinite(+o), l = i >= n.length;
    return o = !o && u.isArray(r) ? r.length : o, l ? (u.hasOwnProp(r, o) ? r[o] = [r[o], s] : r[o] = s, !a) : ((!r[o] || !u.isObject(r[o])) && (r[o] = []), e(n, s, r[o], i) && u.isArray(r[o]) && (r[o] = Hr(r[o])), !a);
  }
  if (u.isFormData(t) && u.isFunction(t.entries)) {
    const n = {};
    return u.forEachEntry(t, (s, r) => {
      e(Mr(s), r, n, 0);
    }), n;
  }
  return null;
}
function Vr(t, e, n) {
  if (u.isString(t))
    try {
      return (e || JSON.parse)(t), u.trim(t);
    } catch (s) {
      if (s.name !== "SyntaxError")
        throw s;
    }
  return (n || JSON.stringify)(t);
}
const ie = {
  transitional: Vt,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [function(e, n) {
    const s = n.getContentType() || "", r = s.indexOf("application/json") > -1, i = u.isObject(e);
    if (i && u.isHTMLForm(e) && (e = new FormData(e)), u.isFormData(e))
      return r ? JSON.stringify(Jt(e)) : e;
    if (u.isArrayBuffer(e) || u.isBuffer(e) || u.isStream(e) || u.isFile(e) || u.isBlob(e) || u.isReadableStream(e))
      return e;
    if (u.isArrayBufferView(e))
      return e.buffer;
    if (u.isURLSearchParams(e))
      return n.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), e.toString();
    let a;
    if (i) {
      if (s.indexOf("application/x-www-form-urlencoded") > -1)
        return jr(e, this.formSerializer).toString();
      if ((a = u.isFileList(e)) || s.indexOf("multipart/form-data") > -1) {
        const l = this.env && this.env.FormData;
        return Re(
          a ? { "files[]": e } : e,
          l && new l(),
          this.formSerializer
        );
      }
    }
    return i || r ? (n.setContentType("application/json", !1), Vr(e)) : e;
  }],
  transformResponse: [function(e) {
    const n = this.transitional || ie.transitional, s = n && n.forcedJSONParsing, r = this.responseType === "json";
    if (u.isResponse(e) || u.isReadableStream(e))
      return e;
    if (e && u.isString(e) && (s && !this.responseType || r)) {
      const o = !(n && n.silentJSONParsing) && r;
      try {
        return JSON.parse(e);
      } catch (a) {
        if (o)
          throw a.name === "SyntaxError" ? y.from(a, y.ERR_BAD_RESPONSE, this, null, this.response) : a;
      }
    }
    return e;
  }],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: O.classes.FormData,
    Blob: O.classes.Blob
  },
  validateStatus: function(e) {
    return e >= 200 && e < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
u.forEach(["delete", "get", "head", "post", "put", "patch"], (t) => {
  ie.headers[t] = {};
});
const Jr = u.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]), Zr = (t) => {
  const e = {};
  let n, s, r;
  return t && t.split(`
`).forEach(function(o) {
    r = o.indexOf(":"), n = o.substring(0, r).trim().toLowerCase(), s = o.substring(r + 1).trim(), !(!n || e[n] && Jr[n]) && (n === "set-cookie" ? e[n] ? e[n].push(s) : e[n] = [s] : e[n] = e[n] ? e[n] + ", " + s : s);
  }), e;
}, pt = Symbol("internals");
function X(t) {
  return t && String(t).trim().toLowerCase();
}
function pe(t) {
  return t === !1 || t == null ? t : u.isArray(t) ? t.map(pe) : String(t);
}
function Wr(t) {
  const e = /* @__PURE__ */ Object.create(null), n = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let s;
  for (; s = n.exec(t); )
    e[s[1]] = s[2];
  return e;
}
const Kr = (t) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(t.trim());
function _e(t, e, n, s, r) {
  if (u.isFunction(s))
    return s.call(this, e, n);
  if (r && (e = n), !!u.isString(e)) {
    if (u.isString(s))
      return e.indexOf(s) !== -1;
    if (u.isRegExp(s))
      return s.test(e);
  }
}
function Gr(t) {
  return t.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (e, n, s) => n.toUpperCase() + s);
}
function Qr(t, e) {
  const n = u.toCamelCase(" " + e);
  ["get", "set", "has"].forEach((s) => {
    Object.defineProperty(t, s + n, {
      value: function(r, i, o) {
        return this[s].call(this, e, r, i, o);
      },
      configurable: !0
    });
  });
}
let B = class {
  constructor(e) {
    e && this.set(e);
  }
  set(e, n, s) {
    const r = this;
    function i(a, l, c) {
      const p = X(l);
      if (!p)
        throw new Error("header name must be a non-empty string");
      const h = u.findKey(r, p);
      (!h || r[h] === void 0 || c === !0 || c === void 0 && r[h] !== !1) && (r[h || l] = pe(a));
    }
    const o = (a, l) => u.forEach(a, (c, p) => i(c, p, l));
    if (u.isPlainObject(e) || e instanceof this.constructor)
      o(e, n);
    else if (u.isString(e) && (e = e.trim()) && !Kr(e))
      o(Zr(e), n);
    else if (u.isObject(e) && u.isIterable(e)) {
      let a = {}, l, c;
      for (const p of e) {
        if (!u.isArray(p))
          throw TypeError("Object iterator must return a key-value pair");
        a[c = p[0]] = (l = a[c]) ? u.isArray(l) ? [...l, p[1]] : [l, p[1]] : p[1];
      }
      o(a, n);
    } else
      e != null && i(n, e, s);
    return this;
  }
  get(e, n) {
    if (e = X(e), e) {
      const s = u.findKey(this, e);
      if (s) {
        const r = this[s];
        if (!n)
          return r;
        if (n === !0)
          return Wr(r);
        if (u.isFunction(n))
          return n.call(this, r, s);
        if (u.isRegExp(n))
          return n.exec(r);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(e, n) {
    if (e = X(e), e) {
      const s = u.findKey(this, e);
      return !!(s && this[s] !== void 0 && (!n || _e(this, this[s], s, n)));
    }
    return !1;
  }
  delete(e, n) {
    const s = this;
    let r = !1;
    function i(o) {
      if (o = X(o), o) {
        const a = u.findKey(s, o);
        a && (!n || _e(s, s[a], a, n)) && (delete s[a], r = !0);
      }
    }
    return u.isArray(e) ? e.forEach(i) : i(e), r;
  }
  clear(e) {
    const n = Object.keys(this);
    let s = n.length, r = !1;
    for (; s--; ) {
      const i = n[s];
      (!e || _e(this, this[i], i, e, !0)) && (delete this[i], r = !0);
    }
    return r;
  }
  normalize(e) {
    const n = this, s = {};
    return u.forEach(this, (r, i) => {
      const o = u.findKey(s, i);
      if (o) {
        n[o] = pe(r), delete n[i];
        return;
      }
      const a = e ? Gr(i) : String(i).trim();
      a !== i && delete n[i], n[a] = pe(r), s[a] = !0;
    }), this;
  }
  concat(...e) {
    return this.constructor.concat(this, ...e);
  }
  toJSON(e) {
    const n = /* @__PURE__ */ Object.create(null);
    return u.forEach(this, (s, r) => {
      s != null && s !== !1 && (n[r] = e && u.isArray(s) ? s.join(", ") : s);
    }), n;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([e, n]) => e + ": " + n).join(`
`);
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(e) {
    return e instanceof this ? e : new this(e);
  }
  static concat(e, ...n) {
    const s = new this(e);
    return n.forEach((r) => s.set(r)), s;
  }
  static accessor(e) {
    const s = (this[pt] = this[pt] = {
      accessors: {}
    }).accessors, r = this.prototype;
    function i(o) {
      const a = X(o);
      s[a] || (Qr(r, o), s[a] = !0);
    }
    return u.isArray(e) ? e.forEach(i) : i(e), this;
  }
};
B.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
u.reduceDescriptors(B.prototype, ({ value: t }, e) => {
  let n = e[0].toUpperCase() + e.slice(1);
  return {
    get: () => t,
    set(s) {
      this[n] = s;
    }
  };
});
u.freezeMethods(B);
function Ae(t, e) {
  const n = this || ie, s = e || n, r = B.from(s.headers);
  let i = s.data;
  return u.forEach(t, function(a) {
    i = a.call(n, i, r.normalize(), e ? e.status : void 0);
  }), r.normalize(), i;
}
function Zt(t) {
  return !!(t && t.__CANCEL__);
}
function K(t, e, n) {
  y.call(this, t ?? "canceled", y.ERR_CANCELED, e, n), this.name = "CanceledError";
}
u.inherits(K, y, {
  __CANCEL__: !0
});
function Wt(t, e, n) {
  const s = n.config.validateStatus;
  !n.status || !s || s(n.status) ? t(n) : e(new y(
    "Request failed with status code " + n.status,
    [y.ERR_BAD_REQUEST, y.ERR_BAD_RESPONSE][Math.floor(n.status / 100) - 4],
    n.config,
    n.request,
    n
  ));
}
function Xr(t) {
  const e = /^([-+\w]{1,25})(:?\/\/|:)/.exec(t);
  return e && e[1] || "";
}
function Yr(t, e) {
  t = t || 10;
  const n = new Array(t), s = new Array(t);
  let r = 0, i = 0, o;
  return e = e !== void 0 ? e : 1e3, function(l) {
    const c = Date.now(), p = s[i];
    o || (o = c), n[r] = l, s[r] = c;
    let h = i, g = 0;
    for (; h !== r; )
      g += n[h++], h = h % t;
    if (r = (r + 1) % t, r === i && (i = (i + 1) % t), c - o < e)
      return;
    const b = p && c - p;
    return b ? Math.round(g * 1e3 / b) : void 0;
  };
}
function es(t, e) {
  let n = 0, s = 1e3 / e, r, i;
  const o = (c, p = Date.now()) => {
    n = p, r = null, i && (clearTimeout(i), i = null), t(...c);
  };
  return [(...c) => {
    const p = Date.now(), h = p - n;
    h >= s ? o(c, p) : (r = c, i || (i = setTimeout(() => {
      i = null, o(r);
    }, s - h)));
  }, () => r && o(r)];
}
const me = (t, e, n = 3) => {
  let s = 0;
  const r = Yr(50, 250);
  return es((i) => {
    const o = i.loaded, a = i.lengthComputable ? i.total : void 0, l = o - s, c = r(l), p = o <= a;
    s = o;
    const h = {
      loaded: o,
      total: a,
      progress: a ? o / a : void 0,
      bytes: l,
      rate: c || void 0,
      estimated: c && a && p ? (a - o) / c : void 0,
      event: i,
      lengthComputable: a != null,
      [e ? "download" : "upload"]: !0
    };
    t(h);
  }, n);
}, ht = (t, e) => {
  const n = t != null;
  return [(s) => e[0]({
    lengthComputable: n,
    total: t,
    loaded: s
  }), e[1]];
}, dt = (t) => (...e) => u.asap(() => t(...e)), ts = O.hasStandardBrowserEnv ? /* @__PURE__ */ ((t, e) => (n) => (n = new URL(n, O.origin), t.protocol === n.protocol && t.host === n.host && (e || t.port === n.port)))(
  new URL(O.origin),
  O.navigator && /(msie|trident)/i.test(O.navigator.userAgent)
) : () => !0, ns = O.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(t, e, n, s, r, i) {
      const o = [t + "=" + encodeURIComponent(e)];
      u.isNumber(n) && o.push("expires=" + new Date(n).toGMTString()), u.isString(s) && o.push("path=" + s), u.isString(r) && o.push("domain=" + r), i === !0 && o.push("secure"), document.cookie = o.join("; ");
    },
    read(t) {
      const e = document.cookie.match(new RegExp("(^|;\\s*)(" + t + ")=([^;]*)"));
      return e ? decodeURIComponent(e[3]) : null;
    },
    remove(t) {
      this.write(t, "", Date.now() - 864e5);
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);
function rs(t) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(t);
}
function ss(t, e) {
  return e ? t.replace(/\/?\/$/, "") + "/" + e.replace(/^\/+/, "") : t;
}
function Kt(t, e, n) {
  let s = !rs(e);
  return t && (s || n == !1) ? ss(t, e) : e;
}
const ft = (t) => t instanceof B ? { ...t } : t;
function J(t, e) {
  e = e || {};
  const n = {};
  function s(c, p, h, g) {
    return u.isPlainObject(c) && u.isPlainObject(p) ? u.merge.call({ caseless: g }, c, p) : u.isPlainObject(p) ? u.merge({}, p) : u.isArray(p) ? p.slice() : p;
  }
  function r(c, p, h, g) {
    if (u.isUndefined(p)) {
      if (!u.isUndefined(c))
        return s(void 0, c, h, g);
    } else return s(c, p, h, g);
  }
  function i(c, p) {
    if (!u.isUndefined(p))
      return s(void 0, p);
  }
  function o(c, p) {
    if (u.isUndefined(p)) {
      if (!u.isUndefined(c))
        return s(void 0, c);
    } else return s(void 0, p);
  }
  function a(c, p, h) {
    if (h in e)
      return s(c, p);
    if (h in t)
      return s(void 0, c);
  }
  const l = {
    url: i,
    method: i,
    data: i,
    baseURL: o,
    transformRequest: o,
    transformResponse: o,
    paramsSerializer: o,
    timeout: o,
    timeoutMessage: o,
    withCredentials: o,
    withXSRFToken: o,
    adapter: o,
    responseType: o,
    xsrfCookieName: o,
    xsrfHeaderName: o,
    onUploadProgress: o,
    onDownloadProgress: o,
    decompress: o,
    maxContentLength: o,
    maxBodyLength: o,
    beforeRedirect: o,
    transport: o,
    httpAgent: o,
    httpsAgent: o,
    cancelToken: o,
    socketPath: o,
    responseEncoding: o,
    validateStatus: a,
    headers: (c, p, h) => r(ft(c), ft(p), h, !0)
  };
  return u.forEach(Object.keys({ ...t, ...e }), function(p) {
    const h = l[p] || r, g = h(t[p], e[p], p);
    u.isUndefined(g) && h !== a || (n[p] = g);
  }), n;
}
const Gt = (t) => {
  const e = J({}, t);
  let { data: n, withXSRFToken: s, xsrfHeaderName: r, xsrfCookieName: i, headers: o, auth: a } = e;
  e.headers = o = B.from(o), e.url = Ht(Kt(e.baseURL, e.url, e.allowAbsoluteUrls), t.params, t.paramsSerializer), a && o.set(
    "Authorization",
    "Basic " + btoa((a.username || "") + ":" + (a.password ? unescape(encodeURIComponent(a.password)) : ""))
  );
  let l;
  if (u.isFormData(n)) {
    if (O.hasStandardBrowserEnv || O.hasStandardBrowserWebWorkerEnv)
      o.setContentType(void 0);
    else if ((l = o.getContentType()) !== !1) {
      const [c, ...p] = l ? l.split(";").map((h) => h.trim()).filter(Boolean) : [];
      o.setContentType([c || "multipart/form-data", ...p].join("; "));
    }
  }
  if (O.hasStandardBrowserEnv && (s && u.isFunction(s) && (s = s(e)), s || s !== !1 && ts(e.url))) {
    const c = r && i && ns.read(i);
    c && o.set(r, c);
  }
  return e;
}, os = typeof XMLHttpRequest < "u", is = os && function(t) {
  return new Promise(function(n, s) {
    const r = Gt(t);
    let i = r.data;
    const o = B.from(r.headers).normalize();
    let { responseType: a, onUploadProgress: l, onDownloadProgress: c } = r, p, h, g, b, d;
    function k() {
      b && b(), d && d(), r.cancelToken && r.cancelToken.unsubscribe(p), r.signal && r.signal.removeEventListener("abort", p);
    }
    let f = new XMLHttpRequest();
    f.open(r.method.toUpperCase(), r.url, !0), f.timeout = r.timeout;
    function w() {
      if (!f)
        return;
      const E = B.from(
        "getAllResponseHeaders" in f && f.getAllResponseHeaders()
      ), C = {
        data: !a || a === "text" || a === "json" ? f.responseText : f.response,
        status: f.status,
        statusText: f.statusText,
        headers: E,
        config: t,
        request: f
      };
      Wt(function(N) {
        n(N), k();
      }, function(N) {
        s(N), k();
      }, C), f = null;
    }
    "onloadend" in f ? f.onloadend = w : f.onreadystatechange = function() {
      !f || f.readyState !== 4 || f.status === 0 && !(f.responseURL && f.responseURL.indexOf("file:") === 0) || setTimeout(w);
    }, f.onabort = function() {
      f && (s(new y("Request aborted", y.ECONNABORTED, t, f)), f = null);
    }, f.onerror = function() {
      s(new y("Network Error", y.ERR_NETWORK, t, f)), f = null;
    }, f.ontimeout = function() {
      let P = r.timeout ? "timeout of " + r.timeout + "ms exceeded" : "timeout exceeded";
      const C = r.transitional || Vt;
      r.timeoutErrorMessage && (P = r.timeoutErrorMessage), s(new y(
        P,
        C.clarifyTimeoutError ? y.ETIMEDOUT : y.ECONNABORTED,
        t,
        f
      )), f = null;
    }, i === void 0 && o.setContentType(null), "setRequestHeader" in f && u.forEach(o.toJSON(), function(P, C) {
      f.setRequestHeader(C, P);
    }), u.isUndefined(r.withCredentials) || (f.withCredentials = !!r.withCredentials), a && a !== "json" && (f.responseType = r.responseType), c && ([g, d] = me(c, !0), f.addEventListener("progress", g)), l && f.upload && ([h, b] = me(l), f.upload.addEventListener("progress", h), f.upload.addEventListener("loadend", b)), (r.cancelToken || r.signal) && (p = (E) => {
      f && (s(!E || E.type ? new K(null, t, f) : E), f.abort(), f = null);
    }, r.cancelToken && r.cancelToken.subscribe(p), r.signal && (r.signal.aborted ? p() : r.signal.addEventListener("abort", p)));
    const m = Xr(r.url);
    if (m && O.protocols.indexOf(m) === -1) {
      s(new y("Unsupported protocol " + m + ":", y.ERR_BAD_REQUEST, t));
      return;
    }
    f.send(i || null);
  });
}, as = (t, e) => {
  const { length: n } = t = t ? t.filter(Boolean) : [];
  if (e || n) {
    let s = new AbortController(), r;
    const i = function(c) {
      if (!r) {
        r = !0, a();
        const p = c instanceof Error ? c : this.reason;
        s.abort(p instanceof y ? p : new K(p instanceof Error ? p.message : p));
      }
    };
    let o = e && setTimeout(() => {
      o = null, i(new y(`timeout ${e} of ms exceeded`, y.ETIMEDOUT));
    }, e);
    const a = () => {
      t && (o && clearTimeout(o), o = null, t.forEach((c) => {
        c.unsubscribe ? c.unsubscribe(i) : c.removeEventListener("abort", i);
      }), t = null);
    };
    t.forEach((c) => c.addEventListener("abort", i));
    const { signal: l } = s;
    return l.unsubscribe = () => u.asap(a), l;
  }
}, ls = function* (t, e) {
  let n = t.byteLength;
  if (n < e) {
    yield t;
    return;
  }
  let s = 0, r;
  for (; s < n; )
    r = s + e, yield t.slice(s, r), s = r;
}, cs = async function* (t, e) {
  for await (const n of us(t))
    yield* ls(n, e);
}, us = async function* (t) {
  if (t[Symbol.asyncIterator]) {
    yield* t;
    return;
  }
  const e = t.getReader();
  try {
    for (; ; ) {
      const { done: n, value: s } = await e.read();
      if (n)
        break;
      yield s;
    }
  } finally {
    await e.cancel();
  }
}, gt = (t, e, n, s) => {
  const r = cs(t, e);
  let i = 0, o, a = (l) => {
    o || (o = !0, s && s(l));
  };
  return new ReadableStream({
    async pull(l) {
      try {
        const { done: c, value: p } = await r.next();
        if (c) {
          a(), l.close();
          return;
        }
        let h = p.byteLength;
        if (n) {
          let g = i += h;
          n(g);
        }
        l.enqueue(new Uint8Array(p));
      } catch (c) {
        throw a(c), c;
      }
    },
    cancel(l) {
      return a(l), r.return();
    }
  }, {
    highWaterMark: 2
  });
}, Ee = typeof fetch == "function" && typeof Request == "function" && typeof Response == "function", Qt = Ee && typeof ReadableStream == "function", ps = Ee && (typeof TextEncoder == "function" ? /* @__PURE__ */ ((t) => (e) => t.encode(e))(new TextEncoder()) : async (t) => new Uint8Array(await new Response(t).arrayBuffer())), Xt = (t, ...e) => {
  try {
    return !!t(...e);
  } catch {
    return !1;
  }
}, hs = Qt && Xt(() => {
  let t = !1;
  const e = new Request(O.origin, {
    body: new ReadableStream(),
    method: "POST",
    get duplex() {
      return t = !0, "half";
    }
  }).headers.has("Content-Type");
  return t && !e;
}), mt = 64 * 1024, ze = Qt && Xt(() => u.isReadableStream(new Response("").body)), be = {
  stream: ze && ((t) => t.body)
};
Ee && ((t) => {
  ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((e) => {
    !be[e] && (be[e] = u.isFunction(t[e]) ? (n) => n[e]() : (n, s) => {
      throw new y(`Response type '${e}' is not supported`, y.ERR_NOT_SUPPORT, s);
    });
  });
})(new Response());
const ds = async (t) => {
  if (t == null)
    return 0;
  if (u.isBlob(t))
    return t.size;
  if (u.isSpecCompliantForm(t))
    return (await new Request(O.origin, {
      method: "POST",
      body: t
    }).arrayBuffer()).byteLength;
  if (u.isArrayBufferView(t) || u.isArrayBuffer(t))
    return t.byteLength;
  if (u.isURLSearchParams(t) && (t = t + ""), u.isString(t))
    return (await ps(t)).byteLength;
}, fs = async (t, e) => {
  const n = u.toFiniteNumber(t.getContentLength());
  return n ?? ds(e);
}, gs = Ee && (async (t) => {
  let {
    url: e,
    method: n,
    data: s,
    signal: r,
    cancelToken: i,
    timeout: o,
    onDownloadProgress: a,
    onUploadProgress: l,
    responseType: c,
    headers: p,
    withCredentials: h = "same-origin",
    fetchOptions: g
  } = Gt(t);
  c = c ? (c + "").toLowerCase() : "text";
  let b = as([r, i && i.toAbortSignal()], o), d;
  const k = b && b.unsubscribe && (() => {
    b.unsubscribe();
  });
  let f;
  try {
    if (l && hs && n !== "get" && n !== "head" && (f = await fs(p, s)) !== 0) {
      let C = new Request(e, {
        method: "POST",
        body: s,
        duplex: "half"
      }), z;
      if (u.isFormData(s) && (z = C.headers.get("content-type")) && p.setContentType(z), C.body) {
        const [N, ae] = ht(
          f,
          me(dt(l))
        );
        s = gt(C.body, mt, N, ae);
      }
    }
    u.isString(h) || (h = h ? "include" : "omit");
    const w = "credentials" in Request.prototype;
    d = new Request(e, {
      ...g,
      signal: b,
      method: n.toUpperCase(),
      headers: p.normalize().toJSON(),
      body: s,
      duplex: "half",
      credentials: w ? h : void 0
    });
    let m = await fetch(d, g);
    const E = ze && (c === "stream" || c === "response");
    if (ze && (a || E && k)) {
      const C = {};
      ["status", "statusText", "headers"].forEach((Ye) => {
        C[Ye] = m[Ye];
      });
      const z = u.toFiniteNumber(m.headers.get("content-length")), [N, ae] = a && ht(
        z,
        me(dt(a), !0)
      ) || [];
      m = new Response(
        gt(m.body, mt, N, () => {
          ae && ae(), k && k();
        }),
        C
      );
    }
    c = c || "text";
    let P = await be[u.findKey(be, c) || "text"](m, t);
    return !E && k && k(), await new Promise((C, z) => {
      Wt(C, z, {
        data: P,
        headers: B.from(m.headers),
        status: m.status,
        statusText: m.statusText,
        config: t,
        request: d
      });
    });
  } catch (w) {
    throw k && k(), w && w.name === "TypeError" && /Load failed|fetch/i.test(w.message) ? Object.assign(
      new y("Network Error", y.ERR_NETWORK, t, d),
      {
        cause: w.cause || w
      }
    ) : y.from(w, w && w.code, t, d);
  }
}), Ue = {
  http: Cr,
  xhr: is,
  fetch: gs
};
u.forEach(Ue, (t, e) => {
  if (t) {
    try {
      Object.defineProperty(t, "name", { value: e });
    } catch {
    }
    Object.defineProperty(t, "adapterName", { value: e });
  }
});
const bt = (t) => `- ${t}`, ms = (t) => u.isFunction(t) || t === null || t === !1, Yt = {
  getAdapter: (t) => {
    t = u.isArray(t) ? t : [t];
    const { length: e } = t;
    let n, s;
    const r = {};
    for (let i = 0; i < e; i++) {
      n = t[i];
      let o;
      if (s = n, !ms(n) && (s = Ue[(o = String(n)).toLowerCase()], s === void 0))
        throw new y(`Unknown adapter '${o}'`);
      if (s)
        break;
      r[o || "#" + i] = s;
    }
    if (!s) {
      const i = Object.entries(r).map(
        ([a, l]) => `adapter ${a} ` + (l === !1 ? "is not supported by the environment" : "is not available in the build")
      );
      let o = e ? i.length > 1 ? `since :
` + i.map(bt).join(`
`) : " " + bt(i[0]) : "as no adapter specified";
      throw new y(
        "There is no suitable adapter to dispatch the request " + o,
        "ERR_NOT_SUPPORT"
      );
    }
    return s;
  },
  adapters: Ue
};
function ve(t) {
  if (t.cancelToken && t.cancelToken.throwIfRequested(), t.signal && t.signal.aborted)
    throw new K(null, t);
}
function kt(t) {
  return ve(t), t.headers = B.from(t.headers), t.data = Ae.call(
    t,
    t.transformRequest
  ), ["post", "put", "patch"].indexOf(t.method) !== -1 && t.headers.setContentType("application/x-www-form-urlencoded", !1), Yt.getAdapter(t.adapter || ie.adapter)(t).then(function(s) {
    return ve(t), s.data = Ae.call(
      t,
      t.transformResponse,
      s
    ), s.headers = B.from(s.headers), s;
  }, function(s) {
    return Zt(s) || (ve(t), s && s.response && (s.response.data = Ae.call(
      t,
      t.transformResponse,
      s.response
    ), s.response.headers = B.from(s.response.headers))), Promise.reject(s);
  });
}
const en = "1.11.0", Te = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((t, e) => {
  Te[t] = function(s) {
    return typeof s === t || "a" + (e < 1 ? "n " : " ") + t;
  };
});
const xt = {};
Te.transitional = function(e, n, s) {
  function r(i, o) {
    return "[Axios v" + en + "] Transitional option '" + i + "'" + o + (s ? ". " + s : "");
  }
  return (i, o, a) => {
    if (e === !1)
      throw new y(
        r(o, " has been removed" + (n ? " in " + n : "")),
        y.ERR_DEPRECATED
      );
    return n && !xt[o] && (xt[o] = !0, console.warn(
      r(
        o,
        " has been deprecated since v" + n + " and will be removed in the near future"
      )
    )), e ? e(i, o, a) : !0;
  };
};
Te.spelling = function(e) {
  return (n, s) => (console.warn(`${s} is likely a misspelling of ${e}`), !0);
};
function bs(t, e, n) {
  if (typeof t != "object")
    throw new y("options must be an object", y.ERR_BAD_OPTION_VALUE);
  const s = Object.keys(t);
  let r = s.length;
  for (; r-- > 0; ) {
    const i = s[r], o = e[i];
    if (o) {
      const a = t[i], l = a === void 0 || o(a, i, t);
      if (l !== !0)
        throw new y("option " + i + " must be " + l, y.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (n !== !0)
      throw new y("Unknown option " + i, y.ERR_BAD_OPTION);
  }
}
const he = {
  assertOptions: bs,
  validators: Te
}, D = he.validators;
let H = class {
  constructor(e) {
    this.defaults = e || {}, this.interceptors = {
      request: new ut(),
      response: new ut()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(e, n) {
    try {
      return await this._request(e, n);
    } catch (s) {
      if (s instanceof Error) {
        let r = {};
        Error.captureStackTrace ? Error.captureStackTrace(r) : r = new Error();
        const i = r.stack ? r.stack.replace(/^.+\n/, "") : "";
        try {
          s.stack ? i && !String(s.stack).endsWith(i.replace(/^.+\n.+\n/, "")) && (s.stack += `
` + i) : s.stack = i;
        } catch {
        }
      }
      throw s;
    }
  }
  _request(e, n) {
    typeof e == "string" ? (n = n || {}, n.url = e) : n = e || {}, n = J(this.defaults, n);
    const { transitional: s, paramsSerializer: r, headers: i } = n;
    s !== void 0 && he.assertOptions(s, {
      silentJSONParsing: D.transitional(D.boolean),
      forcedJSONParsing: D.transitional(D.boolean),
      clarifyTimeoutError: D.transitional(D.boolean)
    }, !1), r != null && (u.isFunction(r) ? n.paramsSerializer = {
      serialize: r
    } : he.assertOptions(r, {
      encode: D.function,
      serialize: D.function
    }, !0)), n.allowAbsoluteUrls !== void 0 || (this.defaults.allowAbsoluteUrls !== void 0 ? n.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls : n.allowAbsoluteUrls = !0), he.assertOptions(n, {
      baseUrl: D.spelling("baseURL"),
      withXsrfToken: D.spelling("withXSRFToken")
    }, !0), n.method = (n.method || this.defaults.method || "get").toLowerCase();
    let o = i && u.merge(
      i.common,
      i[n.method]
    );
    i && u.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      (d) => {
        delete i[d];
      }
    ), n.headers = B.concat(o, i);
    const a = [];
    let l = !0;
    this.interceptors.request.forEach(function(k) {
      typeof k.runWhen == "function" && k.runWhen(n) === !1 || (l = l && k.synchronous, a.unshift(k.fulfilled, k.rejected));
    });
    const c = [];
    this.interceptors.response.forEach(function(k) {
      c.push(k.fulfilled, k.rejected);
    });
    let p, h = 0, g;
    if (!l) {
      const d = [kt.bind(this), void 0];
      for (d.unshift(...a), d.push(...c), g = d.length, p = Promise.resolve(n); h < g; )
        p = p.then(d[h++], d[h++]);
      return p;
    }
    g = a.length;
    let b = n;
    for (h = 0; h < g; ) {
      const d = a[h++], k = a[h++];
      try {
        b = d(b);
      } catch (f) {
        k.call(this, f);
        break;
      }
    }
    try {
      p = kt.call(this, b);
    } catch (d) {
      return Promise.reject(d);
    }
    for (h = 0, g = c.length; h < g; )
      p = p.then(c[h++], c[h++]);
    return p;
  }
  getUri(e) {
    e = J(this.defaults, e);
    const n = Kt(e.baseURL, e.url, e.allowAbsoluteUrls);
    return Ht(n, e.params, e.paramsSerializer);
  }
};
u.forEach(["delete", "get", "head", "options"], function(e) {
  H.prototype[e] = function(n, s) {
    return this.request(J(s || {}, {
      method: e,
      url: n,
      data: (s || {}).data
    }));
  };
});
u.forEach(["post", "put", "patch"], function(e) {
  function n(s) {
    return function(i, o, a) {
      return this.request(J(a || {}, {
        method: e,
        headers: s ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url: i,
        data: o
      }));
    };
  }
  H.prototype[e] = n(), H.prototype[e + "Form"] = n(!0);
});
let ks = class tn {
  constructor(e) {
    if (typeof e != "function")
      throw new TypeError("executor must be a function.");
    let n;
    this.promise = new Promise(function(i) {
      n = i;
    });
    const s = this;
    this.promise.then((r) => {
      if (!s._listeners) return;
      let i = s._listeners.length;
      for (; i-- > 0; )
        s._listeners[i](r);
      s._listeners = null;
    }), this.promise.then = (r) => {
      let i;
      const o = new Promise((a) => {
        s.subscribe(a), i = a;
      }).then(r);
      return o.cancel = function() {
        s.unsubscribe(i);
      }, o;
    }, e(function(i, o, a) {
      s.reason || (s.reason = new K(i, o, a), n(s.reason));
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason)
      throw this.reason;
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(e) {
    if (this.reason) {
      e(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(e) : this._listeners = [e];
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(e) {
    if (!this._listeners)
      return;
    const n = this._listeners.indexOf(e);
    n !== -1 && this._listeners.splice(n, 1);
  }
  toAbortSignal() {
    const e = new AbortController(), n = (s) => {
      e.abort(s);
    };
    return this.subscribe(n), e.signal.unsubscribe = () => this.unsubscribe(n), e.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let e;
    return {
      token: new tn(function(r) {
        e = r;
      }),
      cancel: e
    };
  }
};
function xs(t) {
  return function(n) {
    return t.apply(null, n);
  };
}
function ws(t) {
  return u.isObject(t) && t.isAxiosError === !0;
}
const Ie = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511
};
Object.entries(Ie).forEach(([t, e]) => {
  Ie[e] = t;
});
function nn(t) {
  const e = new H(t), n = $t(H.prototype.request, e);
  return u.extend(n, H.prototype, e, { allOwnKeys: !0 }), u.extend(n, e, null, { allOwnKeys: !0 }), n.create = function(r) {
    return nn(J(t, r));
  }, n;
}
const T = nn(ie);
T.Axios = H;
T.CanceledError = K;
T.CancelToken = ks;
T.isCancel = Zt;
T.VERSION = en;
T.toFormData = Re;
T.AxiosError = y;
T.Cancel = T.CanceledError;
T.all = function(e) {
  return Promise.all(e);
};
T.spread = xs;
T.isAxiosError = ws;
T.mergeConfig = J;
T.AxiosHeaders = B;
T.formToJSON = (t) => Jt(u.isHTMLForm(t) ? new FormData(t) : t);
T.getAdapter = Yt.getAdapter;
T.HttpStatusCode = Ie;
T.default = T;
const {
  Axios: mo,
  AxiosError: bo,
  CanceledError: ko,
  isCancel: xo,
  CancelToken: wo,
  VERSION: yo,
  all: So,
  Cancel: Ro,
  isAxiosError: Eo,
  spread: To,
  toFormData: _o,
  AxiosHeaders: Ao,
  HttpStatusCode: vo,
  formToJSON: Po,
  getAdapter: Co,
  mergeConfig: Oo
} = T, ys = { class: "viewer-container" }, Ss = {
  key: 0,
  class: "flex justify-center items-center py-12"
}, Rs = {
  key: 1,
  class: "bg-red-50 border border-red-200 rounded-md p-4"
}, Es = { class: "flex" }, Ts = { class: "ml-3" }, _s = { class: "text-sm text-red-800" }, As = {
  key: 2,
  class: "post-viewer"
}, vs = { class: "mb-8" }, Ps = { class: "text-4xl font-bold text-gray-900 mb-4" }, Cs = { class: "flex items-center text-sm text-gray-500 space-x-4" }, Os = { key: 0 }, $s = ["innerHTML"], Ls = {
  key: 0,
  class: "mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg"
}, Bs = {
  key: 3,
  class: "text-center py-12"
}, Ns = /* @__PURE__ */ De({
  __name: "PostViewer",
  props: {
    postId: {},
    postSlug: {},
    apiUrl: { default: "http://localhost:8080/api" },
    showLoginPrompt: { type: Boolean, default: !0 },
    maxContentLength: { default: 800 },
    isAuthenticated: { type: Boolean, default: !1 }
  },
  emits: ["login-requested", "post-loaded", "error"],
  setup(t, { emit: e }) {
    const n = t, s = e, r = A(null), i = A(!1), o = A(null), a = Pe(() => {
      if (!r.value) return "";
      let g = r.value.content;
      return !n.isAuthenticated && g.length > n.maxContentLength && (g = g.substring(0, n.maxContentLength) + "..."), S.parse(g);
    }), l = Pe(() => n.showLoginPrompt && !n.isAuthenticated && r.value && r.value.content.length > n.maxContentLength), c = (g) => new Date(g).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }), p = async () => {
      i.value = !0, o.value = null;
      try {
        let g = `${n.apiUrl}/posts`;
        if (n.postId)
          g += `/${n.postId}`;
        else if (n.postSlug)
          g += `/slug/${n.postSlug}`;
        else
          throw new Error("Either postId or postSlug must be provided");
        const b = await T.get(g);
        if (b.data && b.data.data)
          r.value = b.data.data, s("post-loaded", r.value);
        else
          throw new Error("Post not found");
      } catch (g) {
        o.value = g.response?.data?.message || g.message || "Failed to load post", s("error", o.value);
      } finally {
        i.value = !1;
      }
    }, h = () => {
      s("login-requested");
    };
    return qe(() => {
      (n.postId || n.postSlug) && p();
    }), wt(() => [n.postId, n.postSlug], () => {
      (n.postId || n.postSlug) && p();
    }), (g, b) => (_(), v("div", ys, [
      i.value ? (_(), v("div", Ss, b[0] || (b[0] = [
        x("div", { class: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }, null, -1),
        x("span", { class: "ml-3 text-gray-600" }, "Loading post...", -1)
      ]))) : o.value ? (_(), v("div", Rs, [
        x("div", Es, [
          b[1] || (b[1] = x("div", { class: "flex-shrink-0" }, [
            x("svg", {
              class: "h-5 w-5 text-red-400",
              viewBox: "0 0 20 20",
              fill: "currentColor"
            }, [
              x("path", {
                "fill-rule": "evenodd",
                d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
                "clip-rule": "evenodd"
              })
            ])
          ], -1)),
          x("div", Ts, [
            x("p", _s, U(o.value), 1)
          ])
        ])
      ])) : r.value ? (_(), v("div", As, [
        x("div", vs, [
          x("h1", Ps, U(r.value.title), 1),
          x("div", Cs, [
            x("span", null, "Published " + U(c(r.value.created_at)), 1),
            r.value.updated_at && r.value.updated_at !== r.value.created_at ? (_(), v("span", Os, " • Updated " + U(c(r.value.updated_at)), 1)) : Y("", !0)
          ])
        ]),
        x("div", {
          class: "post-content",
          innerHTML: a.value
        }, null, 8, $s),
        !g.isAuthenticated && l.value ? (_(), v("div", Ls, [
          x("div", { class: "flex items-start" }, [
            b[4] || (b[4] = x("div", { class: "flex-shrink-0" }, [
              x("svg", {
                class: "h-6 w-6 text-blue-400",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24"
              }, [
                x("path", {
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  "stroke-width": "2",
                  d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                })
              ])
            ], -1)),
            x("div", { class: "ml-3" }, [
              b[2] || (b[2] = x("h3", { class: "text-lg font-medium text-blue-800" }, "Want to read more?", -1)),
              b[3] || (b[3] = x("p", { class: "mt-1 text-blue-700" }, " Log in or register to view the full content of this post and access all our articles. ", -1)),
              x("div", { class: "mt-4" }, [
                x("button", {
                  onClick: h,
                  class: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                }, " Log In ")
              ])
            ])
          ])
        ])) : Y("", !0)
      ])) : (_(), v("div", Bs, b[5] || (b[5] = [
        x("svg", {
          class: "mx-auto h-12 w-12 text-gray-400",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, [
          x("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          })
        ], -1),
        x("h3", { class: "mt-2 text-sm font-medium text-gray-900" }, "Post not found", -1),
        x("p", { class: "mt-1 text-sm text-gray-500" }, "The post you're looking for doesn't exist or has been removed.", -1)
      ])))
    ]));
  }
}), rn = (t, e) => {
  const n = t.__vccOpts || t;
  for (const [s, r] of e)
    n[s] = r;
  return n;
}, zs = /* @__PURE__ */ rn(Ns, [["__scopeId", "data-v-3228c925"]]), Us = { class: "viewer-container" }, Is = {
  key: 0,
  class: "flex justify-center items-center py-12"
}, Ds = {
  key: 1,
  class: "bg-red-50 border border-red-200 rounded-md p-4"
}, qs = { class: "flex" }, Fs = { class: "ml-3" }, js = { class: "text-sm text-red-800" }, Ms = {
  key: 2,
  class: "posts-list"
}, Hs = { class: "grid gap-8" }, Vs = { class: "mb-4" }, Js = { class: "text-2xl font-bold text-gray-900 mb-2" }, Zs = ["href", "onClick"], Ws = { class: "flex items-center text-sm text-gray-500 space-x-4" }, Ks = { key: 0 }, Gs = { class: "post-preview mb-4" }, Qs = ["innerHTML"], Xs = { class: "flex justify-between items-center" }, Ys = ["href", "onClick"], eo = {
  key: 0,
  class: "text-sm text-gray-500"
}, to = {
  key: 0,
  class: "mt-8 flex justify-center"
}, no = { class: "flex items-center space-x-2" }, ro = ["disabled"], so = { class: "px-3 py-2 text-sm text-gray-700" }, oo = ["disabled"], io = {
  key: 3,
  class: "text-center py-12"
}, ao = /* @__PURE__ */ De({
  __name: "PostsList",
  props: {
    apiUrl: { default: "http://localhost:8080/api" },
    showPublishedOnly: { type: Boolean, default: !0 },
    page: { default: 1 },
    limit: { default: 10 },
    isAuthenticated: { type: Boolean, default: !1 },
    maxContentLength: { default: 300 }
  },
  emits: ["post-clicked", "posts-loaded", "error"],
  setup(t, { emit: e }) {
    const n = t, s = e, r = A([]), i = A(!1), o = A(null), a = A(n.page), l = A(1), c = A(0), p = Pe(() => n.showPublishedOnly || !n.isAuthenticated), h = (f) => new Date(f).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }), g = (f) => {
      let w = f;
      return !n.isAuthenticated && w.length > n.maxContentLength && (w = w.substring(0, n.maxContentLength) + "..."), S.parse(w);
    }, b = async () => {
      i.value = !0, o.value = null;
      try {
        const f = new URLSearchParams({
          page: a.value.toString(),
          limit: n.limit.toString()
        });
        p.value && f.append("published", "true");
        const w = await T.get(`${n.apiUrl}/posts?${f}`);
        w.data && w.data.data ? (r.value = w.data.data, c.value = w.data.total || r.value.length, l.value = Math.ceil(c.value / n.limit), s("posts-loaded", r.value)) : r.value = [];
      } catch (f) {
        o.value = f.response?.data?.message || f.message || "Failed to load posts", s("error", o.value);
      } finally {
        i.value = !1;
      }
    }, d = (f) => {
      f >= 1 && f <= l.value && (a.value = f, b());
    }, k = (f) => {
      s("post-clicked", f);
    };
    return qe(() => {
      b();
    }), wt(() => [n.showPublishedOnly, n.page], () => {
      a.value = n.page, b();
    }), (f, w) => (_(), v("div", Us, [
      i.value ? (_(), v("div", Is, w[2] || (w[2] = [
        x("div", { class: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }, null, -1),
        x("span", { class: "ml-3 text-gray-600" }, "Loading posts...", -1)
      ]))) : o.value ? (_(), v("div", Ds, [
        x("div", qs, [
          w[3] || (w[3] = x("div", { class: "flex-shrink-0" }, [
            x("svg", {
              class: "h-5 w-5 text-red-400",
              viewBox: "0 0 20 20",
              fill: "currentColor"
            }, [
              x("path", {
                "fill-rule": "evenodd",
                d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
                "clip-rule": "evenodd"
              })
            ])
          ], -1)),
          x("div", Fs, [
            x("p", js, U(o.value), 1)
          ])
        ])
      ])) : r.value.length > 0 ? (_(), v("div", Ms, [
        w[4] || (w[4] = x("div", { class: "mb-8" }, [
          x("h1", { class: "text-3xl font-bold text-gray-900 mb-2" }, "Latest Posts"),
          x("p", { class: "text-gray-600" }, "Discover our latest articles and insights")
        ], -1)),
        x("div", Hs, [
          (_(!0), v(sn, null, on(r.value, (m) => (_(), v("article", {
            key: m.id,
            class: "post-card border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          }, [
            x("div", Vs, [
              x("h2", Js, [
                x("a", {
                  href: `/post/${m.slug}`,
                  class: "hover:text-blue-600 transition-colors",
                  onClick: et((E) => k(m), ["prevent"])
                }, U(m.title), 9, Zs)
              ]),
              x("div", Ws, [
                x("span", null, "Published " + U(h(m.created_at)), 1),
                m.updated_at && m.updated_at !== m.created_at ? (_(), v("span", Ks, " • Updated " + U(h(m.updated_at)), 1)) : Y("", !0)
              ])
            ]),
            x("div", Gs, [
              x("div", {
                class: "text-gray-700 leading-relaxed",
                innerHTML: g(m.content)
              }, null, 8, Qs)
            ]),
            x("div", Xs, [
              x("a", {
                href: `/post/${m.slug}`,
                class: "text-blue-600 hover:text-blue-800 font-medium",
                onClick: et((E) => k(m), ["prevent"])
              }, U(f.isAuthenticated ? "Read full article" : "Read more"), 9, Ys),
              !f.isAuthenticated && m.content.length > f.maxContentLength ? (_(), v("div", eo, U(Math.ceil(m.content.length / 100)) + " min read ", 1)) : Y("", !0)
            ])
          ]))), 128))
        ]),
        l.value > 1 ? (_(), v("div", to, [
          x("nav", no, [
            x("button", {
              onClick: w[0] || (w[0] = (m) => d(a.value - 1)),
              disabled: a.value <= 1,
              class: "px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            }, " Previous ", 8, ro),
            x("span", so, " Page " + U(a.value) + " of " + U(l.value), 1),
            x("button", {
              onClick: w[1] || (w[1] = (m) => d(a.value + 1)),
              disabled: a.value >= l.value,
              class: "px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            }, " Next ", 8, oo)
          ])
        ])) : Y("", !0)
      ])) : (_(), v("div", io, w[5] || (w[5] = [
        x("svg", {
          class: "mx-auto h-12 w-12 text-gray-400",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, [
          x("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          })
        ], -1),
        x("h3", { class: "mt-2 text-sm font-medium text-gray-900" }, "No posts found", -1),
        x("p", { class: "mt-1 text-sm text-gray-500" }, "There are no posts available at the moment.", -1)
      ])))
    ]));
  }
}), lo = /* @__PURE__ */ rn(ao, [["__scopeId", "data-v-f3cd04a7"]]), co = { id: "app" }, uo = {
  key: 2,
  class: "viewer-container"
}, po = /* @__PURE__ */ De({
  __name: "App",
  setup(t) {
    const e = A(null), n = A(), s = A(), r = A("http://localhost:8080/api"), i = A(!0), o = A(800), a = A(!1), l = A(!0), c = A(1), p = A(10), h = () => {
      console.log("Login requested"), window.parent?.postMessage({ type: "login-requested" }, "*");
    }, g = (m) => {
      console.log("Post loaded:", m), window.parent?.postMessage({ type: "post-loaded", post: m }, "*");
    }, b = (m) => {
      console.log("Posts loaded:", m), window.parent?.postMessage({ type: "posts-loaded", posts: m }, "*");
    }, d = (m) => {
      console.log("Post clicked:", m), window.parent?.postMessage({ type: "post-clicked", post: m }, "*");
    }, k = (m) => {
      console.error("Error:", m), window.parent?.postMessage({ type: "error", error: m }, "*");
    }, f = () => {
      const m = new URLSearchParams(window.location.search);
      e.value = m.get("mode") || null, n.value = m.get("postId") || void 0, s.value = m.get("postSlug") || void 0, r.value = m.get("apiUrl") || "http://localhost:8080/api", i.value = m.get("showLoginPrompt") !== "false", o.value = parseInt(m.get("maxContentLength") || "800"), a.value = m.get("isAuthenticated") === "true", l.value = m.get("showPublishedOnly") !== "false", c.value = parseInt(m.get("page") || "1"), p.value = parseInt(m.get("limit") || "10");
    }, w = (m) => {
      if (m.data && typeof m.data == "object") {
        const { type: E, ...P } = m.data;
        switch (E) {
          case "set-config":
            Object.assign({
              apiUrl: r,
              showLoginPrompt: i,
              maxContentLength: o,
              isAuthenticated: a,
              showPublishedOnly: l,
              page: c,
              limit: p
            }, P);
            break;
          case "set-post-id":
            n.value = P.postId, e.value = "single";
            break;
          case "set-post-slug":
            s.value = P.postSlug, e.value = "single";
            break;
          case "set-view-mode":
            e.value = P.mode;
            break;
        }
      }
    };
    return qe(() => {
      f(), window.addEventListener("message", w);
    }), (m, E) => (_(), v("div", co, [
      e.value === "single" ? (_(), tt(zs, {
        key: 0,
        "post-id": n.value,
        "post-slug": s.value,
        "api-url": r.value,
        "show-login-prompt": i.value,
        "max-content-length": o.value,
        "is-authenticated": a.value,
        onLoginRequested: h,
        onPostLoaded: g,
        onError: k
      }, null, 8, ["post-id", "post-slug", "api-url", "show-login-prompt", "max-content-length", "is-authenticated"])) : e.value === "list" ? (_(), tt(lo, {
        key: 1,
        "api-url": r.value,
        "show-published-only": l.value,
        page: c.value,
        limit: p.value,
        "is-authenticated": a.value,
        "max-content-length": o.value,
        onPostClicked: d,
        onPostsLoaded: b,
        onError: k
      }, null, 8, ["api-url", "show-published-only", "page", "limit", "is-authenticated", "max-content-length"])) : (_(), v("div", uo, E[0] || (E[0] = [
        an('<div class="text-center py-12"><h1 class="text-2xl font-bold text-gray-900 mb-4">AGoat Publisher Viewer</h1><p class="text-gray-600 mb-6"> This is a microfrontend component for displaying blog posts. </p><div class="bg-gray-50 p-6 rounded-lg"><h2 class="text-lg font-semibold text-gray-800 mb-3">Usage Examples:</h2><div class="text-left space-y-2 text-sm text-gray-700"><p><strong>Single Post:</strong> ?mode=single&amp;postId=123</p><p><strong>Single Post by Slug:</strong> ?mode=single&amp;postSlug=my-post-title</p><p><strong>Posts List:</strong> ?mode=list&amp;page=1&amp;limit=10</p><p><strong>Custom API:</strong> &amp;apiUrl=https://api.example.com</p></div></div></div>', 1)
      ])))
    ]));
  }
});
ln(po).mount("#app");

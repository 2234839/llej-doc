import MarkdownIt from 'markdown-it'
MarkdownIt

var md = MarkdownIt({
  html: true, //允许md中的html
  xhtmlOut: true, // 使用 / 关闭单标签
  breaks: true, // md 中的 \n 解析为br
  langPrefix: 'lang-', // 代码块的语言表示
  linkify: true, // 自动将url转为a标签链接

  // Enable some language-neutral replacement + quotes beautification
  typographer: false,

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smart quotes on. Could be either a String or an Array.
  //
  // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
  // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
  quotes: '“”‘’',

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed and should be escaped externally.
  // If result starts with <pre... internal wrapper is skipped.
  //   highlight: function(/*str, lang*/) {
  //     return ''
  //   },
})

/** 图片渲染 */
const a_default_render = md.renderer.rules.a
md.renderer.rules.a = function(tokens, idx, options, env, self) {
  console.log(tokens)
  return a_default_render(tokens, idx, options, env, self)
}

/** 解析文章md */
export function md_parser_article(md_str: string) {
  const title = md_str.match(/(?<=^# ).*/)
  if (title === null) throw '没有找到匹配的标题'

  const header = md_str.match(/(?<=^# .*?\n).*?(?=^---)/ms)
  if (header === null) throw '没有找到匹配的头部信息'

  const meta: { [name: string]: string[] } = {}
  header[0]
    .split('\n')
    .filter((str) => str.startsWith('- '))
    .forEach((str) => {
      const key = str.match(/(?<=- ).*?(?=:)/)
      if (key === null) throw '没有找到匹配的属性'
      const value = str.match(/(?<=:).*/)
      if (value === null) throw '没有找到匹配的值'
      meta[key[0]] = value[0].split(',')
    })

  return {
    title: title[0],
    meta,
    html: md.render(md_str),
  }
}

export function md_render(md_str: string) {
  return md.render(md_str)
}

import MarkdownIt from "markdown-it";
import { time33 } from "./hash";
MarkdownIt;
import { promises as fs } from "fs";
import { resolve } from "path";
import { config } from "../src/config";

var md = MarkdownIt({
  html: true, //允许md中的html
  xhtmlOut: true, // 使用 / 关闭单标签
  breaks: true, // md 中的 \n 解析为br
  langPrefix: "lang-", // 代码块的语言表示
  linkify: true, // 自动将url转为a标签链接

  // Enable some language-neutral replacement + quotes beautification
  typographer: false,

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smart quotes on. Could be either a String or an Array.
  //
  // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
  // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
  quotes: "“”‘’",

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed and should be escaped externally.
  // If result starts with <pre... internal wrapper is skipped.
  //   highlight: function(/*str, lang*/) {
  //     return ''
  //   },
});

md.use(require("markdown-it-anchor")); //为标题添加id
md.use(require("markdown-it-table-of-contents")); //[[toc]] 生成目录
md.use(require("markdown-it-attrs"), {
  // {.class} 允许通过这种形式添加样式
  leftDelimiter: "{",
  rightDelimiter: "}",
  allowedAttributes: [], // empty array = all attributes are allowed
});
/** 图片渲染 */
const a_default_render = md.renderer.rules.a;
md.renderer.rules.a = function (tokens, idx, options, env, self) {
  console.log(tokens);
  return a_default_render(tokens, idx, options, env, self);
};

/** 解析文章md */
export async function md_parser_article(file_path: string): Promise<article> {
  const md_str = await (await fs.readFile(file_path)).toString();
  const title = md_str.match(/(?<=^# ).*/);
  if (title === null) throw "没有找到匹配的标题";

  const header = md_str.match(/(?<=^# .*?\n).*?(?=^---)/ms);
  if (header === null) throw "没有找到匹配的头部信息";

  const meta: { [name: string]: string[] } = {};
  header[0]
    .split("\n")
    .filter((str) => str.startsWith("- "))
    .forEach((str) => {
      const key = str.match(/(?<=- ).*?(?=:)/);
      if (key === null) throw "没有找到匹配的属性";
      const value = str.match(/(?<=:).*/);
      if (value === null) throw "没有找到匹配的值";
      meta[key[0]] = value[0].split(",");
    });
  const raw_html = md.render(md_str);
  return {
    title: title[0],
    meta,
    html: raw_html,
    raw_html,
    md: md_str,
    content_hash: String(time33(md_str)),
    path: resolve(file_path).replace(resolve(config.input_dir), ""),
  };
}

export function md_render(md_str: string) {
  return md.render(md_str);
}

export type article = {
  title: string;
  meta: any;
  html?: string;
  raw_html?: string
  /** markdown 源码 */
  md: string;
  /** md 的hash */
  content_hash: string;
  /** md 文档的地址 */
  path: string;
};

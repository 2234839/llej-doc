import MarkdownIt from "markdown-it";
MarkdownIt

var md = MarkdownIt();
/** 解析md的字符串 */
export function md_parser(md_str:string) {
    return md.render(md_str)
}

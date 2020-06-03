import { promises as fs } from "fs";

const isWin = /^win/.test(process.platform);
/** doc 项目的地址 */
const dir = isWin ? "D:/code/doc" : "/root/doc";
export const config = {
  input_dir: isWin ? "D:/code/doc" : "/root/doc",
  out_dir: isWin ? "./test/out" : "/root/static/doc",
  /** 服务器的基本路径 */
  basePath: "./",
  article_template: dir + "/_themes/article.html",
  menu_template: dir + "/_themes/menu.html",
  footer_template: dir + "/_themes/footer.html",
  header_template: dir + "/_themes/header.html",
  isWin,
  /** 过滤一些目录 */
  filter_dir: [
    "node_modules",
    "node_modules",
    ".git",
    ".git",
    ".vscode",
    ".vscode",
    "_themes",
    "_themes",
    "sapper",
    "_template",
    "cypress",
    "page",
  ].flatMap((el) => {
    return ["D:\\code\\doc\\" + el.replace("/", "\\"), "/root/doc/" + el];
  }),
};
/** 加载模板资源，返回资源对象 */
export async function getTemplate() {
  const res = JSON.parse(JSON.stringify(config)) as any;
  /** 读取模板 */
  try {
    res.article_template = "`" + (await fs.readFile(config.article_template)).toString() + "`";
    res.menu_template = "`" + (await fs.readFile(config.menu_template)).toString() + "`";
    res.footer_template = "`" + (await fs.readFile(config.footer_template)).toString() + "`";
    res.footer_template = eval(res.footer_template);
    res.header_template = "`" + (await fs.readFile(config.header_template)).toString() + "`";
    res.header_template = eval(res.header_template);
  } catch (error) {
    console.error(error);
    throw new Error("读取模板失败");
  }
  return res;
}

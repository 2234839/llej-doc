const isWin = /^win/.test(process.platform);
export const config = {
  input_dir: isWin ? "D:/code/doc" : "/root/doc",
  out_dir: isWin ? "./test/out" : "/root/static/doc",
  /** 服务器的基本路径 */
  basePath: "./",
  article_template: isWin ? "D:/code/doc/article.html" : "/root/doc/article.html",
  menu_template: isWin ? "D:/code/doc/menu.html" : "/root/doc/menu.html",
  footer_template: isWin ? "D:/code/doc/footer.html" : "/root/doc/footer.html",
  header_template: isWin ? "D:/code/doc/header.html" : "/root/doc/header.html",
  isWin,
  /** 过滤一些目录 */
  filter_dir: [
    "D:\\code\\doc\\node_modules",
    "/root/doc/node_modules",
    "D:\\code\\doc\\.git",
    "/root/doc/.git",
    "D:\\code\\doc\\.vscode",
    "/root/doc/.vscode",
    "D:\\code\\doc\\_themes",
    "/root/doc/_themes",
  ],
};
/** 用于给模板内部引用资源 */
export const _res = JSON.parse(JSON.stringify(config));

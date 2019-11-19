const isWin = /^win/.test(process.platform);
export const config = {
  input_dir: isWin ? "D:/code/doc/content" : "/root/doc/content",
  out_dir: isWin ? "./test/out" : "/root/static/doc",
  /** 服务器的基本路径 */
  basePath: "./",
  article_template: "D:/code/doc/content/article.html",
  menu_template: "D:/code/doc/content/menu.html",
  isWin,
};

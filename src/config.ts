const isWin = /^win/.test(process.platform);
export const config = {
  input_dir: isWin ? "D:/code/doc/content" : "/root/doc/content",
  out_dir: isWin ? "./test/out" : "/root/static/doc",
  /** 服务器的基本路径 */
  basePath: "./",
  article_template: isWin ? "D:/code/doc/content/article.html" : "/root/doc/content/article.html",
  menu_template: isWin ? "D:/code/doc/content/menu.html" : "/root/doc/content/menu.html",
  footer_template: isWin ? "D:/code/doc/content/footer.html" : "/root/doc/content/footer.html",
  isWin,
  /** 配置这个没用，因为会被覆盖 */
  html: "",
};

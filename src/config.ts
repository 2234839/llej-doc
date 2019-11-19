
const isWin = /^win/.test(process.platform)
export const config = {
  input_dir: isWin ? './test/doc' : '/root/doc/content',
  out_dir: isWin ? './test/out' : '/root/static/doc',
  /** 服务器的基本路径 */
  basePath: './',
  template: "./template/article.html",
  isWin
}

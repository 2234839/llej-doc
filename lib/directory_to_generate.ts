import { promises as fs } from "fs";
import Path from "path";
import { md_render } from "./md-parser";
/**目录树 */
export type directory_tree = {
  /** 当前这级目录的名称 */
  directory: { [path: string]: directory_tree };
  files: {
    [path: string]: {} | md_file;
  };
};
/** 模板html */
type md_file = {
  title: string;
  meta: string[];
};

/** 根据文件生成目录 */
export async function directory_to_generate(directory_tree: directory_tree, path: string, res: any) {
  let paths: string[] = [];
  for (const key in directory_tree.files) {
    if (!key.endsWith(".md")) continue;
    const element = <md_file>directory_tree.files[key];
    paths.push(`[${element.title}](${key.replace(/.md$/, ".html")})`);
  }
  for (const key in directory_tree.directory) {
    const element = directory_tree.directory[key];
    directory_to_generate(element, Path.join(path, "/", key), res);
    paths.push(`[${key}/](${key}/index.html)`);
  }
  /** 没有文章的不生成目录 */
  if (paths.length !== 0) {
    paths = paths.map((str) => str);
    const menu = { html: md_render(paths.join("\n")) };
    /** 生成目录 */
    try {
      menu.html = eval(res.menu_template);
      await fs.writeFile(Path.join(path, "/", "index.html"), menu.html);
    } catch (error) {
      console.error(error);
    }
  }
}

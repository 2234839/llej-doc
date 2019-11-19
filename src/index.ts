import { promises as fs } from "fs";
import Path from "path";
import { directory_to_generate, directory_tree } from "../lib/directory_to_generate";
import { md_parser_article } from "../lib/md-parser";
import { config } from "./config";
/** 程序一进来的时候的时间 */
const res = config;

config.input_dir = Path.resolve(config.input_dir);
config.out_dir = Path.resolve(config.out_dir);
config.filter_dir = config.filter_dir.map((path) => Path.resolve(path));
console.time("总共耗时");
void (async function() {
  const three: directory_tree = {
    directory: {},
    files: {},
  };
  /** 读取模板 */
  try {
    config.article_template = "`" + (await fs.readFile(config.article_template)).toString() + "`";
    config.menu_template = "`" + (await fs.readFile(config.menu_template)).toString() + "`";
    config.footer_template = "`" + (await fs.readFile(config.footer_template)).toString() + "`";
    config.footer_template = eval(config.footer_template);
    config.header_template = "`" + (await fs.readFile(config.header_template)).toString() + "`";
    config.header_template = eval(config.header_template);
  } catch (error) {
    console.error(error);
    throw new Error("读取模板失败");
  }
  await parse(config.input_dir, three);
  directory_to_generate(three, config.out_dir);
  // console.log(three);
  process.once("exit", () => {
    console.timeEnd("总共耗时");
  });
})();

async function parse(path: string, three: directory_tree) {
  const result = await fs.readdir(path, { withFileTypes: true });
  /** 所有的文件 */
  const files = result.filter((dirent) => dirent.isFile());
  /** 目录 */
  const directory = result.filter((dirent) => dirent.isDirectory());

  /** 递归编译所有目录 */
  await Promise.all(
    directory
      .filter((dirent) => {
        const dir_path = Path.join(path, "/", dirent.name);
        // 返回不在过滤名单中的
        return !config.filter_dir.includes(dir_path);
      })
      .map(async (dirent) => {
        three.directory[dirent.name] = {
          directory: {},
          files: {},
        };
        return await parse(Path.join(path, dirent.name), three.directory[dirent.name]);
      }),
  );

  /** 复制文件到目标目录 */
  await Promise.all(
    files.map(async (dirent) => {
      three.files[dirent.name] = {};
      const file_path = Path.join(path, "/", dirent.name);
      const out_file_path = file_path.replace(config.input_dir, config.out_dir);
      try {
        await fs.copyFile(file_path, out_file_path);
      } catch (error) {
        await fs.mkdir(Path.dirname(out_file_path), { recursive: true });
        await fs.copyFile(file_path, out_file_path);
      }
    }),
  );
  /** md 的文件 */
  await Promise.all(
    files
      .filter((dirent) => dirent.name.endsWith(".md"))
      .map(async (dirent) => {
        const file_path = Path.join(path, "/", dirent.name);
        let file;
        try {
          file = md_parser_article(await (await fs.readFile(file_path)).toString());
        } catch (error) {
          return console.error(error, file_path);
        }
        const out_file_path = Path.resolve(__dirname, file_path.replace(/md$/, "html")).replace(
          config.input_dir,
          config.out_dir,
        );
        /** 重点是解析file */
        try {
          file.html = eval(config.article_template);
        } catch (error) {
          console.error("加载模板失败", error);
        }
        try {
          await fs.writeFile(out_file_path, file.html);
        } catch (error) {
          await fs.mkdir(Path.dirname(out_file_path), { recursive: true });
          await fs.writeFile(out_file_path, file.html);
        }
        delete file.html;
        three.files[dirent.name] = file;
      }),
  );
  return files;
}

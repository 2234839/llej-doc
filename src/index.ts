import { promises as fs } from "fs";
import Path from "path";
import { directory_to_generate, directory_tree } from "../lib/directory_to_generate";
import { md_parser_article, article } from "../lib/md-parser";
import { config } from "./config";
import fse from "fs-extra";
/** 程序一进来的时候的时间 */
/** 提供给文件用 */
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
    config.article_template = await gettemplate(config.article_template);
    config.menu_template = await gettemplate(config.menu_template);
    config.footer_template = await gettemplate(config.footer_template);
    config.footer_template = eval(config.footer_template);
    config.header_template = await gettemplate(config.header_template);
    config.header_template = eval(config.header_template);
  } catch (error) {
    console.error(error);
    throw new Error("读取模板失败");
  }
  try {
    await fse.copy(config.input_dir, config.out_dir, { dereference: true });
  } catch (error) {
    console.error("复制文件失败", error);
  }

  await parse(config.input_dir, three);

  if (process.argv[2] !== "watch") return;
  fse
    .watch(config.input_dir, {
      encoding: "utf-8",
      persistent: true,
      recursive: true,
    })
    .addListener("change", (event, file_path) => {
      console.log(file_path);
      const input_path = Path.join(config.input_dir, "/", "" + file_path);
      const out_path = Path.join(config.out_dir, "/", "" + file_path);
      fse.copy(input_path, out_path, { dereference: true });

      if (!input_path.endsWith(".md")) return;
      article_parse(String(input_path));
    });

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
  /** md 的文件 */
  await Promise.all(
    files
      .filter((dirent) => dirent.name.endsWith(".md"))
      .map(async (dirent) => {
        const file_path = Path.join(path, "/", dirent.name);
        try {
          const article = await article_parse(file_path);
          delete article.html;
          three.files[dirent.name] = article;
        } catch (error) {
          console.error(error, file_path);
        }
      }),
  );
  return files;
}

async function gettemplate(path: string) {
  const raw = (await fs.readFile(path)).toString();
  const str = JSON.stringify(raw);

  console.log(str[0], str[str.length - 1]);
  const template = `\`${str.slice(1, str.length - 2)}\``;
  console.log(template);

  return template;
}
/** 读取指定位置的文章并解析 */
async function article_parse(file_path: string) {
  let article;
  try {
    article = md_parser_article(await (await fs.readFile(file_path)).toString());
  } catch (error) {
    throw error;
  }
  /** 重点是解析file */
  try {
    article.html = eval(config.article_template);
  } catch (error) {
    console.error(error);
    error.message = "解析模板失败";
    throw error;
  }
  const out_file_path = Path.resolve(__dirname, file_path.replace(/md$/, "html")).replace(
    config.input_dir,
    config.out_dir,
  );
  try {
    await fs.writeFile(out_file_path, article.html);
  } catch (error) {
    await fs.mkdir(Path.dirname(out_file_path), { recursive: true });
    await fs.writeFile(out_file_path, article.html);
  }
  return article;
}

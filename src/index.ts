import { promises as fs } from "fs";
import Path from "path";
import { directory_to_generate, directory_tree } from "../lib/directory_to_generate";
import { md_parser_article, article } from "../lib/md-parser";
import { config, _res } from "./config";
const res=_res
import fse from "fs-extra";
/** 程序一进来的时候的时间 */
/** 提供给文件引用配置资源用用 */
config.input_dir = Path.resolve(config.input_dir);
config.out_dir = Path.resolve(config.out_dir);
config.filter_dir = config.filter_dir.map((path) => Path.resolve(path));
console.time("总共耗时");
async function getTemplate() {
  /** 读取模板 */
  try {
    _res.article_template = "`" + (await fs.readFile(config.article_template)).toString() + "`";
    _res.menu_template = "`" + (await fs.readFile(config.menu_template)).toString() + "`";
    _res.footer_template = "`" + (await fs.readFile(config.footer_template)).toString() + "`";
    _res.footer_template = eval(_res.footer_template);
    _res.header_template = "`" + (await fs.readFile(config.header_template)).toString() + "`";
    _res.header_template = eval(_res.header_template);
  } catch (error) {
    console.error(error);
    throw new Error("读取模板失败");
  }
  return "";
}
void (async function() {
  const three: directory_tree = {
    directory: {},
    files: {},
  };
  await getTemplate();
  try {
    await fse.copy(config.input_dir, config.out_dir, { dereference: true });
  } catch (error) {
    console.error("复制文件失败", error);
  }

  await parse(config.input_dir, three);
  console.log("全量编译一次");

  if (process.argv[2] !== "watch") return;
  fse
    .watch(config.input_dir, {
      encoding: "utf-8",
      persistent: true,
      recursive: true,
    })
    .addListener("change", async (event, file_path) => {
      console.log(file_path);
      const input_path = Path.join(config.input_dir, "/", "" + file_path);
      const out_path = Path.join(config.out_dir, "/", "" + file_path);
      fse.copy(input_path, out_path, { dereference: true });
      const gorp = input_path.split(/[\/\\]/);
      const file_name = gorp[gorp.length - 1];
      if (["footer.html", "article.html", "header.html", "menu.html"].includes(file_name)) {
        await getTemplate();
        directory_to_generate(three, config.out_dir);
      }
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
    article.html = eval(_res.article_template);
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

/**
 * 内置部署指引页（AC-18.2）：随 ZIP 导出的中文静态 HTML，
 * 介绍 GitHub Pages 与 Vercel 两种免费部署方式，双击即可离线阅读。
 */
export function buildDeployGuideHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>部署指引 · 个人作品集</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #0a0f1e; color: #e8edf7; line-height: 1.8; padding: 40px 16px; }
.wrap { max-width: 760px; margin: 0 auto; }
h1 { font-size: 26px; margin-bottom: 8px; color: #7dd3fc; }
.sub { opacity: 0.65; font-size: 14px; margin-bottom: 28px; }
h2 { font-size: 19px; margin: 28px 0 12px; padding-left: 10px; border-left: 4px solid #7dd3fc; }
.card { background: rgba(255,255,255,0.04); border: 1px solid rgba(125,211,252,0.25); border-radius: 14px; padding: 20px 24px; margin-bottom: 18px; }
ol { padding-left: 22px; }
li { margin: 8px 0; font-size: 14px; }
code { background: rgba(125,211,252,0.12); color: #7dd3fc; padding: 2px 7px; border-radius: 6px; font-size: 13px; }
.note { margin-top: 14px; padding: 12px 16px; border-radius: 10px; background: rgba(201,168,106,0.1); border: 1px solid rgba(201,168,106,0.35); font-size: 13px; }
.back { display: inline-block; margin-top: 20px; color: #7dd3fc; text-decoration: none; font-size: 14px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>作品集部署指引</h1>
  <p class="sub">本压缩包为纯静态站点，无需服务器与数据库，上传到任意静态托管平台即可公开访问。推荐以下两种免费方式。</p>

  <h2>方式一：GitHub Pages（免费、稳定）</h2>
  <div class="card">
    <ol>
      <li>注册并登录 <code>github.com</code>，点击右上角 <b>New repository</b> 新建仓库，例如命名为 <code>my-portfolio</code>，选择 Public。</li>
      <li>将本压缩包内的 <b>全部文件</b>（含 index.html、data.json、部署指引.html 等）上传到仓库根目录：可在仓库页面点 <b>Add file → Upload files</b> 拖拽上传后提交。</li>
      <li>进入仓库 <b>Settings → Pages</b>，在 <b>Build and deployment</b> 的 Source 选择 <code>Deploy from a branch</code>，Branch 选择 <code>main</code> 分支与 <code>/ (root)</code> 目录，保存。</li>
      <li>等待 1~2 分钟，页面顶部将出现访问地址，形如 <code>https://你的用户名.github.io/my-portfolio/</code>，打开即为你的作品集。</li>
      <li>之后每次更新内容，只需重新导出压缩包并覆盖仓库内文件，Pages 会自动更新。</li>
    </ol>
    <div class="note">提示：本站使用 hash 路由（地址中的 #/），部署在子路径下也能正常翻页，无需额外配置。</div>
  </div>

  <h2>方式二：Vercel（访问快、全球 CDN）</h2>
  <div class="card">
    <ol>
      <li>访问 <code>vercel.com</code>，使用 GitHub 账号登录。</li>
      <li>方式 A（推荐）：先按上面的方式一将文件推送到 GitHub 仓库，在 Vercel 点击 <b>Add New → Project</b>，导入该仓库，框架预设保持 Other，直接点击 <b>Deploy</b>，约 30 秒即可获得 <code>https://xxx.vercel.app</code> 访问地址。</li>
      <li>方式 B（无需 GitHub）：安装 Vercel CLI 后执行 <code>npx vercel</code>，按提示登录并在解压后的站点目录中执行 <code>npx vercel --prod</code> 即可上线。</li>
      <li>重新部署：覆盖仓库文件后在 Vercel 项目页点 <b>Redeploy</b>，或重新执行一次发布命令。</li>
    </ol>
    <div class="note">其他平台（Netlify、Cloudflare Pages、阿里云 OSS、腾讯云 COS 等）均可部署：上传全部文件并开启静态网站托管即可。</div>
  </div>

  <h2>本地离线浏览</h2>
  <div class="card">
    <ol>
      <li>解压压缩包后，直接双击 <code>index.html</code> 即可在浏览器中离线浏览四页内容与中英双语切换，无需联网、无需安装任何软件。</li>
      <li><code>data.json</code> 是站点数据备份，可在编辑器中通过“导入 JSON”恢复工程。</li>
    </ol>
  </div>

  <a class="back" href="index.html">← 返回作品集首页</a>
</div>
</body>
</html>
`
}

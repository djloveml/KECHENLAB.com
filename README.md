# KECHENLAB 实验室培养箱产品门户

这是 KECHENLAB 实验室培养箱产品门户，用于展示产品线、资料下载、合作客户与客户询盘。

## 文件

- `index.html`：页面结构与中文内容
- `en.html`：英文版页面
- `styles.css`：响应式视觉样式
- `script.js`：移动端导航、滚动状态与询盘表单校验
- `api/inquiry.php`：询盘提交接口
- `assets/kechenlab-incubator-hero.png`：首屏产品图
- `assets/clients/`：合作客户墙图片
- `downloads/`：客户可下载的产品 PDF 目录
- `data/inquiries.jsonl`：服务器自动生成的询盘记录文件，不提交到 Git

## 预览

直接用浏览器打开 `index.html` 可以预览页面，但询盘保存需要 PHP 环境。

英文版入口是 `en.html`。

## 询盘保存

表单提交到 `api/inquiry.php`，后台会把客户信息追加写入 `data/inquiries.jsonl`。每行是一条 JSON 记录，包含姓名、手机号、邮箱、目标产品、需求说明、提交时间、来源页面、IP 和浏览器信息。

部署到宝塔或阿里云时，请选择带 PHP 的站点环境，并确认站点目录允许 PHP 写入 `data/` 目录。

## 微信通知

接口支持企业微信/微信群机器人 Webhook 通知。客户提交后会先保存到 `data/inquiries.jsonl`，如果服务器环境变量里配置了 `WECHAT_WEBHOOK_URL`，再把姓名、手机号、邮箱、目标产品、需求说明、提交时间和来源页面推送到微信机器人。

部署时在服务器环境变量中设置：

```text
WECHAT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=你的机器人key
```

如果服务器不方便设置环境变量，也可以在服务器上新建 `data/wechat_webhook.txt`，只放一行真实 Webhook 地址：

```text
https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=你的机器人key
```

不要把真实 Webhook 地址写进代码仓库。未配置 `WECHAT_WEBHOOK_URL` 且没有 `data/wechat_webhook.txt` 时，询盘仍会正常保存，只是不发送微信通知。机器人资料页链接不能用于接口推送，必须使用 `/cgi-bin/webhook/send?key=...` 这种发送地址。

表单规则：

- 姓名和手机号必填
- 中文页手机号要求中国大陆 11 位手机号
- 英文页手机号支持国际电话格式
- 邮箱可选，但填写后必须是有效邮箱；常见邮箱域名拼写错误会自动修正
- 需求说明最多 200 字

## 产品 PDF

首页“产品资料下载”区域默认链接以下文件：

- `downloads/kechen-product-brochure.pdf`

把对应 PDF 放进 `downloads/` 目录即可。如果文件名不同，需要同步修改 `index.html` 和 `en.html` 里的下载链接。

# Tini Debug

## Install

Use npm

```bash
npm install @tiki.vn/tini-debug --save
```

Use yarn

```bash
yarn add @tiki.vn/tini-debug
```

## How to use

In file `app.js` or `app.ts`

```bash
...
import logger from '@tiki.vn/tini-debug';
...

logger.init(config);
```

config:

```bash
{
  "isOverwriteLog": "true", // Ghi đè my.debug.log(), my.debug.warn(), my.debug.error()
  "isOverwriteRequest": "true", // Ghi đè my.request()
  "isApplyConsoleLog": "true", // Cho phép console.log() khi overwrite lại my.debug
  "config": { 
    "whitelist": ["*"], // whitelist email ["*"]: tất cả email, ["@tiki.vn"]: email có domain @tiki.vn, ["abc@tiki.vn"]: kiểm tra email
    "isSendToSlack": "false", // Gửi thông báo qua Slack channel khi dùng log error
    "slackUrl": SLACK_URL, // Link bot gửi thông báo ở trong channel Slack
    "appName": "APP_NAME", // Tên app 
  },
}
```

Register the component into `.json` config file

```json
{
  "usingComponents": {
    "logger": "@tiki.vn/tini-debug/lib/components/global-logger/index"
  }
}
```

Then you can use it as normal component:

```xml
<logger env="prod" type="circle"/>
```

Props của component bao gồm:

| Thuộc tính  | Kiểu dữ liệu  | Giá trị mặc định | Mô tả  |
| ------------- | ------------- | ------------- | ------------- |
| env | 'prod', 'dev' | 'dev' | Nếu env = 'prod sẽ kiểm tra whitelist đã được config từ trước |
| type | 'default', 'circle', 'shake' | 'default' | Kiểu hiển thị component, mặc định không hiển thị |
| zIndex | number | 2 | |
| userEmail | string | | Email để kiểm tra whitelist, nếu không có sẽ kiểm tra bằng token |

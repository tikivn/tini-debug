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
/>
```

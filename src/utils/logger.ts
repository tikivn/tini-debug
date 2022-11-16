import { sendMessageLogToSlack } from './notify';

export const LEVEL_DEBUG = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

export type Log = {
  message: string;
  detail: string;
  type: string;
  time: Date;
};

export type LoggerConfig = {
  whitelist?: string[];
  isSendToSlack?: boolean;
  slackUrl?: string;
  appName: string;
};

export type Request = {
  general: {
    url: string;
    method: 'PUT' | 'GET' | 'POST' | 'DELETE' | 'PATCH';
    time: string;
  };
  headers: Record<string, string> | undefined;
  resHeaders: Record<string, any> | undefined;
  data: Record<string, any> | undefined;
  requestInfo: {
    title: string;
    subTitle: string;
  };
  response: any;
  isError: boolean;
  time: Date;
};

export const request: any = my.request;
class Logger {
  isSendToSlack: boolean = false;
  isApplyConsoleLog: boolean = false;
  slackUrl: string = '';
  appName: string = '';
  whitelist: string[] = ['*'];
  trackingLog: Log[] = [];
  trackingRequest: Request[] = [];

  #getDebug = () => {
    const _getConfig = this.#getConfig.bind(this);
    return {
      log(...args: Parameters<typeof console.log>) {
        addLog(args, LEVEL_DEBUG.INFO, _getConfig());
      },
      warn(...args: Parameters<typeof console.warn>) {
        addLog(args, LEVEL_DEBUG.WARN, _getConfig());
      },
      error(...args: Parameters<typeof console.error>) {
        addLog(args, LEVEL_DEBUG.ERROR, _getConfig());
      },
    };
  };

  debug = this.#getDebug();

  #getRequest = (options: my.IHttpRequestOptions<any>) => {
    const _trackingRequest = this.trackingRequest;
    let response: any,
      resHeaders: Record<string, string>,
      isError: boolean = false;
    let { success, fail, complete, url, headers, method, data } = options;
    request({
      ...options,
      includeHeader: true,
      dataType: 'text',
      success: (res: any) => {
        try {
          res.data = JSON.parse(res.data);
        } catch (error) {}
        success && success(res.data);
        response = res.data;
        resHeaders = res.headers.map ? res.headers.map : res.headers;
      },
      fail: (error: any) => {
        fail && fail(error);
        isError = true;
        let cUrlHeader = [];
        for (const key in headers) {
          cUrlHeader.push(`--header '${key}: ${headers[key]}'`);
        }
        const cUrl = `curl --location --request ${method} '${url}' \\\n${cUrlHeader.join(' \\\n')}${
          data ? ` \\\n--data-raw '${JSON.stringify(data)}'` : ''
        }
      `;
        let msgError = `Fail request API ${url}: ${error}\n`;
        msgError +=
          resHeaders && resHeaders['x-request-id']
            ? `x-request-id: ${resHeaders['x-request-id']}\n`
            : cUrl;
        this.debug.error(msgError);
        response = error;
      },
      complete(res: any) {
        complete && complete(res);
        const requestName = url.replace(/^(http:|https:\/\/)?(www\\.)?/i, '').split('/');
        _trackingRequest.push({
          general: {
            url,
            method: method || 'GET',
            time: new Date().toString(),
          },
          data,
          headers,
          resHeaders,
          requestInfo: {
            title: requestName.pop() as string,
            subTitle: requestName.join('/'),
          },
          response: JSON.stringify(response, null, 2),
          isError,
          time: new Date(),
        });
      },
    });
  };

  request = this.#getRequest;

  init({
    isOverwriteLog,
    isOverwriteRequest,
    isApplyConsoleLog,
    config,
  }: {
    isOverwriteLog?: boolean;
    isApplyConsoleLog?: boolean;
    isOverwriteRequest?: boolean;
    config?: LoggerConfig;
  }) {
    this.setConfig({
      ...config,
      isApplyConsoleLog: isApplyConsoleLog || false,
    });

    if (isOverwriteLog) {
      (my as any).debug = this.debug;
    }
    if (isOverwriteRequest) {
      (my as any).request = this.request;
    }
  }

  setConfig({
    whitelist,
    isSendToSlack,
    slackUrl,
    appName,
    isApplyConsoleLog,
  }: Partial<LoggerConfig & { isApplyConsoleLog: boolean }>) {
    if (whitelist) this.whitelist = whitelist;
    if (isSendToSlack) this.isSendToSlack = isSendToSlack;
    if (slackUrl) this.slackUrl = slackUrl;
    if (appName) this.appName = appName;
    if (isApplyConsoleLog) this.isApplyConsoleLog = isApplyConsoleLog;
  }

  #getConfig() {
    const { appName, isSendToSlack, slackUrl, trackingLog, isApplyConsoleLog } = this;
    return { appName, isSendToSlack, slackUrl, trackingLog, isApplyConsoleLog };
  }
}

export default new Logger();

const stringifyDebug = (items: any[]) => {
  const { detail, message } = items.reduce(
    ({ detail, message }: { detail: string[]; message: string[] }, item: any) => {
      message.push(JSON.stringify(item));
      detail.push(JSON.stringify(item, null, 2));
      return { detail, message };
    },
    { detail: [], message: [] },
  );
  return {
    message: message.join(', '),
    detail: detail.join('\n\n'),
  };
};

function addLog(
  msgs: any[],
  type: string,
  config: {
    trackingLog: Log[];
    isSendToSlack: boolean;
    appName: string;
    slackUrl: string;
    isApplyConsoleLog: boolean;
  },
) {
  const { detail, message } = stringifyDebug(msgs);
  const time = new Date();
  const { trackingLog, isSendToSlack, appName, slackUrl, isApplyConsoleLog } = config;
  trackingLog.push({ message, detail, type, time });
  if (isSendToSlack && type === LEVEL_DEBUG.ERROR) {
    sendMessageLogToSlack({ message: msgs, type }, appName, slackUrl);
  }
  if (isApplyConsoleLog) {
    console.log(...msgs);
  }
}

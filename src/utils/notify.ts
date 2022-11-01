import { request } from './logger';

const getSystemInfo = () => {
  return new Promise((resolve) => {
    my.getSystemInfo({
      success: (systemInfo) => {
        resolve(systemInfo);
      },
      fail: () => {},
    });
  });
};

const createSlackLogMessage = async (configs = null, appName: string, eId = '') => {
  if (!configs) return '';
  const d = new Date();
  const time = d.toLocaleTimeString();
  const date = d.toLocaleDateString();
  const system = await getSystemInfo();
  const { app, platform } = system as my.IGetSystemInfoSuccessResult;

  return [
    '```',
    `[${appName}] - ${eId}`,
    `Platform: ${app} - ${platform}`,
    `${date} ${time}`,
    '\nLog details: ',
    JSON.stringify(configs, null, 2),
    '```',
  ]
    .filter(Boolean)
    .join('\n');
};

export const sendMessageLogToSlack = async (msg: any, appName: string, slackUrl: string) => {
  try {
    if (!msg || !slackUrl) return;
    msg = await createSlackLogMessage(msg, appName);
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: msg,
        },
      },
    ];

    await request({
      url: slackUrl,
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      data: {
        blocks,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

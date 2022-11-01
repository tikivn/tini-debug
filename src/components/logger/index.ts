import logger, { Log, Request } from '../../utils/logger';
import { checkEmailInWhiteList } from '../../utils/verify';

const ENV = {
  PROD: 'prod',
  DEV: 'dev',
  LOCAL: 'local',
};

const TAB_DEBUG = {
  CONSOLE: 'console',
  NETWORK: 'network',
  SETTING: 'setting',
};

const FILTER_TYPE = [
  { key: 'all', title: 'All', logs: [] },
  { key: 'success', title: 'Success', logs: [] },
  { key: 'error', title: 'Error', logs: [] },
];

const tracking = {
  [TAB_DEBUG.CONSOLE]: logger.trackingLog,
  [TAB_DEBUG.NETWORK]: logger.trackingRequest,
};

type SettingOption = {
  field: string;
  title: string;
  icon: string;
  activeValue: 'on' | 'off';
  values: {
    on: {
      value: any;
      title: string;
    };
    off: {
      value: any;
      title: string;
    };
  };
  isFieldInConfig: boolean;
};

const TYPE_VIEW = {
  SHAKE: 'shake',
  CIRCLE: 'circle',
  DEFAULT: 'default',
};

type LoggerProps = {
  type: string;
  env: string;
  userEmail?: string;
};

const SETTING_OPTIONS: SettingOption[] = [
  {
    field: 'type',
    title: 'Chế độ xem',
    icon: 'geometry',
    activeValue: 'on',
    values: {
      on: {
        value: TYPE_VIEW.CIRCLE,
        title: 'Luôn hiển thị',
      },
      off: {
        value: TYPE_VIEW.SHAKE,
        title: 'Lắc để bật',
      },
    },
    isFieldInConfig: false,
  },
  {
    field: 'isSendToSlack',
    title: 'Thông báo qua Slack',
    icon: 'adjustment',
    activeValue: logger.isSendToSlack ? 'on' : 'off',
    values: {
      on: {
        value: true,
        title: 'Bật',
      },
      off: {
        value: false,
        title: 'Tắt',
      },
    },
    isFieldInConfig: true,
  },
];

type NetworkFilter = { key: string; title: string; logs: Request[] };

type LoggerData = {
  tab: string;
  isShowLog: boolean;
  isShowLogBottomSheet: boolean;
  isShowRequestBottomSheet: boolean;
  logList: Log[] | Request[];
  search: string;
  activeLog: Log | null;
  activeRequest: Request | null;
  networkFilter: NetworkFilter[];
  isShow: boolean;
  activeFilter: string;
  settingOptions: SettingOption[];
};

type LoggerMethods = {
  onClearLog: () => void;
  onChangeFilter: (event: any) => void;
  onInput?: (event: any) => void;
  onChangeTap: (event: any) => void;
  updateView: (type: string) => void;
  onOpenBottomSheet: () => void;
  onCloseBottomSheet: () => void;
  onChangeSetting: (event: any) => void;
  updateSetting: (options: Record<string, any>) => void;
  onOpenDetail: ({ log, request }: { log: Log; request: Request }) => void;
  onCloseLogDetail: (event: any) => void;
  onCopy: (event: any) => void;
  updateNetworkFilter: () => void;
};

Component<LoggerProps, LoggerData, LoggerMethods>({
  props: {
    type: TYPE_VIEW.DEFAULT,
    env: ENV.DEV,
  },
  data: {
    tab: TAB_DEBUG.CONSOLE,
    isShowLog: false,
    isShowLogBottomSheet: false,
    isShowRequestBottomSheet: false,
    search: '',
    logList: [],
    activeRequest: null,
    networkFilter: FILTER_TYPE,
    activeLog: null,
    isShow: false,
    activeFilter: FILTER_TYPE[0].key,
    settingOptions: SETTING_OPTIONS,
  },
  async onInit() {
    this.onInput = (event) => {
      clearTimeout(this.timerId);
      const { value: search } = event.detail;
      this.timerId = setTimeout(() => {
        const { tab } = this.data;
        let logList: any[] = tracking[tab];
        if (search) {
          if (tab === TAB_DEBUG.CONSOLE) {
            logList = logList.filter((log: Log) => {
              return log.message.includes(search);
            });
          } else {
            logList = logList.filter((log: Request) => {
              return log.general.url.includes(search);
            });
          }
        }
        this.setData({ logList, search });
      }, 300);
    };
  },
  deriveDataFromProps(nextProps) {
    const { type, env, userEmail = '' } = nextProps;
    if (env === ENV.PROD && !checkEmailInWhiteList(userEmail, logger.whitelist)) {
      this.setData({ isShow: false });
      return;
    }
    this.setData({ isShow: true });
    if (type !== this.props.type) this.updateSetting({ type });
  },
  methods: {
    updateNetworkFilter() {
      const _filters = (tracking[TAB_DEBUG.NETWORK] as Request[]).reduce(
        (_filters: [Request[], Request[], Request[]], request: Request) => {
          const error: boolean =
            (request.resHeaders && request.resHeaders['http-status-code'] >= 400) || false;
          if (!error) _filters[1].push(request);
          else _filters[2].push(request);
          _filters[0].push(request);
          return _filters;
        },
        [[], [], []],
      );

      const networkFilter = FILTER_TYPE.map((filter: NetworkFilter, index) => {
        filter.logs = _filters[index];
        return filter;
      });
      this.setData({ networkFilter, activeFilter: FILTER_TYPE[0].key });
    },
    onOpenBottomSheet() {
      let { tab } = this.data;
      if (tab === TAB_DEBUG.SETTING) {
        this.setData({ isShowLog: true });
        return;
      }

      if (tab === TAB_DEBUG.NETWORK) this.updateNetworkFilter();

      this.setData({
        logList: tracking[this.data.tab],
        isShowLog: true,
        search: '',
      });
    },
    onCloseBottomSheet() {
      this.setData({ isShowLog: false });
    },
    onClearLog() {
      tracking[this.data.tab].splice(0, tracking[this.data.tab].length);
      this.setData({ logList: tracking[this.data.tab] });
    },
    onChangeTap(event) {
      const { tab } = event.target.dataset;
      if (tab === TAB_DEBUG.SETTING) {
        this.setData({ tab });
        return;
      }
      if (tab === TAB_DEBUG.NETWORK) this.updateNetworkFilter();
      this.setData({ tab, logList: tracking[tab], search: '' });
    },
    onChangeSetting(event) {
      const active = event.detail.value ? 'on' : 'off';
      const index = event.target.dataset.index;
      const settingOption = this.data.settingOptions[index];
      const option = {
        [settingOption.field]: settingOption.values[active].value,
      };
      this.updateSetting(option);
    },
    updateSetting(options) {
      const { settingOptions } = this.data;
      const [configOptions, pageOptions] = Object.keys(options).reduce(
        (_options: any, option) => {
          const indexSetting = settingOptions.findIndex((setting) => setting.field === option);
          if (indexSetting < 0) return;
          const setting = settingOptions[indexSetting];

          if (setting.isFieldInConfig) {
            _options[0][option] = options[option];
          } else {
            _options[1][option] = options[option];
          }

          settingOptions[indexSetting].activeValue =
            settingOptions[indexSetting].values.on.value === options[option] ? 'on' : 'off';

          return _options;
        },
        [{}, {}],
      );

      logger.setConfig(configOptions);
      this.setData({ ...pageOptions, settingOptions });
      if (options.type) this.updateView(options.type);
    },
    updateView(type) {
      if (type === TYPE_VIEW.SHAKE) {
        const { tab } = this.data;
        (my as any).watchShake({
          success: () => {
            this.setData({
              isShowLog: type === TYPE_VIEW.SHAKE,
              tab: tab === TAB_DEBUG.SETTING ? TAB_DEBUG.CONSOLE : tab,
            });
          },
        });
      }
    },
    onChangeFilter(event) {
      const { type } = event.target.dataset;
      const { networkFilter } = this.data;
      const newIndex = networkFilter.findIndex((filter) => filter.key === type);
      this.setData({
        logList: networkFilter[newIndex].logs,
        activeFilter: type,
      });
    },
    onOpenDetail({ log, request }) {
      if (log) this.setData({ isShowLogBottomSheet: true, activeLog: log });
      if (request)
        this.setData({
          isShowRequestBottomSheet: true,
          activeRequest: request,
        });
      this.onCloseBottomSheet();
    },
    onCloseLogDetail() {
      this.setData({
        isShowLogBottomSheet: false,
        isShowRequestBottomSheet: false,
      });
      this.onOpenBottomSheet();
    },
    onCopy(event) {
      my.setClipboard({ text: event.target.dataset.text });
    },
  },
});

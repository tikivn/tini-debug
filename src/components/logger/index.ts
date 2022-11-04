import logger, { Log, Request, LEVEL_DEBUG } from '../../utils/logger';
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

const FILTER_TYPE = {
  [TAB_DEBUG.NETWORK]: [
    { key: 'all', title: 'All', logs: [] },
    { key: 'success', title: 'Success', logs: [] },
    { key: 'error', title: 'Error', logs: [] },
  ],
  [TAB_DEBUG.CONSOLE]: [
    { key: 'info', title: 'Log', logs: [] },
    { key: 'warn', title: 'Warn', logs: [] },
    { key: 'error', title: 'Error', logs: [] },
  ],
};

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

type tabFilter = { key: string; title: string; logs: Log[] | Request[] };

type LoggerData = {
  tab: string;
  isShowLog: boolean;
  isShowLogBottomSheet: boolean;
  isShowRequestBottomSheet: boolean;
  logList: Log[] | Request[];
  search: string;
  activeLog: Log | null;
  activeRequest: Request | null;
  tabFilter: tabFilter[];
  isShow: boolean;
  activeFilter: string;
  settingOptions: SettingOption[];
  sortType: 'asc' | 'desc';
  cursor: { x: number; y: number; touching: boolean };
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
  updateLogList: () => void;
  onSort: (event: any) => void;
  onTouchEnd?: (event: any) => void;
  onTouchStart?: () => void;
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
    tabFilter: FILTER_TYPE[TAB_DEBUG.CONSOLE],
    activeLog: null,
    isShow: false,
    activeFilter: FILTER_TYPE[TAB_DEBUG.CONSOLE][0].key,
    settingOptions: SETTING_OPTIONS,
    sortType: 'desc',
    cursor: { x: 16, y: 16, touching: false },
  },
  async onInit() {
    this.onInput = (event) => {
      clearTimeout(this.timerId);
      const { value: search } = event.detail;
      this.timerId = setTimeout(() => {
        this.setData({ search }, () => {
          this.updateLogList();
        });
      }, 300);
    };

    this.onTouchEnd = (event) => {
      if (this.data.cursor.touching) {
        this.setData({
          cursor: {
            x: event.changedTouches[0].pageX,
            y: event.changedTouches[0].pageY,
            touching: false,
          },
        });
      }
    };

    this.onTouchStart = () => {
      const cursor = this.data.cursor;
      if (!cursor.touching) this.setData({ cursor: { ...cursor, touching: true } });
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
    updateLogList() {
      const { activeFilter, sortType, tab, search } = this.data;
      let { logList, tabFilter } = this.data;
      if (tab === TAB_DEBUG.NETWORK) {
        // filter network
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

        tabFilter = FILTER_TYPE[TAB_DEBUG.NETWORK].map((filter: tabFilter, index) => {
          filter.logs = _filters[index];
          if (activeFilter === filter.key) logList = filter.logs;
          return filter;
        });
      } else {
        const _filters = (tracking[TAB_DEBUG.CONSOLE] as Log[]).reduce(
          (_filters: [Log[], Log[], Log[]], log: Log) => {
            if (log.type === LEVEL_DEBUG.INFO) _filters[0].push(log);
            else if (log.type === LEVEL_DEBUG.WARN) _filters[1].push(log);
            else _filters[2].push(log);
            return _filters;
          },
          [[], [], []],
        );

        tabFilter = FILTER_TYPE[TAB_DEBUG.CONSOLE].map((filter: tabFilter, index) => {
          filter.logs = _filters[index];
          if (activeFilter === filter.key) logList = filter.logs;
          return filter;
        });
      }
      // sort
      logList = sortType == 'asc' ? logList : logList.reverse();
      // search
      if (search) {
        if (tab === TAB_DEBUG.CONSOLE) {
          logList = (logList as Log[]).filter((log: Log) => {
            return log.message.includes(search);
          });
        } else {
          logList = (logList as Request[]).filter((log: Request) => {
            return log.general.url.includes(search);
          });
        }
      }

      this.setData({ tabFilter, logList });
    },
    onOpenBottomSheet() {
      let { tab } = this.data;
      if (tab === TAB_DEBUG.SETTING) {
        this.setData({ isShowLog: true });
        return;
      }

      this.setData({ isShowLog: true, search: '' }, () => {
        this.updateLogList();
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

      this.setData({ tab, search: '', activeFilter: FILTER_TYPE[tab][0].key }, () => {
        this.updateLogList();
      });
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
      this.setData({ activeFilter: type }, () => {
        this.updateLogList();
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
      my.setClipboard({
        text: event.target.dataset.text,
        success: () => {
          my.showToast({
            type: 'success',
            content: 'Copy success 👀',
            duration: 1200,
          });
        },
        fail: () => {
          my.showToast({
            type: 'fail',
            content: 'Copy fail 🐧',
            duration: 1200,
          });
        },
      });
    },
    onSort(event) {
      const { type } = event.target.dataset;
      this.setData({ sortType: type }, () => {
        this.updateLogList();
      });
    },
  },
});

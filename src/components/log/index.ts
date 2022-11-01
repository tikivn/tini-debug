import { Log, Request } from '../../utils/logger';

type LogProps = {
  log: Log;
  request: Request;
  onOpenBottomSheet: ({ log, request }: { log: Log; request: Request }) => void;
};

type LogData = {};

type LogMethods = {
  onTab: () => void;
};

Component<LogProps, LogData, LogMethods>({
  methods: {
    onTab() {
      const { log, request } = this.props;
      console.log({ log, request });
      this.props.onOpenBottomSheet && this.props.onOpenBottomSheet({ log, request });
    },
  },
});

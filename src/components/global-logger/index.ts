import decodeToken from '../../utils/decode';

type GlobalLoggerProps = {
  type: string;
  env: string;
  userEmail?: string;
};

type GlobalLoggerData = {};

type GlobalLoggerMethods = {};

Component<GlobalLoggerProps, GlobalLoggerData, GlobalLoggerMethods>({
  onInit() {
    (my as any).getUserToken({
      success: ({ token = '' }) => {
        const data = decodeToken(token);
        this.setData({ email: data.email });
      },
    });
  },
  deriveDataFromProps(nextProps) {
    if (nextProps.userEmail) this.setData({ email: nextProps.userEmail });
  },
});

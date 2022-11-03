import decodeToken from '../../utils/decode';
import { Request } from '../../utils/logger';

type RequestProps = {
  request: Request;
  show: boolean;
  onClose: () => void;
};

type RequestData = {
  tokens: {
    headers: Record<string, { isDecode: boolean; decode: string }>;
    resHeaders: Record<string, { isDecode: boolean; decode: string }>;
  };
};

type RequestMethods = {
  onCopy: (event: any) => void;
  onClose: () => void;
  onTransformData: (event: any) => void;
  onCopyCURL: () => void;
};

Component<RequestProps, RequestData, RequestMethods>({
  data: {
    tokens: {
      headers: {},
      resHeaders: {},
    },
  },
  methods: {
    onClose() {
      this.props.onClose && this.props.onClose();
    },
    onCopy(event) {
      const { text } = event.target.dataset;
      my.setClipboard({
        text,
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
    onTransformData(event) {
      const { tokens } = this.data;
      const { request } = this.props;
      const { field } = event.target.dataset;
      const type: 'headers' | 'resHeaders' = event.target.dataset.type;
      if (tokens[type][field] && tokens[type][field].isDecode) {
        tokens[type][field].isDecode = false;
      } else if (request.headers) {
        tokens[type][field] = {
          isDecode: true,
          decode: JSON.stringify(decodeToken(request.headers[field]), null, 2),
        };
      }
      this.setData({ tokens });
    },
    onCopyCURL() {
      const { request } = this.props;
      const { general, headers, data: body } = request;
      let cUrlHeader = [];
      for (const key in headers) {
        cUrlHeader.push(`--header '${key}: ${headers[key]}'`);
      }
      const cUrl = `curl --location --request ${general.method} '${
        general.url
      }' \\\n${cUrlHeader.join(' \\\n')}${body ? ` \\\n--data-raw '${JSON.stringify(body)}'` : ''}
      `;

      my.setClipboard({
        text: cUrl,
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
  },
});

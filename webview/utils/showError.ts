import { COMMON } from "../constants";

const showError = (message: string) => {
  const messageObj = {
    command: COMMON.SHOW_ERROR,
    errorMsg: message,
  };
  vscode.postMessage(messageObj);
};

export default showError;
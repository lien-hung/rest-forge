import { create } from "zustand";

import configSlice from "./slices/configSlice";
import keyValueTableDataSlice from "./slices/keyValueTableDataSlice";
import oAuth2TokenSlice from "./slices/oAuth2TokenSlice";
import requestDataSlice from "./slices/requestDataSlice";
import resizeBarSlice from "./slices/resizeBarSlice";
import responseDataSlice from "./slices/responseDataSlice";

import {
  IRequestDataSlice,
  IResponseDataSlice,
  IResizeBarSlice,
  IKeyValueTableDataSlice,
  IConfigSlice,
  IOAuth2TokenSlice,
} from "./slices/type";

const useStore = create<
  IRequestDataSlice &
  IResponseDataSlice &
  IResizeBarSlice &
  IKeyValueTableDataSlice &
  IConfigSlice &
  IOAuth2TokenSlice
>()((...set) => ({
  ...requestDataSlice(...set),
  ...responseDataSlice(...set),
  ...resizeBarSlice(...set),
  ...keyValueTableDataSlice(...set),
  ...configSlice(...set),
  ...oAuth2TokenSlice(...set),
}));

export default useStore;

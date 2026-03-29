import React from "react";
import { useShallow } from "zustand/shallow";

import { COMMON, REQUEST } from "../../../constants/index";
import KeyValueTable from "../../../shared/KeyValueTable";
import { OptionType } from "../../../store/slices/type";
import useStore from "../../../store/useStore";
import RequestAuthSelectMenu from "../Authorization/RequestAuthSelectMenu";
import RequestBodySelectMenu from "../Body/RequestBodySelectMenu";
import RequestCodeSnippet from "../CodeSnippet/RequestCodeSnippet";

const RequestMenuOption = () => {
  const requestOption = useStore((state) => state.requestOption);
  const keyValueProps = useStore(
    useShallow((state) => ({
      tableData: state.tableData[requestOption.toLowerCase() as OptionType],
      addNewTableRow: state.addNewTableRow,
      deleteTableRow: state.deleteTableRow,
      handleRequestKey: state.handleRequestKey,
      handleRequestValue: state.handleRequestValue,
      addRequestBodyHeaders: state.addRequestBodyHeaders,
      handleRequestCheckbox: state.handleRequestCheckbox,
      removeRequestBodyHeaders: state.removeRequestBodyHeaders,
    }))
  );

  switch (requestOption) {
    case REQUEST.PARAMS:
    case COMMON.HEADERS:
      return (
        <KeyValueTable
          type={requestOption.toLowerCase() as OptionType}
          {...keyValueProps}
          tableReadOnly={false}
          title={requestOption}
        />
      );
    case REQUEST.AUTH_SHORT:
      return <RequestAuthSelectMenu />;
    case COMMON.BODY:
      return <RequestBodySelectMenu />;
    default:
      return <RequestCodeSnippet />;
  }
};

export default RequestMenuOption;

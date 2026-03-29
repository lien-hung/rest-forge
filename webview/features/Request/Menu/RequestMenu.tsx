import React, { Fragment, MouseEvent } from "react";
import { useShallow } from "zustand/shallow";

import DetailOption from "../../../components/DetailOption";
import MenuOption from "../../../components/MenuOption";
import { COMMON, OPTION, REQUEST } from "../../../constants/index";
import useStore from "../../../store/useStore";
import RequestMenuOption from "./RequestMenuOption";

const RequestMenu = () => {
  const { themeKind, requestOption, tableData, changeRequestOption } = useStore(
    useShallow((state) => ({
      themeKind: state.themeKind,
      requestOption: state.requestOption,
      tableData: state.tableData,
      changeRequestOption: state.handleRequestOptionChange,
    }))
  );

  const headersCount = tableData.headers.filter(row => row.isChecked).length;

  const handleOptionChange = (event: MouseEvent<HTMLHeadElement>) => {
    const clickedTarget = event.target as HTMLHeadElement;

    changeRequestOption(clickedTarget.innerText);
  };

  return (
    <>
      <DetailOption>
        {OPTION.REQUEST_MENU_OPTIONS.map((requestMenuOption, index) => (
          <Fragment key={REQUEST.REQUEST + index}>
            <MenuOption
              currentOption={requestOption}
              menuOption={requestMenuOption}
              isSeparate={index === OPTION.REQUEST_MENU_OPTIONS.length - 1}
            >
              <h3 onClick={handleOptionChange}>{requestMenuOption}</h3>
              {requestMenuOption === COMMON.HEADERS && (
                <p className={`${themeKind === 1 ? "light" : ""}`}>
                  ({headersCount})
                </p>
              )}
            </MenuOption>
          </Fragment>
        ))}
      </DetailOption>
      <RequestMenuOption />
    </>
  );
};

export default RequestMenu;

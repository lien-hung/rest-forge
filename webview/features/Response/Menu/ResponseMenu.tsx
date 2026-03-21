import React, { Fragment, MouseEvent } from "react";
import { useShallow } from "zustand/shallow";

import DetailOption from "../../../components/DetailOption";
import MenuOption from "../../../components/MenuOption";
import { COMMON, OPTION, RESPONSE } from "../../../constants/index";
import useStore from "../../../store/useStore";
import ResponseMetaData from "../MetaData/ResponseMetaData";

type OnClickCallback = (event: MouseEvent<HTMLHeadingElement>) => void;

const ResponseMenu = () => {
  const { themeKind, responseData, responseOption, handleResponseOptionChange } = useStore(
    useShallow((state) => ({
      themeKind: state.themeKind,
      responseData: state.responseData,
      responseOption: state.responseOption,
      handleResponseOptionChange: state.handleResponseOption,
    }))
  );

  const handleHeadingTextClick: OnClickCallback = (
    event: MouseEvent<HTMLHeadingElement>,
  ) => {
    const clickedHeading = event.currentTarget;

    handleResponseOptionChange(clickedHeading.innerText);
  };

  return (
    <>
      <ResponseMetaData {...responseData} />
      <DetailOption>
        {OPTION.RESPONSE_MENU_OPTIONS.map((responseMenuOption, index) => (
          <Fragment key={RESPONSE.RESPONSE + index}>
            <MenuOption
              currentOption={responseOption}
              menuOption={responseMenuOption}
            >
              <h3 onClick={handleHeadingTextClick}>{responseMenuOption}</h3>
              {responseMenuOption === COMMON.HEADERS && (
                <p className={`${themeKind === 1 ? "light" : ""}`}>
                  ({responseData?.headersLength})
                </p>
              )}
            </MenuOption>
          </Fragment>
        ))}
      </DetailOption>
    </>
  );
};

export default ResponseMenu;

import React, { Fragment, MouseEvent } from "react";
import { useShallow } from "zustand/shallow";

import DetailOption from "../../../components/DetailOption";
import MenuOption from "../../../components/MenuOption";
import { COMMON, OPTION, RESPONSE } from "../../../constants/index";
import useStore from "../../../store/useStore";
import ResponseMetaData from "../MetaData/ResponseMetaData";

type OnClickCallback = (event: MouseEvent<HTMLHeadingElement>) => void;

const ResponseMenu = () => {
  const { responseData, responseOption, handleResponseOptionChange } = useStore(
    useShallow((state) => ({
      responseData: state.responseData,
      responseOption: state.responseOption,
      handleResponseOptionChange: state.handleResponseOptionChange,
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
            </MenuOption>
            {responseMenuOption === COMMON.HEADERS && <p>({responseData?.headersLength})</p>}
          </Fragment>
        ))}
      </DetailOption>
    </>
  );
};

export default ResponseMenu;

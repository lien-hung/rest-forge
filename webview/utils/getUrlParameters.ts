function getUrlParameters(url: string) {
  const searchIndex = url.indexOf("?");
  if (searchIndex === -1) {
    return [];
  }

  const paramsStr = url.slice(searchIndex + 1);
  if (!paramsStr) {
    return [];
  }

  const params = paramsStr.split("&");
  const paramPairs = params.map((param) => {
    let key = "";
    let value = "";

    if (!param.includes("=")) {
      key = param;
    } else {
      [key, value] = param.split("=");
    }

    return {
      key: key,
      value: value
    };
  });

  return paramPairs;
}

export default getUrlParameters;
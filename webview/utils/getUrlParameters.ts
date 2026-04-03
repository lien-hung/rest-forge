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
      const splitIndex = param.indexOf("=");
      key = param.slice(0, splitIndex);
      value = param.slice(splitIndex + 1);
    }

    return { key, value };
  });

  return paramPairs;
}

export default getUrlParameters;
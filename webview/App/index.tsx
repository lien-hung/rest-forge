import React from "react";

import MainPage from "../pages/MainPage";
import ManageTokensPage from "../pages/ManageTokensPage";
import ManageEnvironmentPage from "../pages/ManageEnvironmentPage";

function App() {
  if (document.title.includes("Manage Tokens")) {
    return <ManageTokensPage />;
  }
  if (document.title.includes("Manage Environment")) {
    return <ManageEnvironmentPage />;
  }
  return <MainPage />;
}

export default App;
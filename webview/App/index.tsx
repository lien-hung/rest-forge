import React from "react";

import MainPage from "../pages/MainPage";
import ManageTokensPage from "../pages/ManageTokensPage";

function App() {
  if (document.title.includes("Manage Tokens")) {
    return <ManageTokensPage />;
  }
  return <MainPage />;
}

export default App;
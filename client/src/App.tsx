import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./pages/auth";
import Chat from "./pages/chat";
import Call from "./pages/call";

const App = () => {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/call" element={<Call />} />
    </Routes>
    </BrowserRouter>
  );
};

export default App;
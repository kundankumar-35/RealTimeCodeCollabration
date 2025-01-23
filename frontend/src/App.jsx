
import Home from './pages/Home'
import EditorPage from './pages/Editor';
// import Soket from './pages/soket';
import { BrowserRouter, Routes, Route } from "react-router";

function App() {


  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/chatroom" element={<Soket />} /> */}
        <Route path="/" element={<Home />} />
        <Route path = "/editor/:roomId" element={<EditorPage/>}/>

      </Routes>
    </BrowserRouter>
  )
}

export default App

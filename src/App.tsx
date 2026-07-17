
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Login } from './pages/login';
import { Home } from './pages/home';



function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path={"/"} element={<Home />}> </Route>
          <Route path="/login" element={<Login />}> </Route>

          <Route path="*" element={<h1>Page not Found </h1>}> </Route>


        </Routes>

      </BrowserRouter>
    </>
  )
}

export default App

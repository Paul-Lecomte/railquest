import {Button} from "@material-tailwind/react";
import {Route, Routes} from "react-router-dom";
import Login from "./pages/login/Login.jsx";
import ErrorPage from "./pages/error_page/ErrorPage.jsx";

export default function App() {
    return (
        <Routes>
            <Route path="login" element={<Login />} />

            <Route path="*" element={<ErrorPage />} />
        </Routes>
    );
}

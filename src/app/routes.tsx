import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Syllabi } from "./components/Syllabi";
import { Tests } from "./components/Tests";
import { Chat } from "./components/Chat";
import { Challenges } from "./components/Challenges";
import { Login } from "./components/Login";
import { CreateTest } from "./components/CreateTest";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { RegisterStudent } from "./components/RegisterStudent";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "temarios", Component: Syllabi },
          { path: "tests", Component: Tests },
          { path: "chat", Component: Chat },
          { path: "retos", Component: Challenges },
          { path: "crear-test", Component: CreateTest },
          { path: "registrar-alumno", Component: RegisterStudent },
        ],
      }
    ]
  }
]);

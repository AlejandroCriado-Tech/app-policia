import { TestView } from "./components/TestView";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Syllabi } from "./components/Syllabi";
import { Tests } from "./components/Tests";
import { StudentList } from "./components/StudentList";
import { Chat } from "./components/Chat";
import { Challenges } from "./components/Challenges";
import { Login } from "./components/Login";
import { CreateTest } from "./components/CreateTest";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RegisterStudent } from "./components/RegisterStudent";
import { Simulacro } from "./components/Simulacro";
import { CambiarContrasena } from "./components/CambiarContrasena";
import { RecuperarContrasena } from "./components/RecuperarContrasena";
import { ResetContrasena } from "./components/ResetContrasena";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/recuperar",
    Component: RecuperarContrasena,
  },
  {
    path: "/reset",
    Component: ResetContrasena,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        path: "cambiar-contrasena",
        Component: CambiarContrasena,
      },
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "temarios", Component: Syllabi },
          { path: "tests/:id_bloque/:id_tema", Component: TestView },
          { path: "tests", Component: Tests },
          { path: "alumnos", Component: StudentList },
          { path: "simulacro", Component: Simulacro },
          { path: "chat", Component: Chat },
          { path: "retos", Component: Challenges },
          { path: "crear-test", Component: CreateTest },
          { path: "registrar-alumno", Component: RegisterStudent },
        ],
      }
    ]
  }
]);

import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  MessageCircle, 
  Trophy,
  LogOut,
  Bell,
  Search,
  Menu,
  PlusCircle,
  UserPlus
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const baseNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Temarios', href: '/temarios', icon: BookOpen },
    { name: 'Tipo Test', href: '/tests', icon: CheckSquare },
    { name: user?.role === 'admin' ? 'Chat con Alumnos' : 'Chat Profesores', href: '/chat', icon: MessageCircle },
    { name: 'Retos y Medallas', href: '/retos', icon: Trophy },
  ];

  // Add the Create Test route if the user is an admin
  const navigation = [...baseNavigation];
  if (user?.role === 'admin') {
    navigation.push({ name: 'Crear Test (Admin)', href: '/crear-test', icon: PlusCircle });
    navigation.push({ name: 'Registrar Alumno', href: '/registrar-alumno', icon: UserPlus });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-20 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">P</span>
            </div>
            <h1 className="text-xl font-bold">PoliTest Cáceres</h1>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto pb-6">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {item.name.includes('Admin') && (
                  <span className="ml-auto text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">PRO</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white w-full rounded-xl transition-colors hover:bg-slate-800"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          <button 
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 flex justify-center lg:justify-start px-4 lg:px-0">
            <div className="max-w-md w-full relative hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Buscar temas, tests..."
                type="search"
              />
            </div>
          </div>

          <div className="ml-4 flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900">{user?.name || 'Usuario'}</p>
                <p className="text-xs font-medium text-blue-600 flex items-center justify-end gap-1">
                  {user?.role === 'admin' ? (
                    <span className="bg-blue-100 px-2 py-0.5 rounded-sm">Admin / Profesor</span>
                  ) : (
                    <span className="text-gray-500">Opositor</span>
                  )}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold border-2 shadow-sm ${user?.role === 'admin' ? 'bg-indigo-600 border-indigo-200' : 'bg-blue-600 border-blue-200'}`}>
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

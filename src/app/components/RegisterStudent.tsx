import { useState, useRef, useCallback } from 'react';
import { UserPlus, Mail, Lock, CheckCircle2, Shield, Camera, Upload, X, ZoomIn, ZoomOut, RotateCw, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '../lib/api';

export function RegisterStudent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [dniError, setDniError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const processPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5 MB');
      return;
    }
    setPhotoFile(file);
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPhoto(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processPhoto(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingImage) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDraggingImage, dragStart]);
  const handleMouseUp = () => setIsDraggingImage(false);

  const getFinalPhoto = (): string | null => {
    if (!photoPreview || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    img.src = photoPreview;

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.clearRect(0, 0, size, size);
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    const scale = size / Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, -img.naturalWidth * scale / 2, -img.naturalHeight * scale / 2, img.naturalWidth * scale, img.naturalHeight * scale);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const validateDni = (value: string): boolean => {
    const dniRegex = /^[0-9]{8}[A-Za-z]$/;
    if (!dniRegex.test(value)) return false;
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const letra = letras[parseInt(value.slice(0, 8)) % 23];
    return letra === value.slice(8).toUpperCase();
  };

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setDni(value);
    if (value.length === 9) {
      setDniError(validateDni(value) ? '' : 'DNI no válido');
    } else {
      setDniError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !dni) {
      toast.error('Por favor, rellena todos los campos');
      return;
    }

    if (!validateDni(dni)) {
      setDniError('DNI no válido');
      toast.error('El DNI introducido no es válido');
      return;
    }

    setIsSubmitting(true);

    const finalPhoto = getFinalPhoto();

    const partes = name.trim().split(' ');
    const nombre = partes[0];
    const apellido1 = partes.slice(1).join(' ') || '';

    try {
      const response = await fetch(`${API_URL}/api/alumnos/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido1,
          dni: dni.toUpperCase(),
          correo: email,
          contrasena: password,
          foto: finalPhoto
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al registrar el alumno');
        return;
      }

      toast.success('Alumno registrado correctamente');
      setName('');
      setEmail('');
      setPassword('');
      setDni('');
      setDniError('');
      handleRemovePhoto();

    } catch (error) {
      toast.error('No se pudo conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Registrar Alumno</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Añade nuevos estudiantes para que tengan acceso a la plataforma</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Datos de acceso</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Estas serán las credenciales del alumno para entrar a la app.</p>
              </div>
            </div>

            {/* Foto de perfil */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Foto de perfil <span className="text-gray-400 font-normal">(opcional)</span>
              </label>

              {!photoPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`
                    relative flex flex-col items-center justify-center gap-3 
                    border-2 border-dashed rounded-2xl py-10 px-6 cursor-pointer 
                    transition-all duration-200
                    ${isDragging
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                    }
                  `}
                >
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center shadow-sm">
                    <Camera className="w-7 h-7 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Arrastra una foto aquí</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">o haz clic para seleccionar · JPG, PNG, WEBP · Máx. 5 MB</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-600 dark:text-gray-300">
                    <Upload className="w-4 h-4" /> Seleccionar archivo
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5">
                  <div className="relative">
                    <div
                      className="w-40 h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800 cursor-grab active:cursor-grabbing select-none"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img
                        src={photoPreview}
                        alt="Preview"
                        draggable={false}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                          transformOrigin: 'center',
                          transition: isDraggingImage ? 'none' : 'transform 0.15s ease',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">Arrastra la imagen para reencuadrar</p>

                  <div className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="range" min="0.5" max="3" step="0.05" value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1.5 rounded-full"
                      />
                      <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">{Math.round(zoom * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <RotateCw className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="range" min="-180" max="180" step="1" value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1.5 rounded-full"
                      />
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">{rotation}°</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => { setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); }}
                        className="flex-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg py-1.5 transition-colors bg-white dark:bg-gray-700">
                        Restablecer
                      </button>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="flex-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 border border-blue-200 dark:border-blue-700 rounded-lg py-1.5 transition-colors bg-white dark:bg-gray-700">
                        Cambiar foto
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-2" />

            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre completo</label>
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Laura García Pérez"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-colors"
              />
            </div>

            {/* DNI */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">DNI</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text" required maxLength={9} value={dni} onChange={handleDniChange}
                  placeholder="Ej: 12345678Z"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-colors font-mono uppercase ${dniError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                />
              </div>
              {dniError && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{dniError}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Correo electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="alumno@academia.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-colors"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contraseña temporal</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce una contraseña segura"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-600 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit" disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Registrar y Crear Acceso</>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-50 dark:bg-gray-700/50 p-6 border-t border-gray-100 dark:border-gray-700 flex items-start gap-4">
          <Shield className="w-6 h-6 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Aviso de Privacidad</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Asegúrate de proporcionar la contraseña al estudiante por un medio seguro. El alumno podrá cambiar esta contraseña temporal una vez inicie sesión por primera vez en la plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

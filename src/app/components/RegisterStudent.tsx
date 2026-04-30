import { useState, useRef, useCallback } from 'react';
import { UserPlus, Mail, Lock, CheckCircle2, Shield, Camera, Upload, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

export function RegisterStudent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // Drag to reposition image inside circle
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingImage) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDraggingImage, dragStart]);
  const handleMouseUp = () => setIsDraggingImage(false);

  // Export final cropped image as base64
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error('Por favor, rellena todos los campos');
      return;
    }

    setIsSubmitting(true);

    // Render final cropped photo to canvas before submitting
    const finalPhoto = getFinalPhoto();

    setTimeout(() => {
      console.log('Alumno registrado con foto:', finalPhoto ? 'sí' : 'no');
      toast.success('Alumno registrado correctamente');
      setName('');
      setEmail('');
      setPassword('');
      handleRemovePhoto();
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Registrar Alumno</h2>
        <p className="text-gray-500 mt-2">Añade nuevos estudiantes para que tengan acceso a la plataforma</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Datos de acceso</h3>
                <p className="text-sm text-gray-500">Estas serán las credenciales del alumno para entrar a la app.</p>
              </div>
            </div>

            {/* ── PHOTO UPLOAD ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Foto de perfil <span className="text-gray-400 font-normal">(opcional)</span>
              </label>

              {!photoPreview ? (
                /* Drop zone */
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
                      ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
                    }
                  `}
                >
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
                    <Camera className="w-7 h-7 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Arrastra una foto aquí</p>
                    <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar · JPG, PNG, WEBP · Máx. 5 MB</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-600">
                    <Upload className="w-4 h-4" /> Seleccionar archivo
                  </div>
                </div>
              ) : (
                /* Photo editor */
                <div className="flex flex-col items-center gap-5">

                  {/* Preview circle */}
                  <div className="relative">
                    <div
                      className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-blue-200 cursor-grab active:cursor-grabbing select-none"
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

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 -mt-2">Arrastra la imagen para reencuadrar</p>

                  {/* Controls */}
                  <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">

                    {/* Zoom */}
                    <div className="flex items-center gap-3">
                      <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1.5 rounded-full"
                      />
                      <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-xs text-gray-400 w-8 text-right">{Math.round(zoom * 100)}%</span>
                    </div>

                    {/* Rotation */}
                    <div className="flex items-center gap-3">
                      <RotateCw className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={rotation}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1.5 rounded-full"
                      />
                      <span className="text-xs text-gray-400 w-8 text-right">{rotation}°</span>
                    </div>

                    {/* Actions row */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setZoom(1); setRotation(0); setOffset({ x: 0, y: 0 }); }}
                        className="flex-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg py-1.5 transition-colors bg-white"
                      >
                        Restablecer
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg py-1.5 transition-colors bg-white"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Hidden canvas for final export */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-2" />

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Laura García Pérez"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alumno@academia.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña temporal</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce una contraseña segura"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors font-mono"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Registrar y Crear Acceso
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-gray-100 flex items-start gap-4">
          <Shield className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-1">Aviso de Privacidad</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Asegúrate de proporcionar la contraseña al estudiante por un medio seguro. El alumno podrá cambiar esta contraseña temporal una vez inicie sesión por primera vez en la plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/useUser";
import { useFavorites } from "../context/FavoritesContext";
import { useTranslation } from "../hooks/useTranslation";
import { allAnimals } from "../data/allData";
import apiClient from "../api/apiClient";
import Toast from "../components/Toast";
import {
  Trash2, Eye, EyeOff, AlertTriangle, Pencil, Check, X, ImagePlus,
  Clock, BarChart2, Star, BookOpen,
} from "lucide-react";

// ── Avatares predefinidos ─────────────────────────────────────────────────
const AVATARS = [
  { id: "av1", url: "https://i.ytimg.com/vi/7j8krOd0-KA/maxresdefault.jpg", label: "Eoraptor" },
  { id: "av2", url: "https://images.dinosaurpictures.org/Allosaurus/Allosaurus_f614bc6d.jpg", label: "Allosaurus" },
  { id: "av3", url: "https://www.mundoprehistorico.com/wp-content/uploads/Archaeopteryx-01.jpg", label: "Archaeopteryx" },
  { id: "av4", url: "https://www.mundoprehistorico.com/wp-content/uploads/Stegosaurus-01.jpg", label: "Estegosaurus" },
  { id: "av5", url: "https://www.mundoprehistorico.com/wp-content/uploads/Diplodocus-01.jpg", label: "Diplodocus" },
  { id: "av6", url: "https://images.newscientist.com/wp-content/uploads/2023/09/27132703/SEI_173479939.jpg", label: "Trilobite" },
  { id: "av7", url: "https://static.wikia.nocookie.net/life-on-our-planet/images/a/a0/Cameroceras.jpg", label: "Cameroceras" },
  { id: "av8", url: "https://www.mundoprehistorico.com/wp-content/uploads/Compsognathus-01.jpg", label: "Compsognathus" },
];

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const ERA_MAP = {
  "Cámbrico": "Paleozoico", "Ordovícico": "Paleozoico", "Silúrico": "Paleozoico",
  "Devónico": "Paleozoico", "Carbonífero": "Paleozoico", "Pérmico": "Paleozoico",
  "Triásico": "Mesozoico",  "Jurásico": "Mesozoico",    "Cretácico": "Mesozoico",
  "Paleoceno": "Cenozoico", "Eoceno": "Cenozoico",      "Oligoceno": "Cenozoico",
  "Mioceno": "Cenozoico",   "Plioceno": "Cenozoico",    "Pleistoceno": "Cenozoico",
  "Holoceno": "Cenozoico",
};

const ERA_COLORS = {
  Paleozoico: { color: "#6aafc5", bg: "rgba(106,175,197,0.12)", border: "rgba(106,175,197,0.3)" },
  Mesozoico:  { color: "#6abf6a", bg: "rgba(106,191,106,0.12)", border: "rgba(106,191,106,0.3)" },
  Cenozoico:  { color: "#cf9a5a", bg: "rgba(207,154,90,0.12)",  border: "rgba(207,154,90,0.3)"  },
};

// ── Separador ─────────────────────────────────────────────────────────────
const Divider = ({ label, isLight }) => (
  <div className="flex items-center gap-3 my-6">
    <div className={`flex-1 h-px ${isLight ? "bg-stone-100" : "bg-white/5"}`} />
    <span className={`text-[10px] tracking-[0.2em] uppercase ${isLight ? "text-stone-400" : "text-stone-500"}`}>{label}</span>
    <div className={`flex-1 h-px ${isLight ? "bg-stone-100" : "bg-white/5"}`} />
  </div>
);

// ── Campo de formulario ───────────────────────────────────────────────────
const Field = ({ label, value, onChange, type = "text", placeholder, isLight, maxLength }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label className={`block text-[11px] tracking-[0.16em] uppercase mb-2 font-bold ${isLight ? "text-stone-400" : "text-stone-500"}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full font-mono text-base px-4 py-3.5 rounded-xl border outline-none transition-all focus:border-amber-500/60
            ${isLight
              ? "bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300"
              : "bg-black/20 border-white/[0.08] text-white placeholder:text-stone-700"}`}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-amber-500 transition-colors">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {maxLength && (
        <p className={`text-[10px] text-right font-mono mt-1 ${isLight ? "text-stone-300" : "text-stone-700"}`}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

// ── Barra de distribución por era ─────────────────────────────────────────
function EraBar({ label, counts, total, isLight }) {
  const eras = ["Paleozoico", "Mesozoico", "Cenozoico"];
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className={`font-mono text-[12px] font-bold uppercase tracking-widest ${isLight ? "text-stone-500" : "text-[#6b5e4e]"}`}>
          {label}
        </span>
        <span className={`font-mono text-[13px] font-black ${isLight ? "text-stone-700" : "text-[#f5e6c8]"}`}>
          {total}
        </span>
      </div>
      {total === 0 ? (
        <div className={`h-3 rounded-full ${isLight ? "bg-stone-100" : "bg-white/5"}`} />
      ) : (
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          {eras.map(era => {
            const pct = (counts[era] || 0) / total * 100;
            if (pct === 0) return null;
            return (
              <motion.div
                key={era}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                style={{ backgroundColor: ERA_COLORS[era].color }}
                className="h-full"
                title={`${era}: ${counts[era] || 0}`}
              />
            );
          })}
        </div>
      )}
      {total > 0 && (
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {eras.map(era => {
            const n = counts[era] || 0;
            if (n === 0) return null;
            return (
              <div key={era} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ERA_COLORS[era].color }} />
                <span className={`font-mono text-[11px] ${isLight ? "text-stone-500" : "text-[#6b5e4e]"}`}>
                  {era} · {n}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sección Estadísticas ──────────────────────────────────────────────────
function StatsSection({ user, favAnimals, isLight, pr }) {
  const history = user?.history || [];
  const notes   = user?.notes   || [];

  const favByEra = useMemo(() => {
    const counts = { Paleozoico: 0, Mesozoico: 0, Cenozoico: 0 };
    favAnimals.forEach(a => { const era = ERA_MAP[a.era]; if (era) counts[era]++; });
    return counts;
  }, [favAnimals]);

  const histByEra = useMemo(() => {
    const counts = { Paleozoico: 0, Mesozoico: 0, Cenozoico: 0 };
    history.forEach(h => {
      const animal = allAnimals.find(a => String(a.id) === String(h.animalId));
      if (!animal) return;
      const era = ERA_MAP[animal.era];
      if (era) counts[era]++;
    });
    return counts;
  }, [history]);

  const eraFavorita = useMemo(() => {
    const totals = {
      Paleozoico: (favByEra.Paleozoico || 0) + (histByEra.Paleozoico || 0),
      Mesozoico:  (favByEra.Mesozoico  || 0) + (histByEra.Mesozoico  || 0),
      Cenozoico:  (favByEra.Cenozoico  || 0) + (histByEra.Cenozoico  || 0),
    };
    const max = Math.max(...Object.values(totals));
    if (max === 0) return null;
    return Object.entries(totals).find(([, v]) => v === max)?.[0] || null;
  }, [favByEra, histByEra]);

  const hasData = favAnimals.length > 0 || history.length > 0;

  const cards = [
    { icon: <Star size={14} />,     label: pr.section?.favorites_label || "Favoritos", value: favAnimals.length, color: "#cf9a5a" },
    { icon: <Clock size={14} />,    label: pr.section?.visited         || "Visitadas",  value: history.length,    color: "#6aafc5" },
    { icon: <BookOpen size={14} />, label: pr.section?.notes           || "Notas",      value: notes.length,      color: "#6abf6a" },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-3 gap-3">
        {cards.map(({ icon, label, value, color }) => (
          <div key={label}
            className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border overflow-hidden
              ${isLight ? "bg-stone-50 border-stone-100" : "bg-black/20 border-white/[0.06]"}`}>
            <div className="absolute inset-x-0 top-0 h-[2px]" style={{ backgroundColor: color }} />
            <div className="flex items-center gap-1.5 mt-1" style={{ color }}>
              {icon}
              <span className={`font-mono text-[11px] uppercase tracking-widest ${isLight ? "text-stone-400" : "text-[#4a3f32]"}`}>
                {label}
              </span>
            </div>
            <p className="font-mono text-3xl font-black" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Era favorita */}
      {eraFavorita && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl border"
          style={{ borderColor: ERA_COLORS[eraFavorita].border, background: ERA_COLORS[eraFavorita].bg }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ERA_COLORS[eraFavorita].color }} />
          <span className={`font-mono text-[11px] uppercase tracking-widest ${isLight ? "text-stone-500" : "text-[#6b5e4e]"}`}>
            {pr.section?.eraFavorite || "Era favorita"}
          </span>
          <span className="font-mono text-[14px] font-black uppercase tracking-wide ml-auto"
            style={{ color: ERA_COLORS[eraFavorita].color }}>
            {eraFavorita}
          </span>
        </div>
      )}

      {/* Barras de distribución */}
      {hasData ? (
        <div className={`flex flex-col gap-5 p-4 rounded-xl border
          ${isLight ? "bg-stone-50 border-stone-100" : "bg-black/20 border-white/[0.06]"}`}>
          <EraBar label={pr.section?.favsByEra  || "Favoritos por era"} counts={favByEra}  total={favAnimals.length} isLight={isLight} />
          <div className={`h-px ${isLight ? "bg-stone-100" : "bg-white/5"}`} />
          <EraBar label={pr.section?.visitedByEra || "Visitadas por era"} counts={histByEra} total={history.length}    isLight={isLight} />
        </div>
      ) : (
        <p className={`font-mono text-[11px] uppercase tracking-widest ${isLight ? "text-stone-300" : "text-stone-700"}`}>
          {pr.section?.emptyStats || "Explora el archivo para ver tus estadísticas."}
        </p>
      )}
    </div>
  );
}

// ── Sección Historial ─────────────────────────────────────────────────────
function HistorySection({ history, isLight, pr }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(8);

  if (!history || history.length === 0) {
    return (
      <p className={`font-mono text-[12px] uppercase tracking-widest ${isLight ? "text-stone-300" : "text-stone-700"}`}>
        {pr.section?.emptyHistory || "Aún no has visitado ninguna ficha."}
      </p>
    );
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs  = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH   = Math.floor(diffMs / 3600000);
    const diffD   = Math.floor(diffMs / 86400000);
    if (diffMin < 1)  return "Ahora";
    if (diffMin < 60) return `Hace ${diffMin}m`;
    if (diffH < 24)   return `Hace ${diffH}h`;
    if (diffD < 7)    return `Hace ${diffD}d`;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const shown = history.slice(0, visible);

  return (
    <div>
      <div className={`rounded-xl border overflow-hidden ${isLight ? "border-stone-200" : "border-[#2a2520]"}`}>
        {shown.map((entry, i) => {
          const animal = allAnimals.find(a => String(a.id) === String(entry.animalId));
          if (!animal) return null;
          return (
            <button key={`${entry.animalId}-${i}`}
              onClick={() => navigate(`/animal/${encodeURIComponent(animal.nombre.toLowerCase())}`)}
              className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all
                ${i < shown.length - 1 ? isLight ? "border-b border-stone-100" : "border-b border-[#1a1816]" : ""}
                ${isLight ? "hover:bg-amber-50" : "hover:bg-amber-600/5"}`}>
              {animal.imagen && (
                <div className={`w-14 h-14 shrink-0 rounded-xl overflow-hidden border
                  ${isLight ? "border-stone-200" : "border-[#2a2520]"}`}>
                  <img src={animal.imagen} alt={animal.nombre} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-mono text-sm font-bold uppercase tracking-wide truncate leading-tight mb-1
                  ${isLight ? "text-stone-800" : "text-[#f5e6c8]"}`}>
                  {animal.nombre}
                </p>
                <p className={`font-mono text-[11px] truncate ${isLight ? "text-stone-400" : "text-[#4a3f32]"}`}>
                  {animal.era}
                </p>
              </div>
              <span className={`font-mono text-[11px] shrink-0 ${isLight ? "text-stone-400" : "text-[#4a3f32]"}`}>
                {formatDate(entry.visitedAt)}
              </span>
            </button>
          );
        })}
      </div>
      {visible < history.length && (
        <button onClick={() => setVisible(v => v + 8)}
          className={`mt-3 w-full py-3 rounded-xl border font-mono text-[11px] uppercase tracking-widest transition-all
            ${isLight ? "border-stone-200 text-stone-400 hover:border-stone-400 hover:text-stone-600"
                      : "border-[#2a2520] text-[#4a3f32] hover:border-[#3a3028] hover:text-[#6b5e4e]"}`}>
          {Math.min(8, history.length - visible)} {pr.section?.showMore || "más"} · {history.length - visible - Math.min(8, history.length - visible)} restantes
        </button>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────
const ProfilePage = () => {
  const navigate = useNavigate();
  const { theme: colorTheme, language, setLanguage } = useUser();
  const { favorites, clearFavorites } = useFavorites();
  const { tSection } = useTranslation();
  const pr = tSection("profile");
  const isLight = colorTheme === "light";

  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState({ show: false, msg: "", type: "success" });
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [bio, setBio]           = useState("");
  const [selectedAvatar, setSelectedAvatar]     = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const fileInputRef = useRef(null);
  const [uploadError, setUploadError]     = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass]         = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [deletePass, setDeletePass]               = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const userId       = localStorage.getItem("userId");
  const myFavAnimals = allAnimals.filter(a => favorites.includes(String(a.id)));

  useEffect(() => {
    if (!userId || localStorage.getItem("auth") !== "true") {
      navigate("/login", { replace: true }); return;
    }
    const fetchUser = async () => {
      try {
        const res = await apiClient.get(`/user/${userId}`);
        setUser(res.data);
        setUsername(res.data.username || "");
        setEmail(res.data.email || "");
        setBio(res.data.bio || "");
        setSelectedAvatar(res.data.avatar || "");
        localStorage.setItem("avatar", res.data.avatar || "");
      } catch { navigate("/login", { replace: true }); }
      finally { setLoading(false); }
    };
    fetchUser();
  }, []);

  const showToast = (msg, type = "success") => setToast({ show: true, msg, type });

  const handleFileChange = (e) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setUploadError("El archivo debe ser una imagen."); return; }
    if (file.size > MAX_FILE_SIZE) { setUploadError("La imagen no puede superar los 3 MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = () => {
    if (!uploadPreview) return;
    setSelectedAvatar(uploadPreview);
    setUploadPreview(null); setUploadError("");
    setShowAvatarPicker(false);
  };

  const handleCancelUpload = () => {
    setUploadPreview(null); setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async () => {
    try {
      const res = await apiClient.put(`/user/${userId}`, { username, email, bio, avatar: selectedAvatar });
      setUser(res.data);
      localStorage.setItem("username", res.data.username.toUpperCase());
      localStorage.setItem("avatar", res.data.avatar || "");
      showToast(pr.toast?.profileUpdated);
    } catch (err) { showToast(err.response?.data?.msg || pr.toast?.saveError, "error"); }
  };

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) return showToast(pr.toast?.passwordMismatch, "error");
    if (newPass.length < 6) return showToast(pr.toast?.passwordTooShort, "error");
    try {
      await apiClient.put(`/user/${userId}/password`, { currentPassword: currentPass, newPassword: newPass });
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      showToast(pr.toast?.passwordUpdated);
    } catch (err) { showToast(err.response?.data?.msg || pr.toast?.passwordError, "error"); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.username) return showToast(pr.toast?.nameMismatch, "error");
    try {
      await apiClient.delete(`/user/${userId}`, { data: { password: deletePass } });
      clearFavorites(); localStorage.clear();
      navigate("/", { replace: true }); window.location.reload();
    } catch (err) { showToast(err.response?.data?.msg || pr.toast?.deleteError, "error"); }
  };

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center font-mono text-sm italic tracking-[0.4em]
      ${isLight ? "bg-[#f7f3ee] text-stone-400" : "bg-[#0c0b0a] text-amber-600"}`}>
      {pr.loading}
    </div>
  );

  const avatarSrc = selectedAvatar || AVATARS[0].url;
  const joinDate  = new Date(user?.createdAt).toLocaleDateString(
    language === "en" ? "en-US" : language === "fr" ? "fr-FR" : language === "it" ? "it-IT" : "es-ES",
    { month: "long", year: "numeric" }
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className={`min-h-screen font-mono transition-colors duration-500 ${isLight ? "bg-[#f7f3ee]" : "bg-[#0c0b0a]"}`}>
      <Toast isVisible={toast.show} message={toast.msg} type={toast.type}
        onClose={() => setToast(t => ({ ...t, show: false }))} />

      <div className="max-w-5xl mx-auto px-4 py-8 pb-20">

        <button onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-[11px] uppercase tracking-widest mb-8 transition-colors
            ${isLight ? "text-stone-400 hover:text-stone-700" : "text-stone-600 hover:text-stone-300"}`}>
          ← {pr.back}
        </button>

        <div className={`flex flex-col md:flex-row rounded-2xl overflow-hidden border
          ${isLight ? "border-stone-200" : "border-[#2a2520]"}`}>

          {/* ── PANEL IZQUIERDO ── */}
          <div className={`md:w-56 shrink-0 flex flex-col p-6 md:border-r
            ${isLight ? "bg-[#f0ebe3] border-stone-200" : "bg-[#0f0e0c] border-[#2a2520]"}`}>
            <div className="w-9 h-[3px] bg-amber-600 mb-6" />

            <div className="relative w-28 h-28 mb-5 cursor-pointer" onClick={() => setShowAvatarPicker(true)}>
              <img src={avatarSrc} alt="avatar" className="w-full h-full rounded-full object-cover border-2 border-amber-600/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
                <Pencil size={11} className="text-black" />
              </div>
            </div>

            <p className={`text-xl font-black italic uppercase tracking-tight leading-tight mb-1
              ${isLight ? "text-stone-900" : "text-[#f5e6c8]"}`}>
              {user?.username}
            </p>
            {user?.bio && (
              <p className={`text-sm leading-relaxed mb-6 ${isLight ? "text-stone-500" : "text-stone-500"}`}>
                {user.bio}
              </p>
            )}

            <div className={`mt-auto pt-5 border-t flex flex-col gap-4 ${isLight ? "border-stone-200" : "border-[#2a2520]"}`}>
              <div>
                <p className="text-2xl font-black text-amber-600">{myFavAnimals.length}</p>
                <p className={`text-[12px] tracking-[0.16em] uppercase mt-0.5 ${isLight ? "text-stone-400" : "text-stone-600"}`}>
                  {pr.section?.favorites}
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-600">{user?.history?.length || 0}</p>
                <p className={`text-[12px] tracking-[0.16em] uppercase mt-0.5 ${isLight ? "text-stone-400" : "text-stone-600"}`}>
                  {pr.section?.visited || "Visitadas"}
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-600">{user?.notes?.length || 0}</p>
                <p className={`text-[12px] tracking-[0.16em] uppercase mt-0.5 ${isLight ? "text-stone-400" : "text-stone-600"}`}>
                  {pr.section?.notes || "Notas"}
                </p>
              </div>
              <p className={`text-[12px] tracking-[0.1em] uppercase leading-relaxed ${isLight ? "text-stone-400" : "text-stone-600"}`}>
                {pr.memberSince}<br />{joinDate}
              </p>
            </div>
          </div>

          {/* ── PANEL DERECHO ── */}
          <div className={`flex-1 p-6 md:p-8 ${isLight ? "bg-white" : "bg-[#131211]"}`}>

            {/* Perfil */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label={pr.field?.username} value={username} onChange={setUsername} placeholder={pr.field?.usernamePlaceholder} isLight={isLight} />
              <Field label={pr.field?.email}    value={email}    onChange={setEmail}    placeholder="tu@email.com" isLight={isLight} />
            </div>
            <div className="mb-4">
              <Field label={pr.field?.bio} value={bio} onChange={setBio} placeholder={pr.field?.bioPlaceholder} isLight={isLight} maxLength={300} />
            </div>
            <button onClick={handleSaveProfile}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] tracking-[0.16em] uppercase font-black rounded-xl transition-all">
              {pr.saveChanges}
            </button>

            {/* Contraseña */}
            <Divider label={pr.section?.changePassword} isLight={isLight} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label={pr.field?.currentPassword} value={currentPass} onChange={setCurrentPass} type="password" placeholder={pr.field?.passwordPlaceholder} isLight={isLight} />
              <Field label={pr.field?.newPassword}     value={newPass}     onChange={setNewPass}     type="password" placeholder={pr.field?.passwordPlaceholder} isLight={isLight} />
              <Field label={pr.field?.confirmPassword} value={confirmPass} onChange={setConfirmPass} type="password" placeholder={pr.field?.passwordPlaceholder} isLight={isLight} />
            </div>
            <button onClick={handleChangePassword}
              className={`w-full py-3.5 text-[11px] tracking-[0.16em] uppercase font-black rounded-xl transition-all border-2
                ${isLight ? "border-stone-200 text-stone-600 hover:border-amber-500 hover:text-amber-600"
                          : "border-[#2a2520] text-stone-400 hover:border-amber-600 hover:text-amber-500"}`}>
              {pr.updatePassword}
            </button>

            {/* Idioma */}
            <Divider label={pr.section?.language} isLight={isLight} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { code: "es", label: "Español",  active: "bg-red-600 text-white border-red-600"         },
                { code: "en", label: "English",  active: "bg-stone-100 text-stone-900 border-stone-300" },
                { code: "fr", label: "Français", active: "bg-blue-700 text-white border-blue-700"       },
                { code: "it", label: "Italiano", active: "bg-emerald-600 text-white border-emerald-600" },
              ].map(({ code, label, active }) => (
                <button key={code} onClick={() => setLanguage(code)}
                  className={`py-3 text-[11px] tracking-[0.1em] uppercase font-black rounded-xl border-2 transition-all
                    ${language === code ? active
                      : isLight ? "border-stone-200 text-stone-500 hover:border-stone-400"
                                : "border-[#2a2520] text-stone-600 hover:border-stone-500"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── Estadísticas ── */}
            <Divider label={pr.section?.stats || "Estadísticas"} isLight={isLight} />
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={14} className="text-amber-600" />
              <span className={`font-mono text-[12px] uppercase tracking-widest font-bold ${isLight ? "text-stone-500" : "text-[#6b5e4e]"}`}>
                {pr.section?.statsSubtitle || "Tu actividad en el archivo"}
              </span>
            </div>
            <StatsSection user={user} favAnimals={myFavAnimals} isLight={isLight} pr={pr} />

            {/* ── Historial ── */}
            <Divider label={pr.section?.history || "Historial de visitados"} isLight={isLight} />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-amber-600" />
                <span className={`font-mono text-[12px] uppercase tracking-widest font-bold ${isLight ? "text-stone-500" : "text-[#6b5e4e]"}`}>
                  {pr.section?.historySubtitle || "Últimas fichas visitadas"}
                </span>
              </div>
              {user?.history?.length > 0 && (
                <span className={`font-mono text-[11px] ${isLight ? "text-stone-400" : "text-[#4a3f32]"}`}>
                  {user.history.length} / 50
                </span>
              )}
            </div>
            <HistorySection history={user?.history || []} isLight={isLight} pr={pr} />

            {/* ── Zona de peligro ── */}
            <Divider label={pr.section?.dangerZone} isLight={isLight} />
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border-l-4 border-red-500
              ${isLight ? "bg-red-50" : "bg-red-950/10"}`}>
              <p className={`text-sm leading-relaxed ${isLight ? "text-stone-600" : "text-stone-400"}`}>
                {pr.dangerDesc}
              </p>
              <button onClick={() => setShowDeleteModal(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-red-500/40 text-red-500 text-[11px] tracking-[0.12em] uppercase font-black bg-red-500/10 hover:bg-red-500/20 transition-all">
                <Trash2 size={14} /> {pr.deleteAccount}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal avatar ── */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => { setShowAvatarPicker(false); handleCancelUpload(); }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-lg rounded-2xl border overflow-hidden ${isLight ? "bg-white border-stone-200" : "bg-[#131211] border-[#2a2520]"}`}>
              <div className={`px-5 py-4 flex items-center justify-between border-b ${isLight ? "border-stone-100" : "border-[#2a2520]"}`}>
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-500">{pr.chooseAvatar}</span>
                <button onClick={() => { setShowAvatarPicker(false); handleCancelUpload(); }} className="text-stone-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-5">
                <div>
                  <p className={`text-[10px] tracking-[0.2em] uppercase mb-3 font-bold ${isLight ? "text-stone-400" : "text-stone-600"}`}>Tu foto</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {uploadPreview ? (
                    <div className="flex items-center gap-4">
                      <img src={uploadPreview} alt="preview" className="w-16 h-16 rounded-full object-cover border-2 border-amber-500" />
                      <div className="flex flex-col gap-2 flex-1">
                        <p className={`text-xs ${isLight ? "text-stone-500" : "text-stone-400"}`}>Vista previa — ¿usar esta foto?</p>
                        <div className="flex gap-2">
                          <button onClick={handleConfirmUpload}
                            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] uppercase tracking-widest font-black rounded-lg transition-all">
                            <Check size={12} /> Usar
                          </button>
                          <button onClick={handleCancelUpload}
                            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-widest font-black rounded-lg border transition-all
                              ${isLight ? "border-stone-200 text-stone-500" : "border-[#2a2520] text-stone-500"}`}>
                            <X size={12} /> Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()}
                      className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed transition-all
                        ${isLight ? "border-stone-200 text-stone-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50"
                                  : "border-[#2a2520] text-stone-600 hover:border-amber-600/50 hover:text-amber-500 hover:bg-amber-600/5"}`}>
                      <ImagePlus size={18} />
                      <span className="text-[11px] uppercase tracking-[0.15em] font-bold">Subir imagen · máx. 3 MB</span>
                    </button>
                  )}
                  {uploadError && <p className="text-[11px] text-red-500 font-mono mt-2">{uploadError}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 h-px ${isLight ? "bg-stone-100" : "bg-white/5"}`} />
                  <span className={`text-[10px] tracking-[0.2em] uppercase ${isLight ? "text-stone-300" : "text-stone-700"}`}>o elige uno</span>
                  <div className={`flex-1 h-px ${isLight ? "bg-stone-100" : "bg-white/5"}`} />
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {AVATARS.map(av => (
                    <button key={av.id} onClick={() => { setSelectedAvatar(av.url); setUploadPreview(null); setShowAvatarPicker(false); }}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all
                        ${selectedAvatar === av.url ? "border-amber-500 scale-95" : "border-transparent hover:border-amber-500/40"}`}>
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                      {selectedAvatar === av.url && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <Check size={20} className="text-amber-500" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                        <p className="text-[8px] font-mono text-white text-center truncate">{av.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal borrar cuenta ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl border overflow-hidden ${isLight ? "bg-white border-stone-200" : "bg-[#131211] border-[#2a2520]"}`}>
              <div className="px-5 py-4 bg-red-600/10 border-b border-red-600/20 flex items-center gap-3">
                <AlertTriangle size={15} className="text-red-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-red-500">{pr.deleteModal?.title}</span>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <p className={`text-sm leading-relaxed ${isLight ? "text-stone-600" : "text-stone-400"}`}>
                  {pr.deleteModal?.warning} <span className="font-mono font-bold text-red-500">{user?.username}</span> {pr.deleteModal?.warningEnd}
                </p>
                <Field label={pr.deleteModal?.writeUsername} value={deleteConfirmText} onChange={setDeleteConfirmText} placeholder={user?.username} isLight={isLight} />
                <Field label={pr.deleteModal?.writePassword} value={deletePass} onChange={setDeletePass} type="password" placeholder={pr.field?.passwordPlaceholder} isLight={isLight} />
                <div className="flex gap-3 mt-1">
                  <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== user?.username}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all">
                    {pr.deleteModal?.confirm}
                  </button>
                  <button onClick={() => { setShowDeleteModal(false); setDeletePass(""); setDeleteConfirmText(""); }}
                    className={`flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all border-2
                      ${isLight ? "border-stone-200 text-stone-600" : "border-[#2a2520] text-stone-400"}`}>
                    {pr.deleteModal?.cancel}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfilePage;
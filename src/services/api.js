// API_BASE_URL — usa ruta relativa para que Vite proxy enrute al backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper para hacer requests autenticadas
export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = 'Error en la solicitud';
    try { errMsg = (await response.json()).error || errMsg; } catch {}
    throw new Error(errMsg);
  }

  return response.json();
};

// Rutas de autenticación
export const authAPI = {
  register: (data) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchAPI('/auth/me'),

  forgotPassword: (email) =>
    fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, nuevaContraseña) =>
    fetchAPI('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, nuevaContraseña }),
    }),
};

// Rutas de reservas
export const reservasAPI = {
  async crearReserva(data, token) {
    const res = await fetch(`${API_BASE_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error al crear reserva');
    return res.json();
  },

  async cancelarReserva(id, token) {
    const res = await fetch(`${API_BASE_URL}/reservas/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error al cancelar reserva');
    return res.json();
  },

  async editarReserva(id, data, token) {
    const res = await fetch(`${API_BASE_URL}/reservas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error al editar reserva');
    return res.json();
  },

  async enviarWhatsApp(id, token) {
    const res = await fetch(`${API_BASE_URL}/reservas/${id}/whatsapp`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error al enviar WhatsApp');
    return res.json();
  },

  getAll: () => fetchAPI('/reservas'),
  
  getById: (id) => fetchAPI(`/reservas/${id}`),
  
  create: (data) =>
    fetchAPI('/reservas', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    fetchAPI(`/reservas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    fetchAPI(`/reservas/${id}`, {
      method: 'DELETE',
    }),
};

// Rutas de usuarios
export const usuariosAPI = {
  getAll: () => fetchAPI('/usuarios'),

  create: (data) =>
    fetchAPI('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    fetchAPI(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  getPerfil: () => fetchAPI('/usuarios/perfil/actual'),
  
  updatePerfil: (data) =>
    fetchAPI('/usuarios/perfil/actual', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  getConfig: (userId) => fetchAPI(`/usuarios/config/${userId}`),
  
  updateConfig: (userId, data) =>
    fetchAPI(`/usuarios/config/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  toggleActivo: (id, activo) =>
    fetchAPI(`/usuarios/${id}/activo`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    }),

  delete: (id) =>
    fetchAPI(`/usuarios/${id}`, {
      method: 'DELETE',
    }),
};

// Rutas de correos
export const correosAPI = {
  estado: () => fetchAPI('/correos/estado'),

  prueba: (email) =>
    fetchAPI('/correos/prueba', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  async reenviar(id, token) {
    const res = await fetch(`${API_BASE_URL}/reservas/${id}/email`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error al reenviar correo');
    return res.json();
  },
};

// Rutas públicas de reserva (sin autenticación — para el enlace del huésped)
export const reservaPublicaAPI = {
  async getByToken(token) {
    const res = await fetch(`${API_BASE_URL}/reservas/publica/${token}`);
    if (!res.ok) throw new Error((await res.json()).error || 'Enlace no válido');
    return res.json();
  },

  async completar(token, data) {
    const res = await fetch(`${API_BASE_URL}/reservas/publica/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error al guardar los datos');
    return res.json();
  },

  async disponibilidadGeneral() {
    const res = await fetch(`${API_BASE_URL}/reservas/publica/disponibilidad-general`);
    if (!res.ok) {
      let msg = 'Error al consultar disponibilidad';
      try { msg = (await res.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  async crearPublica(data) {
    const res = await fetch(`${API_BASE_URL}/reservas/publica`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let msg = 'Error al registrar la solicitud. Verifica tu conexión e intenta de nuevo.';
      try { msg = (await res.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  },
};

// Rutas de servicios adicionales
export const serviciosAPI = {
  getAll: () =>
    fetch(`${API_BASE_URL}/servicios-adicionales`)
      .then((r) => r.json()),

  create: (nombre, precio) =>
    fetchAPI('/servicios-adicionales', {
      method: 'POST',
      body: JSON.stringify({ nombre, precio }),
    }),

  update: (id, precio) =>
    fetchAPI(`/servicios-adicionales/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ precio }),
    }),

  remove: (id) =>
    fetchAPI(`/servicios-adicionales/${id}`, {
      method: 'DELETE',
    }),
};

// Rutas de alojamientos
export const alojamientosAPI = {
  getAll: () => fetchAPI('/alojamientos'),
  
  getById: (id) => fetchAPI(`/alojamientos/${id}`),
  
  create: (data) =>
    fetchAPI('/alojamientos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id, data) =>
    fetchAPI(`/alojamientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id) =>
    fetchAPI(`/alojamientos/${id}`, {
      method: 'DELETE',
    }),
};

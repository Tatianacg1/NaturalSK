// API_BASE_URL - Cambia según tu ambiente
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    const error = await response.json();
    throw new Error(error.error || 'Error en la solicitud');
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
  
  delete: (id) =>
    fetchAPI(`/usuarios/${id}`, {
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

import api from './authService';

export interface ReservaPorDia {
  dia_semana: string;
  dia_numero: number;
  total_reservas: number;
  porcentaje_ocupacion: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
}

export interface AsistenciaData {
  reservas_confirmadas: number;
  no_show: number;
  canceladas: number;
  porcentaje_asistencia: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
}

export interface PreferenciaAlimenticia {
  restriccion: string;
  cantidad_usuarios: number;
  porcentaje: number;
}

export interface ConsumoPorTipo {
  tipo: 'interno' | 'externo';
  total_consumos: number;
  costo_estimado: number;
}

export interface TopUsuario {
  usuario: string;
  total_reservas: number;
  porcentaje_uso: number;
  semaforo: 'verde' | 'amarillo' | 'rojo';
}

export interface AsistenciaTemporada {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  estadisticas: {
    confirmadas: number;
    no_show: number;
    canceladas: number;
    total: number;
    porcentaje_asistencia: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  };
  meses: Array<{
    anio: number;
    mes: number;
    nombre_mes: string;
    confirmadas: number;
    no_show: number;
    canceladas: number;
    porcentaje: number;
  }>;
}

export interface AsistenciaMes {
  mes: {
    anio: number;
    mes: number;
    tipo_empleado: string;
  };
  estadisticas: {
    confirmadas: number;
    no_show: number;
    canceladas: number;
    porcentaje_asistencia: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  };
  dias: Array<{
    fecha: string;
    dia_semana: string;
    confirmadas: number;
    no_show: number;
    canceladas: number;
    porcentaje: number;
  }>;
}

export interface AsistenciaDia {
  fecha: string;
  tipo_empleado: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  reservas: Array<{
    nombre_completo: string;
    fecha_reservada: string;
    estado_reserva: string;
    tipo_empleado: string;
    turno: string;
    codigo_qr: string;
  }>;
}
export interface PreferenciasTemporada {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  preferencias: Array<{
    restriccion: string;
    total_selecciones: number;
    porcentaje: number;
  }>;
  meses: Array<{
    anio: number;
    mes: number;
    nombre_mes: string;
  }>;
}

export interface PreferenciasMes {
  mes: {
    anio: number;
    mes: number;
    nombre_mes: string;
  };
  preferencias: Array<{
    restriccion: string;
    total_selecciones: number;
    porcentaje: number;
  }>;
  dias: Array<{
    fecha: string;
    dia_semana: string;
  }>;
}

export interface PreferenciasDia {
  fecha: string;
  dia_semana: string;
  total_comidas: number;
  preferencias: Array<{
    restriccion: string;
    total_selecciones: number;
    porcentaje: number;
  }>;
  ranking_entradas: Array<{
    plato: string;
    total_pedidos: number;
    porcentaje: number;
  }>;
  ranking_principales: Array<{
    plato: string;
    total_pedidos: number;
    porcentaje: number;
  }>;
  ranking_postres: Array<{
    plato: string;
    total_pedidos: number;
    porcentaje: number;
  }>;
  ranking_bebidas: Array<{
    plato: string;
    total_pedidos: number;
    porcentaje: number;
  }>;
}

export interface ConsumoTipoTemporada {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  consumo: Array<{
    tipo_empleado: string;
    total_reservas: number;
    porcentaje: number;
  }>;
  meses: Array<{
    anio: number;
    mes: number;
    nombre_mes: string;
  }>;
}

export interface ConsumoTipoMes {
  mes: {
    anio: number;
    mes: number;
    nombre_mes: string;
  };
  consumo: Array<{
    tipo_empleado: string;
    total_reservas: number;
    porcentaje: number;
  }>;
  dias: Array<{
    fecha: string;
    dia_semana: string;
  }>;
}

export interface ConsumoTipoDia {
  fecha: string;
  dia_semana: string;
  consumo: Array<{
    tipo_empleado: string;
    total_reservas: number;
    porcentaje: number;
  }>;
  detalle_comidas: Array<{
    nombre_usuario: string;
    tipo_empleado: string;
    entrada: string;
    plato_principal: string;
    postre: string;
    bebida: string;
    restricciones: string;
  }>;
}

export interface ReservasPorDiaTemporada {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  capacidad_maxima: number;
  dias_semana: Array<{
    dia_semana: string;
    dia_numero: number;
    total_reservas: number;
    promedio_reservas: number;
    porcentaje_ocupacion: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  }>;
}

export interface ReservasPorDiaDetalle {
  temporada: {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  dia_semana: string;
  capacidad_maxima: number;
  fechas: Array<{
    fecha: string;
    total_reservas: number;
    porcentaje_ocupacion: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  }>;
}

export interface ReservasFechaDetalle {
  fecha: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  reservas: Array<{
    nombre_completo: string;
    tipo_empleado: string;
    turno: string;
    entrada: string | null;
    plato_principal: string;
    postre: string | null;
    bebida: string;
    codigo_qr: string;
  }>;
}

export interface ConsumoPorUsuario {
  filtro: {
    mes: number | null;
    anio: number | null;
    fecha: string | null;
    fecha_inicio: string;
    fecha_fin: string;
    dias_disponibles: number;
  };
  usuarios: Array<{
    id: number;
    nombre_completo: string;
    tipo_empleado: 'interno' | 'externo';
    total_reservas: number;
    porcentaje_consumo: number;
  }>;
}

export const metricsService = {
  async getReservasPorDia(): Promise<ReservaPorDia[]> {
    const response = await api.get('/metrics/reservas-por-dia');
    return response.data;
  },

  async getAsistencia(): Promise<AsistenciaData> {
    const response = await api.get('/metrics/asistencia');
    return response.data;
  },

  async getPreferencias(): Promise<PreferenciaAlimenticia[]> {
    const response = await api.get('/metrics/preferencias');
    return response.data;
  },

  async getConsumoPorTipo(): Promise<ConsumoPorTipo[]> {
    const response = await api.get('/metrics/consumo-tipo');
    return response.data;
  },

  async getTopUsuarios(): Promise<TopUsuario[]> {
    const response = await api.get('/metrics/top-usuarios');
    return response.data;
  },

  async getDetalleAsistencia(fecha?: string, tipo_empleado?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (fecha) params.append('fecha', fecha);
    if (tipo_empleado && tipo_empleado !== 'todos') params.append('tipo_empleado', tipo_empleado);
    const response = await api.get(`/metrics/detalle-asistencia?${params.toString()}`);
    return response.data;
  },

  async getAsistenciaTemporada(id_temporada?: number, tipo_empleado: string = 'todos'): Promise<AsistenciaTemporada> {
    const queryParams = new URLSearchParams();
    if (id_temporada) queryParams.append('id_temporada', id_temporada.toString());
    if (tipo_empleado) queryParams.append('tipo_empleado', tipo_empleado);
    const params = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`/metrics/asistencia/temporada${params}`);
    return response.data;
  },

  async getAsistenciaMes(anio: number, mes: number, tipo_empleado: string = 'todos'): Promise<AsistenciaMes> {
    const response = await api.get('/metrics/asistencia/mes', {
      params: { anio, mes, tipo_empleado }
    });
    return response.data;
  },

  async getAsistenciaDia(fecha: string, tipo_empleado: string = 'todos', estados: string = 'confirmada,noshow,cancelada', page: number = 1, limit: number = 25): Promise<AsistenciaDia> {
    const response = await api.get('/metrics/asistencia/dia', {
      params: { fecha, tipo_empleado, estados, page, limit }
    });
    return response.data;
  },

  async exportarAsistencia(fecha: string, tipo_empleado: string = 'todos', formato: 'csv' | 'excel' = 'csv') {
    const response = await api.get('/metrics/asistencia/exportar', {
      params: { fecha, tipo_empleado, formato },
      responseType: formato === 'csv' ? 'blob' : 'json'
    });
    
    if (formato === 'csv') {
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `asistencia_${fecha}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    
    return response.data;
  },
  async getReservasPorDiaTemporada(id_temporada?: number): Promise<ReservasPorDiaTemporada> {
    const params = id_temporada ? `?id_temporada=${id_temporada}` : '';
    const response = await api.get(`/metrics/reservas-por-dia/temporada${params}`);
    return response.data;
  },

  async getReservasPorDiaDetalle(dia_semana: string): Promise<ReservasPorDiaDetalle> {
    const response = await api.get('/metrics/reservas-por-dia/detalle', {
      params: { dia_semana }
    });
    return response.data;
  },

  async getReservasFechaEspecifica(fecha: string, page: number = 1, limit: number = 25): Promise<ReservasFechaDetalle> {
    const response = await api.get('/metrics/reservas-por-dia/fecha', {
      params: { fecha, page, limit }
    });
    return response.data;
  },

  async getPreferenciasTemporada(id_temporada?: number): Promise<PreferenciasTemporada> {
    const params = id_temporada ? `?id_temporada=${id_temporada}` : '';
    const response = await api.get(`/metrics/preferencias/temporada${params}`);
    return response.data;
  },

  async getPreferenciasMes(anio: number, mes: number): Promise<PreferenciasMes> {
    const response = await api.get('/metrics/preferencias/mes', {
      params: { anio, mes }
    });
    return response.data;
  },

  async getPreferenciasDia(fecha: string): Promise<PreferenciasDia> {
    const response = await api.get('/metrics/preferencias/dia', {
      params: { fecha }
    });
    return response.data;
  },

  async getConsumoTipoTemporada(id_temporada?: number): Promise<ConsumoTipoTemporada> {
    const params = id_temporada ? `?id_temporada=${id_temporada}` : '';
    const response = await api.get(`/metrics/consumo-tipo/temporada${params}`);
    return response.data;
  },

  async getConsumoTipoMes(anio: number, mes: number): Promise<ConsumoTipoMes> {
    const response = await api.get('/metrics/consumo-tipo/mes', {
      params: { anio, mes }
    });
    return response.data;
  },

  async getConsumoTipoDia(fecha: string): Promise<ConsumoTipoDia> {
    const response = await api.get('/metrics/consumo-tipo/dia', {
      params: { fecha }
    });
    return response.data;
  },

  async getConsumoPorUsuario(mes?: number, anio?: number, fecha?: string): Promise<ConsumoPorUsuario> {
    const params: any = {};
    if (fecha) {
        params.fecha = fecha;
  } 
    else if (mes && anio) {
        params.mes = mes;
        params.anio = anio;
  }
    const response = await api.get('/metrics/consumo-usuario', { params });
    return response.data;
    }
};
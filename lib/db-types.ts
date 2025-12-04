// lib/db-types.ts
// Tipos TypeScript alineados con el esquema de Supabase compartido

export interface UUIDBrand<T extends string> extends String { __brand: T }
export type UUID = string; // Mantener simple para RN; puedes refinar con branded types

// ---------- user_profiles ----------
export interface UserProfileRow {
  id: UUID;
  user_id: UUID;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  provider: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
  is_dj: boolean | null;
  foto_url?: string | null;
  descripcion?: string | null;
  telefono?: string | null;
  ciudad?: string | null;
}

// ---------- dj_profiles ----------
export type EstadoActivo = boolean;
export interface DJProfileRow {
  id: UUID;
  user_id: UUID;
  tarifa_por_hora: number;
  generos: string[]; // text[]
  ubicacion: string | null;
  anos_en_app: number | null;
  eventos_realizados: number | null;
  calificacion: number | null; // 0..5
  resenas_count: number | null;
  imagen_url: string | null;
  descripcion_largo: string | null;
  disponibilidad: any | null; // jsonb
  is_activo: EstadoActivo | null;
  cuenta_con_equipamiento: string | null; // 'Sí' | 'No' etc.
  equipamiento: string[] | null; // text[]
  created_at: string; // ISO
  updated_at: string; // ISO
}

// ---------- dj_gallery_images ----------
export interface DJGalleryImageRow {
  id: UUID;
  user_id: UUID;
  image_url: string;
  order: number; // columna quoted "order" en DB
  created_at: string; // ISO
  updated_at: string; // ISO
}

// ---------- messages ----------
export type ContentType = 'text' | 'proposal';
export interface MessageRow {
  id: UUID;
  sender_id: UUID;
  receiver_id: UUID;
  content: string;
  content_type: ContentType;
  metadata: any | null; // jsonb
  is_read: boolean;
  read_at: string | null;
  created_at: string; // ISO
  updated_at: string; // ISO
}

// ---------- message_notifications ----------
export interface MessageNotificationRow {
  id: UUID;
  sender_id: UUID;
  receiver_id: UUID;
  sender_name: string | null;
  sender_avatar: string | null;
  message_preview: string;
  message_id: UUID | null;
  is_read: boolean;
  created_at: string; // ISO
  updated_at: string; // ISO
}

// ---------- proposals ----------
export type ProposalEstado = 'pendiente' | 'aceptada' | 'rechazada' | 'contraoferta';
export interface ProposalRow {
  id: UUID;
  client_id: UUID;
  dj_id: UUID;
  monto: number;
  monto_contraoferta: number | null;
  horas_duracion: number; // numeric
  detalles: string | null;
  estado: ProposalEstado;
  estado_respuesta: string | null; // libre, p.ej. detalle textual
  fecha_evento: string | null; // date
  ubicacion_evento: string | null;
  generos_solicitados: string[] | null; // text[]
  ronda_contrapropuesta: number | null;
  created_at: string;
  updated_at: string;
  aceptada_at: string | null;
  completada_at: string | null;
}

// ---------- events ----------
export type EventEstado = 'confirmado' | 'cancelado' | 'completado' | string;
export interface EventRow {
  id: UUID;
  proposal_id: UUID;
  client_id: UUID;
  dj_id: UUID;
  monto_final: number;
  fecha: string; // date
  hora_inicio: string | null; // time
  hora_fin: string | null; // time
  ubicacion: string;
  generos_confirmados: string[] | null; // text[]
  descripcion: string | null;
  estado: EventEstado;
  calificacion_cliente: number | null;
  resena_cliente: string | null;
  calificacion_dj: number | null;
  resena_dj: string | null;
  comprobante_url: string | null;
  created_at: string;
  updated_at: string;
  cancelada_at: string | null;
  dj_confirmed_at: string | null;
  client_confirmed_at: string | null;
}

// ---------- reviews ----------
export interface ReviewRow {
  id: UUID;
  event_id: UUID;
  reviewer_id: UUID;
  reviewee_id: UUID;
  calificacion: number; // 0..5
  resena: string | null;
  aspectos: any | null; // jsonb
  created_at: string;
  updated_at: string;
}

// ---------- pagos (Kushki Mock) ----------
export interface PagoRow {
  id: UUID;
  token: string | null;
  monto: number | null;
  dj_id: UUID | null;
  client_id: UUID | null;
  event_id: UUID | null;
  proposal_id: UUID | null;
  estado: string | null; // 'EN_ESCROW', 'PAGADO', etc.
  es_mock: boolean | null;
  created_at: string;
}

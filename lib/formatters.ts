/**
 * Formatters para números y formatos chilenos
 */

/**
 * Formatea un número como moneda chilena (CLP)
 * @param monto - Número a formatear
 * @returns String con formato "$ XX.XXX.XXX"
 * @example formatCLP(50000) => "$ 50.000"
 */
export function formatCLP(monto: number): string {
  return `$ ${monto.toLocaleString('es-CL')}`;
}

/**
 * Formatea un número de teléfono chileno
 * @param phone - Teléfono (con o sin +56)
 * @returns String con formato "+56 9 XXXX XXXX"
 * @example formatPhone("987654321") => "+56 9 8765 4321"
 * @example formatPhone("+56987654321") => "+56 9 8765 4321"
 */
export function formatPhone(phone: string): string {
  // Remover todos los caracteres no numéricos excepto el +
  let cleaned = phone.replace(/\D/g, '');

  // Si no comienza con 56, agregar 56
  if (!cleaned.startsWith('56')) {
    cleaned = '56' + cleaned;
  }

  // Asegurar que tenga 11 dígitos (56 + 9 dígitos)
  if (cleaned.length !== 11) {
    return phone; // Retornar formato original si es inválido
  }

  // Formato: +56 9 XXXX XXXX
  return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 3)} ${cleaned.substring(3, 7)} ${cleaned.substring(7)}`;
}

/**
 * Valida si un teléfono chileno es válido
 * @param phone - Teléfono a validar
 * @returns boolean
 */
export function isValidChilePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Debe tener 9 dígitos (sin 56) o 11 (con 56)
  return cleaned.length === 9 || (cleaned.length === 11 && cleaned.startsWith('56'));
}

/**
 * Formatea una dirección chilena con región/ciudad
 * @param street - Calle
 * @param city - Ciudad
 * @param region - Región
 * @returns String formateado
 * @example formatAddress("Avenida Principal 123", "Santiago", "Metropolitana") 
 *          => "Avenida Principal 123, Santiago, Región Metropolitana"
 */
export function formatAddress(street: string, city: string, region: string): string {
  return `${street}, ${city}, ${region}`;
}

/**
 * Lista de regiones de Chile para selecciones
 */
export const REGIONES_CHILE = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  'Libertador General Bernardo O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
];

/**
 * Ciudades principales de Chile (muestra)
 */
export const CIUDADES_CHILE = [
  'Santiago',
  'Valparaíso',
  'Concepción',
  'La Serena',
  'Temuco',
  'Valdivia',
  'Puerto Montt',
  'Punta Arenas',
  'Los Ángeles',
  'Puerto Varas',
];

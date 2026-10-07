export const SIGNER_DOCUMENT_TYPES = ['cpf', 'cnpj', 'other'] as const
export type SignerDocumentType = (typeof SIGNER_DOCUMENT_TYPES)[number]

// Check digit shared by CPF and CNPJ: weighted sum mod 11. Each character
// counts as its char code minus 48, which keeps digits as-is and covers the
// alphanumeric CNPJ issued since July 2026.
function checkDigit(chars: string, weights: number[]) {
  const sum = weights.reduce(
    (acc, weight, i) => acc + (chars.charCodeAt(i) - 48) * weight,
    0,
  )
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

const CPF_WEIGHTS_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2]
const CPF_WEIGHTS_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_WEIGHTS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_WEIGHTS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

export function isValidCpf(value: string) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false
  return (
    checkDigit(value, CPF_WEIGHTS_1) === Number(value[9]) &&
    checkDigit(value, CPF_WEIGHTS_2) === Number(value[10])
  )
}

export function isValidCnpj(value: string) {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(value) || /^(\d)\1{13}$/.test(value)) {
    return false
  }
  return (
    checkDigit(value, CNPJ_WEIGHTS_1) === Number(value[12]) &&
    checkDigit(value, CNPJ_WEIGHTS_2) === Number(value[13])
  )
}

// What gets stored: CPF as 11 digits, CNPJ as 14 uppercase characters, any
// other document trimmed with inner whitespace collapsed.
export function normalizeDocument(type: SignerDocumentType, value: string) {
  if (type === 'cpf') return value.replace(/\D/g, '')
  if (type === 'cnpj') return value.toUpperCase().replace(/[^0-9A-Z]/g, '')
  return value.trim().replace(/\s+/g, ' ')
}

export function formatDocument(type: string | null, value: string | null) {
  if (!value) return ''
  if (type === 'cpf' && value.length === 11) {
    return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`
  }
  if (type === 'cnpj' && value.length === 14) {
    return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`
  }
  return value
}

// "CPF 529.982.247-25", "CNPJ 11.222.333/0001-81", or the foreign ID as-is.
export function documentLine(type: string | null, value: string | null) {
  const formatted = formatDocument(type, value)
  return type === 'cpf' || type === 'cnpj'
    ? `${type.toUpperCase()} ${formatted}`
    : formatted
}

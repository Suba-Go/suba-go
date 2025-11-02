export const statusCodes: { [key: string]: { [key: number]: string } } = {
  GetAccountErrors: {
    409: 'El número de celular ya está registrado',
  },
  ProfileUpdateErrors: {
    400: 'Error de validación en los datos del perfil',
    409: 'El email o RUT ya está en uso por otro usuario',
  },
  default: {
    400: 'Error de validación',
    401: 'No autorizado',
    403: 'Prohibido',
    404: 'No encontrado',
    409: 'Conflicto en el servidor',
    500: 'Error del servidor',
  },
};

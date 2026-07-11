export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
}

export interface Cliente {
  id: number;
  nombre: string;
  correo: string;
}

export interface Pedido {
  id: number;
  clienteId: number;
  productoId: number;
  cantidad: number;
  total: number;
}

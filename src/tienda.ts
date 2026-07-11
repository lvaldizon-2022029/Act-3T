import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import { Cliente, Pedido, Producto } from "./modelos";

export class Tienda {
  private productos: Producto[] = [];
  private clientes: Cliente[] = [];
  private pedidos: Pedido[] = [];

  public crearProducto(nombre: string, precio: number, stock: number): Producto {
    this.validarNombre(nombre, "producto");
    this.validarPrecio(precio);
    this.validarStock(stock);

    const producto: Producto = {
      id: this.generarId(this.productos),
      nombre: nombre.trim(),
      precio,
      stock,
    };

    this.productos.push(producto);
    return producto;
  }

  public obtenerProductos(): Producto[] {
    return [...this.productos];
  }

  public actualizarProducto(id: number, datos: Partial<Omit<Producto, "id">>): Producto {
    const producto = this.buscarPorId(this.productos, id, "producto");

    if (datos.nombre !== undefined) {
      this.validarNombre(datos.nombre, "producto");
      producto.nombre = datos.nombre.trim();
    }

    if (datos.precio !== undefined) {
      this.validarPrecio(datos.precio);
      producto.precio = datos.precio;
    }

    if (datos.stock !== undefined) {
      this.validarStock(datos.stock);
      producto.stock = datos.stock;
    }

    return producto;
  }

  public eliminarProducto(id: number): void {
    const tienePedidoAsociado = this.pedidos.some((pedido) => pedido.productoId === id);
    if (tienePedidoAsociado) {
      throw new Error("No se puede eliminar el producto porque tiene pedidos asociados");
    }

    this.eliminarPorId(this.productos, id, "producto");
  }

  public crearCliente(nombre: string, correo: string): Cliente {
    this.validarNombre(nombre, "cliente");
    this.validarCorreo(correo);

    const cliente: Cliente = {
      id: this.generarId(this.clientes),
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
    };

    this.clientes.push(cliente);
    return cliente;
  }

  public obtenerClientes(): Cliente[] {
    return [...this.clientes];
  }

  public actualizarCliente(id: number, datos: Partial<Omit<Cliente, "id">>): Cliente {
    const cliente = this.buscarPorId(this.clientes, id, "cliente");

    if (datos.nombre !== undefined) {
      this.validarNombre(datos.nombre, "cliente");
      cliente.nombre = datos.nombre.trim();
    }

    if (datos.correo !== undefined) {
      this.validarCorreo(datos.correo, cliente.id);
      cliente.correo = datos.correo.trim().toLowerCase();
    }

    return cliente;
  }

  public eliminarCliente(id: number): void {
    const tienePedidoAsociado = this.pedidos.some((pedido) => pedido.clienteId === id);
    if (tienePedidoAsociado) {
      throw new Error("No se puede eliminar el cliente porque tiene pedidos asociados");
    }

    this.eliminarPorId(this.clientes, id, "cliente");
  }

  public crearPedido(clienteId: number, productoId: number, cantidad: number): Pedido {
    this.validarCantidad(cantidad);

    const cliente = this.buscarPorId(this.clientes, clienteId, "cliente");
    const producto = this.buscarPorId(this.productos, productoId, "producto");

    if (producto.stock < cantidad) {
      throw new Error("No hay stock suficiente para crear el pedido");
    }

    producto.stock -= cantidad;

    const pedido: Pedido = {
      id: this.generarId(this.pedidos),
      clienteId: cliente.id,
      productoId: producto.id,
      cantidad,
      total: producto.precio * cantidad,
    };

    this.pedidos.push(pedido);
    return pedido;
  }

  public obtenerPedidos(): Pedido[] {
    return [...this.pedidos];
  }

  public actualizarPedido(id: number, datos: Partial<Omit<Pedido, "id" | "total">>): Pedido {
    const pedido = this.buscarPorId(this.pedidos, id, "pedido");
    const productoAnterior = this.buscarPorId(this.productos, pedido.productoId, "producto");

    productoAnterior.stock += pedido.cantidad;

    const clienteId = datos.clienteId ?? pedido.clienteId;
    const productoId = datos.productoId ?? pedido.productoId;
    const cantidad = datos.cantidad ?? pedido.cantidad;

    this.validarCantidad(cantidad);

    const cliente = this.buscarPorId(this.clientes, clienteId, "cliente");
    const producto = this.buscarPorId(this.productos, productoId, "producto");

    if (producto.stock < cantidad) {
      productoAnterior.stock -= pedido.cantidad;
      throw new Error("No hay stock suficiente para actualizar el pedido");
    }

    producto.stock -= cantidad;

    pedido.clienteId = cliente.id;
    pedido.productoId = producto.id;
    pedido.cantidad = cantidad;
    pedido.total = producto.precio * cantidad;

    return pedido;
  }

  public eliminarPedido(id: number): void {
    const pedido = this.buscarPorId(this.pedidos, id, "pedido");
    const producto = this.buscarPorId(this.productos, pedido.productoId, "producto");

    producto.stock += pedido.cantidad;
    this.eliminarPorId(this.pedidos, id, "pedido");
  }

  public guardarEnJson(rutaArchivo: string): Promise<void> {
    const contenido = JSON.stringify(
      {
        productos: this.productos,
        clientes: this.clientes,
        pedidos: this.pedidos,
      },
      null,
      2,
    );

    return dirname(rutaArchivo)
      ? fs.mkdir(dirname(rutaArchivo), { recursive: true }).then(() => fs.writeFile(rutaArchivo, contenido, "utf-8"))
      : fs.writeFile(rutaArchivo, contenido, "utf-8");
  }

  private validarNombre(nombre: string, tipo: string): void {
    if (nombre.trim().length < 2) {
      throw new Error(`El nombre del ${tipo} debe tener al menos 2 caracteres`);
    }
  }

  private validarPrecio(precio: number): void {
    if (!Number.isFinite(precio) || precio <= 0) {
      throw new Error("El precio debe ser un número mayor que 0");
    }
  }

  private validarStock(stock: number): void {
    if (!Number.isInteger(stock) || stock < 0) {
      throw new Error("El stock debe ser un número entero mayor o igual a 0");
    }
  }

  private validarCantidad(cantidad: number): void {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new Error("La cantidad debe ser un número entero mayor que 0");
    }
  }

  private validarCorreo(correo: string, clienteIdExcluido?: number): void {
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!patronCorreo.test(correo.trim())) {
      throw new Error("El correo no tiene un formato válido");
    }

    const correoNormalizado = correo.trim().toLowerCase();
    const existe = this.clientes.some((cliente) => cliente.correo === correoNormalizado && cliente.id !== clienteIdExcluido);
    if (existe) {
      throw new Error("Ya existe un cliente con ese correo");
    }
  }

  private generarId<T extends { id: number }>(coleccion: T[]): number {
    return coleccion.length === 0 ? 1 : Math.max(...coleccion.map((item) => item.id)) + 1;
  }

  private buscarPorId<T extends { id: number }>(coleccion: T[], id: number, tipo: string): T {
    const encontrado = coleccion.find((item) => item.id === id);
    if (!encontrado) {
      throw new Error(`No existe ${tipo} con id ${id}`);
    }
    return encontrado;
  }

  private eliminarPorId<T extends { id: number }>(coleccion: T[], id: number, tipo: string): void {
    const indice = coleccion.findIndex((item) => item.id === id);
    if (indice < 0) {
      throw new Error(`No existe ${tipo} con id ${id}`);
    }

    coleccion.splice(indice, 1);
  }
}

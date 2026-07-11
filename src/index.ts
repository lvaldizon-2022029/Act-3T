import { Tienda } from "./tienda";

async function ejecutar(): Promise<void> {
  const tienda = new Tienda();

  const producto = tienda.crearProducto("Laptop", 3500, 10);
  const cliente = tienda.crearCliente("Ana López", "ana@correo.com");

  tienda.crearPedido(cliente.id, producto.id, 2);
  tienda.actualizarProducto(producto.id, { precio: 3400 });
  tienda.actualizarCliente(cliente.id, { nombre: "Ana María López" });

  await tienda.guardarEnJson("datos/tienda.json");
}

ejecutar().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
    return;
  }

  console.error("Error desconocido");
});

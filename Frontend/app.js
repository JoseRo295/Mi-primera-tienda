const API_URL = "http://127.0.0.1:8000/productos/";

const listaProductos = document.getElementById("lista_productos");
const mensajeCatalogo = document.getElementById("mensaje_catalogo");
const formularioProducto = document.getElementById("formulario_producto");
const mensajeRegistro = document.getElementById("mensaje_registro");
const formularioBusqueda = document.getElementById("formulario_busqueda");
const campoBuscar = document.getElementById("buscar_id");
const botonTodos = document.getElementById("boton_todos");
const tituloFormulario = document.getElementById("titulo_formulario");
const botonGuardar = document.getElementById("boton_guardar");
const botonCancelar = document.getElementById("boton_cancelar");

let productoEditando = null;

function mostrarMensaje(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = "mensaje " + tipo;
}

function crearTarjeta(producto, conBotones) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta_producto";

  const id = document.createElement("span");
  id.className = "id_producto";
  id.textContent = "ID: " + producto.id;

  const nombre = document.createElement("h3");
  nombre.className = "nombre_producto";
  nombre.textContent = producto.nombre;

  const descripcion = document.createElement("p");
  descripcion.className = "descripcion_producto";
  descripcion.textContent = producto.descripcion;

  const precio = document.createElement("p");
  precio.className = "precio_producto";
  precio.textContent = "$" + producto.precio.toFixed(2);

  const stock = document.createElement("p");
  stock.className = "stock_producto";
  stock.textContent = "Stock: " + producto.stock;

  tarjeta.append(id, nombre, descripcion, precio, stock);

  if (conBotones) {
    const botones = document.createElement("div");
    botones.className = "botones_tarjeta";

    const botonEditar = document.createElement("button");
    botonEditar.className = "boton boton_editar";
    botonEditar.textContent = "Editar";
    botonEditar.addEventListener("click", () => editarProducto(producto));

    const botonEliminar = document.createElement("button");
    botonEliminar.className = "boton boton_eliminar";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.addEventListener("click", () => eliminarProducto(producto.id));

    botones.append(botonEditar, botonEliminar);
    tarjeta.append(botones);
  }

  return tarjeta;
}

function editarProducto(producto) {
  productoEditando = producto.id;
  document.getElementById("nombre").value = producto.nombre;
  document.getElementById("descripcion").value = producto.descripcion;
  document.getElementById("precio").value = producto.precio;
  document.getElementById("stock").value = producto.stock;

  tituloFormulario.textContent = "Editar producto (ID: " + producto.id + ")";
  botonGuardar.textContent = "Actualizar producto";
  botonCancelar.classList.remove("oculto");
  mostrarMensaje(mensajeRegistro, "", "");
  document.getElementById("registro").scrollIntoView();
}

function cancelarEdicion() {
  productoEditando = null;
  formularioProducto.reset();
  tituloFormulario.textContent = "Registrar producto";
  botonGuardar.textContent = "Guardar producto";
  botonCancelar.classList.add("oculto");
}

async function cargarProductos() {
  try {
    const respuesta = await fetch(API_URL);
    const productos = await respuesta.json();

    listaProductos.replaceChildren();

    if (productos.length === 0) {
      mostrarMensaje(mensajeCatalogo, "No hay productos registrados.", "");
      return;
    }

    mostrarMensaje(mensajeCatalogo, "", "");
    productos.forEach((producto) => {
      listaProductos.append(crearTarjeta(producto, true));
    });
  } catch (error) {
    mostrarMensaje(mensajeCatalogo, "No se pudo conectar con el servidor.", "error");
  }
}

async function guardarProducto(evento) {
  evento.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const precio = Number(document.getElementById("precio").value);
  const stock = Number(document.getElementById("stock").value);

  if (nombre === "" || descripcion === "") {
    mostrarMensaje(mensajeRegistro, "Completa el nombre y la descripción.", "error");
    return;
  }

  if (isNaN(precio) || precio <= 0) {
    mostrarMensaje(mensajeRegistro, "El precio debe ser un número mayor a 0.", "error");
    return;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    mostrarMensaje(mensajeRegistro, "El stock debe ser un número entero mayor o igual a 0.", "error");
    return;
  }

  const editando = productoEditando !== null;
  const url = editando ? API_URL + productoEditando : API_URL;
  const metodo = editando ? "PUT" : "POST";

  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, descripcion, precio, stock }),
    });

    if (!respuesta.ok) {
      mostrarMensaje(mensajeRegistro, "No se pudo guardar el producto.", "error");
      return;
    }

    cancelarEdicion();
    const texto = editando ? "Producto actualizado correctamente." : "Producto registrado correctamente.";
    mostrarMensaje(mensajeRegistro, texto, "exito");
    campoBuscar.value = "";
    cargarProductos();
  } catch (error) {
    mostrarMensaje(mensajeRegistro, "No se pudo conectar con el servidor.", "error");
  }
}

async function buscarProducto(evento) {
  evento.preventDefault();

  const id = Number(campoBuscar.value);

  if (!Number.isInteger(id) || id <= 0) {
    mostrarMensaje(mensajeCatalogo, "Ingresa un ID válido.", "error");
    return;
  }

  try {
    const respuesta = await fetch(API_URL + id);
    listaProductos.replaceChildren();

    if (respuesta.status === 404) {
      mostrarMensaje(mensajeCatalogo, "No existe un producto con el ID " + id + ".", "error");
      return;
    }

    const producto = await respuesta.json();
    mostrarMensaje(mensajeCatalogo, "", "");
    listaProductos.append(crearTarjeta(producto, true));
  } catch (error) {
    mostrarMensaje(mensajeCatalogo, "No se pudo conectar con el servidor.", "error");
  }
}

function verTodos() {
  campoBuscar.value = "";
  cargarProductos();
}

async function eliminarProducto(id) {
  if (!confirm("¿Deseas eliminar este producto?")) {
    return;
  }

  try {
    const respuesta = await fetch(API_URL + id, { method: "DELETE" });

    if (!respuesta.ok) {
      mostrarMensaje(mensajeCatalogo, "No se pudo eliminar el producto.", "error");
      return;
    }

    if (productoEditando === id) {
      cancelarEdicion();
    }

    campoBuscar.value = "";
    cargarProductos();
  } catch (error) {
    mostrarMensaje(mensajeCatalogo, "No se pudo conectar con el servidor.", "error");
  }
}

formularioProducto.addEventListener("submit", guardarProducto);
botonCancelar.addEventListener("click", cancelarEdicion);
botonTodos.addEventListener("click", verTodos);
formularioBusqueda.addEventListener("submit", buscarProducto);

cargarProductos();

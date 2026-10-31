from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, Session, select


class Producto(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str
    descripcion: str
    precio: float
    stock: int


class ProductoCreate(SQLModel):
    nombre: str = Field(min_length=1)
    descripcion: str = Field(min_length=1)
    precio: float = Field(gt=0)
    stock: int = Field(ge=0)


sqlite_url = "sqlite:///tienda.db"

engine = create_engine(sqlite_url, echo=True)


def create_tables():
    SQLModel.metadata.create_all(engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(title="Mi primera tienda virtual", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def inicio():
    return {"mensaje": "Mi primera tienda virtual"}


@app.post("/productos/", status_code=status.HTTP_201_CREATED, response_model=Producto)
def crear_producto(datos: ProductoCreate):
    producto = Producto(
        nombre=datos.nombre,
        descripcion=datos.descripcion,
        precio=datos.precio,
        stock=datos.stock,
    )
    with Session(engine) as session:
        session.add(producto)
        session.commit()
        session.refresh(producto)
        return producto


@app.get("/productos/", response_model=list[Producto])
def obtener_productos():
    with Session(engine) as session:
        return session.exec(select(Producto)).all()


@app.get("/productos/{producto_id}", response_model=Producto)
def obtener_producto(producto_id: int):
    with Session(engine) as session:
        producto = session.get(Producto, producto_id)
        if producto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        return producto


@app.put("/productos/{producto_id}", response_model=Producto)
def editar_producto(producto_id: int, datos: ProductoCreate):
    with Session(engine) as session:
        producto = session.get(Producto, producto_id)
        if producto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        producto.nombre = datos.nombre
        producto.descripcion = datos.descripcion
        producto.precio = datos.precio
        producto.stock = datos.stock
        session.add(producto)
        session.commit()
        session.refresh(producto)
        return producto


@app.delete("/productos/{producto_id}")
def eliminar_producto(producto_id: int):
    with Session(engine) as session:
        producto = session.get(Producto, producto_id)
        if producto is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
        session.delete(producto)
        session.commit()
        return {"mensaje": "Producto eliminado"}

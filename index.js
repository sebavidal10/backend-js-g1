const express = require('express');
const app = express();
const fs = require('fs');
const jwt = require('jsonwebtoken');

const {
  obtenerProducto,
  obtenerProductos,
  agregarProducto,
  actualizarProducto,
  borrarProducto,
} = require('./consultas');

// swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de productos',
      version: '1.0.0',
      description: 'Una API para manejar productos de tecnología',
    },
  },
  apis: ['./index.js'],
};

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(options)));

// Middleware de autenticación
const SECRET_KEY = process.env.SECRET_KEY || '123456';
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.log('Token no proporcionado');
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.log('Error de verificación de token:', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    console.log('Token verificado para el usuario:', user.username);
    next();
  });
}

const port = process.env.DEFAULT_PORT || 3000;
app.listen(port, console.log('Servidor onfayer'));

/**
 * @openapi
 * /:
 *  get:
 *   description: Saludo de bienvenida
 *   responses:
 *    '200':
 *     description: Saludo
 */

app.get('/', (req, res) => {
  res.send('Hola!');
});

app.get('/products', async (req, res) => {
  const products = await obtenerProductos();
  res.json(products);
});

app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  const resultado = await obtenerProducto(id);
  res.json(resultado);
});

app.post('/products', async (req, res) => {
  const { nombre, marca, categoria, precio, stock, descripcion } = req.body;
  try {
    await agregarProducto(nombre, marca, categoria, precio, stock, descripcion);
  } catch (error) {
    // console.error('Hubo un problema al agregar el producto', error);
    res.status(500, 'Ups! hubo un error, intenta de nuevo');
  }
  res.send('Producto agregado con éxito');
});

app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // const { nombre } = req.query;
    const { nombre } = req.body;
    const result = await actualizarProducto(id, nombre);
    res.send('Registro actualizado exitosamente');
  } catch (error) {
    res.status(500).send(error);
  }
});

app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await borrarProducto(id);
    res.send('Producto eliminado con éxito! :)');
  } catch (error) {
    res.send('Hubo un problema al eliminar el registro', error);
  }
});

const users = [];

// Ruta para registrarse
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  users.push({ username, password });
  console.log(users);
  res.status(201).send('Usuario registrado');
});

// Ruta para el login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).send('Credenciales inválidas');
  }
});

app.get('/productos', authenticateToken, (req, res) => {
  const productos = JSON.parse(fs.readFileSync('./data/productos.json'));
  res.json(productos);
});

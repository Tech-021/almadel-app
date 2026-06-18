require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");

const { createToken, publicUser, requireAdmin, requireAuth } = require("./auth");
const { prisma } = require("./db");

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(cors());
app.use(express.json());

function toPositiveNumber(value, field) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field} must be a valid positive number.`);
  }

  return number;
}

function toPositiveInteger(value, field) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${field} must be a valid whole number greater than zero.`);
  }

  return number;
}

function saleResponse(sale) {
  return {
    id: sale.id,
    total_amount: sale.totalAmount,
    total_items: sale.totalItems,
    created_at: sale.createdAt,
  };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/auth/staff/sign-up", async (req, res) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const fullName = String(req.body.fullName ?? "").trim();

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role: "staff",
      },
    });

    res.status(201).json({
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Email is already registered." });
    }

    console.log("Staff sign up error:", error);
    return res.status(500).json({ message: "Could not create staff account." });
  }
});

app.post("/auth/sign-in", async (req, res) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const requestedRole = req.body.role;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (requestedRole === "admin" && user.role !== "admin") {
      return res.status(403).json({ message: "Only admin accounts can use admin login." });
    }

    if (requestedRole === "staff" && user.role === "admin") {
      return res.status(403).json({ message: "Please use admin login for this account." });
    }

    return res.json({
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.log("Sign in error:", error);
    return res.status(500).json({ message: "Could not sign in." });
  }
});

app.get("/products", requireAuth, async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  res.json(products);
});

app.get("/products/barcode/:barcode", requireAuth, async (req, res) => {
  const barcode = String(req.params.barcode ?? "").trim();

  const product = await prisma.product.findUnique({
    where: { barcode },
  });

  res.json(product);
});

app.post("/products", requireAuth, requireAdmin, async (req, res) => {
  try {
    const barcode = String(req.body.barcode ?? "").trim();
    const name = String(req.body.name ?? "").trim();
    const price = toPositiveNumber(req.body.price, "Price");
    const stock = Math.floor(toPositiveNumber(req.body.stock ?? 0, "Opening stock"));

    if (!barcode || !name) {
      return res.status(400).json({ message: "Barcode and product name are required." });
    }

    const product = await prisma.product.create({
      data: {
        barcode,
        name,
        price,
        stock,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Product barcode already exists." });
    }

    return res.status(400).json({ message: error.message ?? "Could not add product." });
  }
});

app.delete("/products/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }

    const saleItemCount = await prisma.saleItem.count({
      where: { productId: id },
    });

    if (saleItemCount > 0) {
      return res.status(409).json({
        message: "This product has sale history. Keep it for reports instead of deleting.",
      });
    }

    await prisma.$transaction([
      prisma.stockLog.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    res.json({ deleted: true });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Product not found." });
    }

    console.log("Delete product error:", error);
    return res.status(400).json({ message: "Could not delete product." });
  }
});

app.post("/stock/receive-one", requireAuth, async (req, res) => {
  try {
    const barcode = String(req.body.barcode ?? "").trim();
    const product = await prisma.product.findUnique({ where: { barcode } });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const updatedProduct = await prisma.product.update({
      data: { stock: product.stock + 1 },
      where: { barcode },
    });

    res.json(updatedProduct);
  } catch (error) {
    return res.status(400).json({ message: error.message ?? "Could not update stock." });
  }
});

app.post("/stock/add", requireAuth, requireAdmin, async (req, res) => {
  try {
    const barcode = String(req.body.barcode ?? "").trim();
    const quantity = toPositiveInteger(req.body.quantity, "Quantity");
    const note = String(req.body.note ?? "").trim();
    const product = await prisma.product.findUnique({ where: { barcode } });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const updatedProduct = await prisma.product.update({
      data: { stock: product.stock + quantity },
      where: { barcode },
    });

    await prisma.stockLog.create({
      data: {
        productId: product.id,
        barcode: product.barcode,
        quantity,
        previousStock: product.stock,
        newStock: updatedProduct.stock,
        note: note || "Stock added",
        userId: req.user.id,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    return res.status(400).json({ message: error.message ?? "Could not add stock." });
  }
});

app.post("/sales/checkout", requireAuth, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (items.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const sale = await prisma.$transaction(async (tx) => {
      const saleItems = [];

      for (const item of items) {
        const quantity = toPositiveInteger(item.quantity, "Quantity");
        const product = await tx.product.findUnique({
          where: { barcode: String(item.barcode ?? "").trim() },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.barcode}`);
        }

        if (product.stock < quantity) {
          throw new Error(`Not enough stock for ${product.name}.`);
        }

        await tx.product.update({
          data: { stock: product.stock - quantity },
          where: { id: product.id },
        });

        saleItems.push({
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          quantity,
          total: product.price * quantity,
        });
      }

      const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0);
      const totalItems = saleItems.reduce((sum, item) => sum + item.quantity, 0);

      return tx.sale.create({
        data: {
          totalAmount,
          totalItems,
          userId: req.user.id,
          items: {
            create: saleItems,
          },
        },
      });
    });

    res.json({ saleId: sale.id });
  } catch (error) {
    return res.status(400).json({ message: error.message ?? "Could not complete sale." });
  }
});

app.get("/dashboard", requireAuth, requireAdmin, async (_req, res) => {
  const [products, sales] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  res.json({
    products,
    sales: sales.map(saleResponse),
  });
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

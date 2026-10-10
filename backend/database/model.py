from sqlalchemy import Column, Integer, String, Float
from .database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, nullable=False)
    customer = Column(String, nullable=False)
    product = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False)
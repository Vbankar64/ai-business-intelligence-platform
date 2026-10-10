from datetime import datetime

from database.database import SessionLocal
from database.models import Customer, Product, Order


def seed_data():
    db = SessionLocal()

    try:
        # -----------------------------------
        # Check if data already exists
        # -----------------------------------

        existing_customers = db.query(Customer).count()
        existing_products = db.query(Product).count()
        existing_orders = db.query(Order).count()

        if existing_customers > 0 or existing_products > 0 or existing_orders > 0:
            print("Data already exists in PostgreSQL.")
            print(f"Customers: {existing_customers}")
            print(f"Products: {existing_products}")
            print(f"Orders: {existing_orders}")
            return

        # -----------------------------------
        # Customers
        # -----------------------------------

        customers = [
            Customer(
                name="Rahul Sharma",
                email="rahul.sharma@example.com",
                total_orders=1,
                total_spent=24500
            ),
            Customer(
                name="Priya Patel",
                email="priya.patel@example.com",
                total_orders=1,
                total_spent=18200
            ),
            Customer(
                name="Amit Verma",
                email="amit.verma@example.com",
                total_orders=1,
                total_spent=42800
            ),
            Customer(
                name="Neha Singh",
                email="neha.singh@example.com",
                total_orders=1,
                total_spent=12600
            )
        ]

        db.add_all(customers)
        db.commit()

        # Refresh customers so IDs are available
        for customer in customers:
            db.refresh(customer)

        # -----------------------------------
        # Products
        # -----------------------------------

        products = [
            Product(
                name="Premium Package",
                category="Premium",
                price=250000,
                stock=25
            ),
            Product(
                name="Business Plan",
                category="Business",
                price=150000,
                stock=40
            ),
            Product(
                name="Enterprise Plan",
                category="Enterprise",
                price=350000,
                stock=12
            ),
            Product(
                name="Standard Package",
                category="Standard",
                price=85000,
                stock=8
            )
        ]

        db.add_all(products)
        db.commit()

        # Refresh products
        for product in products:
            db.refresh(product)

        # -----------------------------------
        # Orders
        # -----------------------------------

        orders = [
            Order(
                order_id="ORD-10245",
                customer="Rahul Sharma",
                product="Premium Package",
                amount=24500,
                status="Completed",
                order_date=datetime(2026, 6, 15)
            ),
            Order(
                order_id="ORD-10244",
                customer="Priya Patel",
                product="Standard Package",
                amount=18200,
                status="Completed",
                order_date=datetime(2026, 5, 20)
            ),
            Order(
                order_id="ORD-10243",
                customer="Amit Verma",
                product="Business Plan",
                amount=42800,
                status="Pending",
                order_date=datetime(2026, 4, 10)
            ),
            Order(
                order_id="ORD-10242",
                customer="Neha Singh",
                product="Standard Package",
                amount=12600,
                status="Cancelled",
                order_date=datetime(2026, 3, 5)
            )
        ]

        db.add_all(orders)
        db.commit()

        print("===================================")
        print("PostgreSQL seed data inserted!")
        print("===================================")
        print("Customers inserted:", len(customers))
        print("Products inserted:", len(products))
        print("Orders inserted:", len(orders))

    except Exception as error:
        db.rollback()
        print("Error while inserting seed data:")
        print(error)

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
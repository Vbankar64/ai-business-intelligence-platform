from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import SessionLocal
from database import models


# ---------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------

app = FastAPI(
    title="AI Business Intelligence Platform",
    description="Backend API for business analytics and AI-powered insights",
    version="1.0.0"
)


# ---------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "https://ai-business-intelligence-platform-plum.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "AI Business Intelligence Platform API",
        "status": "running",
        "database": "PostgreSQL"
    }


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "PostgreSQL"
    }


# ---------------------------------------------------------
# Dashboard
# ---------------------------------------------------------

@app.get("/dashboard")
def get_dashboard():

    db = SessionLocal()

    try:

        customers = db.query(models.Customer).all()
        products = db.query(models.Product).all()
        orders = db.query(models.Order).all()

        # ---------------------------------------------
        # Basic calculations
        # ---------------------------------------------

        total_customers = len(customers)
        total_orders = len(orders)

        total_revenue = sum(
            order.amount
            for order in orders
            if order.status != "Cancelled"
        )

        completed_orders = sum(
            1 for order in orders
            if order.status == "Completed"
        )

        pending_orders = sum(
            1 for order in orders
            if order.status == "Pending"
        )

        cancelled_orders = sum(
            1 for order in orders
            if order.status == "Cancelled"
        )

        # Conversion rate
        conversion_rate = (
            (completed_orders / total_customers) * 100
            if total_customers > 0
            else 0
        )

        # ---------------------------------------------
        # Monthly revenue
        # ---------------------------------------------

        monthly_revenue = {}

        for order in orders:

            if order.status == "Cancelled":
                continue

            month = order.order_date.strftime("%b")

            if month not in monthly_revenue:
                monthly_revenue[month] = 0

            monthly_revenue[month] += order.amount

        months = [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"
        ]

        revenue_overview = [
            {
                "month": month,
                "revenue": monthly_revenue.get(month, 0)
            }
            for month in months
        ]

        # ---------------------------------------------
        # Recent orders
        # ---------------------------------------------

        recent_orders = sorted(
            orders,
            key=lambda x: x.order_date,
            reverse=True
        )

        recent_orders_data = [
            {
                "id": order.id,
                "order_id": order.order_id,
                "customer": order.customer,
                "product": order.product,
                "amount": order.amount,
                "status": order.status,
                "order_date": order.order_date.strftime("%Y-%m-%d")
            }
            for order in recent_orders
        ]

        # ---------------------------------------------
        # Low stock products
        # ---------------------------------------------

        low_stock_products = [
            product
            for product in products
            if product.stock < 10
        ]

        # ---------------------------------------------
        # AI / Business insights
        # ---------------------------------------------

        ai_insights = [
            {
                "title": "Revenue Insight",
                "message": f"Total revenue is ₹{total_revenue:,.0f}."
            },
            {
                "title": "Inventory Alert",
                "message": f"{len(low_stock_products)} product(s) have low stock."
            }
        ]

        return {
            "total_revenue": total_revenue,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "conversion_rate": round(conversion_rate, 2),
            "revenue_overview": revenue_overview,
            "recent_orders": recent_orders_data,
            "low_stock_count": len(low_stock_products),
            "ai_insights": ai_insights
        }

    finally:
        db.close()


# ---------------------------------------------------------
# Analytics
# ---------------------------------------------------------

@app.get("/analytics")
def get_analytics():

    db = SessionLocal()

    try:

        customers = db.query(models.Customer).all()
        products = db.query(models.Product).all()
        orders = db.query(models.Order).all()

        # ---------------------------------------------
        # Basic metrics
        # ---------------------------------------------

        total_customers = len(customers)
        total_orders = len(orders)

        total_revenue = sum(
            order.amount
            for order in orders
            if order.status != "Cancelled"
        )

        average_order_value = (
            total_revenue / total_orders
            if total_orders > 0
            else 0
        )

        completed_orders = sum(
            1 for order in orders
            if order.status == "Completed"
        )

        pending_orders = sum(
            1 for order in orders
            if order.status == "Pending"
        )

        cancelled_orders = sum(
            1 for order in orders
            if order.status == "Cancelled"
        )

        # ---------------------------------------------
        # Monthly revenue
        # ---------------------------------------------

        monthly_revenue = {}

        for order in orders:

            if order.status == "Cancelled":
                continue

            month = order.order_date.strftime("%b")

            if month not in monthly_revenue:
                monthly_revenue[month] = 0

            monthly_revenue[month] += order.amount

        months = [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"
        ]

        monthly_revenue_data = [
            {
                "month": month,
                "revenue": monthly_revenue.get(month, 0)
            }
            for month in months
        ]

        # ---------------------------------------------
        # FIXED PRODUCT PERFORMANCE
        # ---------------------------------------------

        product_performance = []

        for product in products:

            matching_orders = [
                order
                for order in orders
                if order.product == product.name
                and order.status != "Cancelled"
            ]

            sales_count = len(matching_orders)

            revenue = sum(
                order.amount
                for order in matching_orders
            )

            product_performance.append(
                {
                    "product": product.name,
                    "sales": sales_count,
                    "revenue": revenue,
                    "status": (
                        "Low Stock"
                        if product.stock < 10
                        else "In Stock"
                    )
                }
            )

        # ---------------------------------------------
        # Low stock
        # ---------------------------------------------

        low_stock_products = [
            {
                "name": product.name,
                "stock": product.stock
            }
            for product in products
            if product.stock < 10
        ]

        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_customers": total_customers,
            "average_order_value": round(average_order_value, 2),

            "order_status": {
                "completed": completed_orders,
                "pending": pending_orders,
                "cancelled": cancelled_orders
            },

            "monthly_revenue": monthly_revenue_data,

            "product_performance": product_performance,

            "low_stock_products": low_stock_products
        }

    finally:
        db.close()


# ---------------------------------------------------------
# Customers
# ---------------------------------------------------------

@app.get("/customers")
def get_customers():

    db = SessionLocal()

    try:

        customers = db.query(models.Customer).all()
        orders = db.query(models.Order).all()

        total_revenue = sum(
            order.amount
            for order in orders
            if order.status != "Cancelled"
        )

        customer_data = []

        for customer in customers:

            customer_data.append(
                {
                    "id": customer.id,
                    "name": customer.name,
                    "email": customer.email,
                    "total_orders": customer.total_orders,
                    "total_spent": customer.total_spent
                }
            )

        return {
            "total_customers": len(customers),
            "total_revenue": total_revenue,
            "customers": customer_data
        }

    finally:
        db.close()


# ---------------------------------------------------------
# Sales
# ---------------------------------------------------------

@app.get("/sales")
def get_sales():

    db = SessionLocal()

    try:

        orders = db.query(models.Order).all()

        total_sales = sum(
            order.amount
            for order in orders
            if order.status != "Cancelled"
        )

        completed_orders = sum(
            1 for order in orders
            if order.status == "Completed"
        )

        pending_orders = sum(
            1 for order in orders
            if order.status == "Pending"
        )

        cancelled_orders = sum(
            1 for order in orders
            if order.status == "Cancelled"
        )

        order_data = [
            {
                "id": order.id,
                "order_id": order.order_id,
                "customer": order.customer,
                "product": order.product,
                "amount": order.amount,
                "status": order.status,
                "order_date": order.order_date.strftime("%Y-%m-%d")
            }
            for order in sorted(
                orders,
                key=lambda x: x.order_date,
                reverse=True
            )
        ]

        return {
            "total_sales": total_sales,
            "total_orders": len(orders),
            "completed_orders": completed_orders,
            "pending_orders": pending_orders,
            "cancelled_orders": cancelled_orders,
            "orders": order_data
        }

    finally:
        db.close()


# ---------------------------------------------------------
# Products
# ---------------------------------------------------------

@app.get("/products")
def get_products():

    db = SessionLocal()

    try:

        products = db.query(models.Product).all()

        total_inventory = sum(
            product.stock
            for product in products
        )

        low_stock_products = [
            product
            for product in products
            if product.stock < 10
        ]

        inventory_value = sum(
            product.price * product.stock
            for product in products
        )

        product_data = [
            {
                "id": product.id,
                "name": product.name,
                "category": product.category,
                "price": product.price,
                "stock": product.stock
            }
            for product in products
        ]

        return {
            "total_products": len(products),
            "total_inventory": total_inventory,
            "low_stock_products": len(low_stock_products),
            "inventory_value": inventory_value,
            "products": product_data
        }

    finally:
        db.close()


# ---------------------------------------------------------
# AI Insights
# ---------------------------------------------------------

@app.get("/ai-insights")
def get_ai_insights():

    db = SessionLocal()

    try:

        customers = db.query(models.Customer).all()
        products = db.query(models.Product).all()
        orders = db.query(models.Order).all()

        # ---------------------------------------------
        # Revenue
        # ---------------------------------------------

        total_revenue = sum(
            order.amount
            for order in orders
            if order.status != "Cancelled"
        )

        total_orders = len(orders)
        total_customers = len(customers)

        # ---------------------------------------------
        # Order status
        # ---------------------------------------------

        completed_orders = sum(
            1 for order in orders
            if order.status == "Completed"
        )

        pending_orders = sum(
            1 for order in orders
            if order.status == "Pending"
        )

        cancelled_orders = sum(
            1 for order in orders
            if order.status == "Cancelled"
        )

        # ---------------------------------------------
        # Average Order Value
        # ---------------------------------------------

        average_order_value = (
            total_revenue / total_orders
            if total_orders > 0
            else 0
        )

        # ---------------------------------------------
        # Completion rate
        # ---------------------------------------------

        completion_rate = (
            (completed_orders / total_orders) * 100
            if total_orders > 0
            else 0
        )

        # ---------------------------------------------
        # Low stock
        # ---------------------------------------------

        low_stock_products = [
            product
            for product in products
            if product.stock < 10
        ]

        # ---------------------------------------------
        # Insights
        # ---------------------------------------------

        insights = []

        insights.append(
            {
                "type": "revenue",
                "title": "Revenue Performance",
                "message": (
                    f"Your business generated "
                    f"₹{total_revenue:,.0f} "
                    f"from {total_orders} orders."
                )
            }
        )

        insights.append(
            {
                "type": "sales",
                "title": "Average Order Value",
                "message": (
                    f"The average order value is "
                    f"₹{average_order_value:,.0f}."
                )
            }
        )

        insights.append(
            {
                "type": "orders",
                "title": "Order Completion",
                "message": (
                    f"{completed_orders} orders are completed, "
                    f"representing a "
                    f"{completion_rate:.1f}% completion rate."
                )
            }
        )

        if pending_orders > 0:

            insights.append(
                {
                    "type": "warning",
                    "title": "Pending Orders",
                    "message": (
                        f"There are {pending_orders} "
                        f"pending orders that may require attention."
                    )
                }
            )

        if cancelled_orders > 0:

            insights.append(
                {
                    "type": "warning",
                    "title": "Cancelled Orders",
                    "message": (
                        f"{cancelled_orders} orders "
                        f"have been cancelled."
                    )
                }
            )

        if low_stock_products:

            product_names = ", ".join(
                product.name
                for product in low_stock_products
            )

            insights.append(
                {
                    "type": "inventory",
                    "title": "Low Stock Alert",
                    "message": (
                        "The following products have "
                        f"low stock: {product_names}."
                    )
                }
            )

        insights.append(
            {
                "type": "customers",
                "title": "Customer Base",
                "message": (
                    f"Your platform currently has "
                    f"{total_customers} customers."
                )
            }
        )

        return {
            "summary": {
                "total_revenue": total_revenue,
                "total_orders": total_orders,
                "total_customers": total_customers,
                "average_order_value": round(
                    average_order_value,
                    2
                ),
                "completed_orders": completed_orders,
                "pending_orders": pending_orders,
                "cancelled_orders": cancelled_orders
            },

            "insights": insights,

            "low_stock_products": [
                {
                    "name": product.name,
                    "stock": product.stock
                }
                for product in low_stock_products
            ]
        }

    finally:
        db.close()
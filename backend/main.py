
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database.database import SessionLocal
from database import models


# =========================================================
# FastAPI Application
# =========================================================

app = FastAPI(
    title="AI Business Intelligence Platform",
    description="Backend API for business analytics and AI-powered insights",
    version="1.2.0",
)


# =========================================================
# CORS Configuration
# =========================================================

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


# =========================================================
# Shared Business Calculation Helpers
# =========================================================

def order_status(order):
    """Return a normalized order status."""
    return str(order.status or "").strip().lower()


def get_order_summary(orders):
    """Calculate consistent business metrics from order records."""

    completed = [
        order for order in orders
        if order_status(order) == "completed"
    ]

    pending = [
        order for order in orders
        if order_status(order) == "pending"
    ]

    cancelled = [
        order for order in orders
        if order_status(order) == "cancelled"
    ]

    completed_revenue = sum(
        order.amount or 0 for order in completed
    )

    pending_sales = sum(
        order.amount or 0 for order in pending
    )

    cancelled_sales = sum(
        order.amount or 0 for order in cancelled
    )

    total_order_value = sum(
        order.amount or 0 for order in orders
    )

    average_order_value = (
        completed_revenue / len(completed)
        if completed
        else 0
    )

    return {
        "total_revenue": completed_revenue,
        "total_sales": completed_revenue,
        "pending_sales": pending_sales,
        "cancelled_sales": cancelled_sales,
        "total_order_value": total_order_value,
        "total_orders": len(orders),
        "completed_orders": len(completed),
        "pending_orders": len(pending),
        "cancelled_orders": len(cancelled),
        "average_order_value": round(average_order_value, 2),
    }


def get_monthly_revenue(orders):
    """Calculate monthly revenue using completed orders only."""

    months = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec",
    ]

    monthly_totals = {month: 0 for month in months}

    for order in orders:
        if order_status(order) != "completed":
            continue

        if not order.order_date:
            continue

        month = order.order_date.strftime("%b")
        monthly_totals[month] += order.amount or 0

    return [
        {
            "month": month,
            "revenue": monthly_totals[month],
        }
        for month in months
    ]


def serialize_order(order):
    """Convert an order into a JSON-compatible dictionary."""

    return {
        "id": order.id,
        "order_id": order.order_id,
        "customer": order.customer,
        "product": order.product,
        "amount": order.amount or 0,
        "status": order.status,
        "order_date": (
            order.order_date.strftime("%Y-%m-%d")
            if order.order_date
            else None
        ),
    }


def get_low_stock_products(products):
    """Find products with fewer than 10 units in stock."""

    return [
        product for product in products
        if (product.stock or 0) < 10
    ]


def get_sorted_orders(orders):
    """Sort orders by date, newest first."""

    return sorted(
        orders,
        key=lambda order: (
            order.order_date is not None,
            order.order_date,
        ),
        reverse=True,
    )


# =========================================================
# Root Endpoint
# =========================================================

@app.get("/")
def root():
    return {
        "message": "AI Business Intelligence Platform API",
        "status": "running",
        "database": "PostgreSQL",
        "version": "1.2.0",
    }


# =========================================================
# Health Check
# =========================================================

@app.get("/health")
def health_check():
    """Verify that the API can execute a database query."""

    db = SessionLocal()

    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "PostgreSQL",
        }

    except Exception:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "connection_failed",
            },
        )

    finally:
        db.close()


# =========================================================
# Dashboard
# =========================================================

@app.get("/dashboard")
def get_dashboard():
    db = SessionLocal()

    try:
        customers = db.query(models.Customer).all()
        products = db.query(models.Product).all()
        orders = db.query(models.Order).all()

        summary = get_order_summary(orders)
        low_stock_products = get_low_stock_products(products)
        recent_orders = get_sorted_orders(orders)

        # This is only a proxy metric, not a true website
        # conversion rate. Visitor or lead data is required
        # to calculate a real conversion rate.
        conversion_rate = (
            summary["completed_orders"] / len(customers) * 100
            if customers
            else 0
        )

        ai_insights = [
            {
                "title": "Completed Revenue",
                "message": (
                    f"Completed revenue is "
                    f"₹{summary['total_revenue']:,.2f}."
                ),
            },
            {
                "title": "Pending Sales",
                "message": (
                    f"₹{summary['pending_sales']:,.2f} is awaiting "
                    f"completion across {summary['pending_orders']} "
                    "pending order(s)."
                ),
            },
            {
                "title": "Inventory Alert",
                "message": (
                    f"{len(low_stock_products)} product(s) "
                    "have low stock."
                ),
            },
        ]

        return {
            "total_revenue": summary["total_revenue"],
            "total_customers": len(customers),
            "total_orders": summary["total_orders"],
            "conversion_rate": round(conversion_rate, 2),
            "revenue_overview": get_monthly_revenue(orders),
            "recent_orders": [
                serialize_order(order)
                for order in recent_orders[:10]
            ],
            "low_stock_count": len(low_stock_products),
            "ai_insights": ai_insights,
            "pending_sales": summary["pending_sales"],
            "cancelled_sales": summary["cancelled_sales"],
            "total_order_value": summary["total_order_value"],
            "completed_orders": summary["completed_orders"],
            "pending_orders": summary["pending_orders"],
            "cancelled_orders": summary["cancelled_orders"],
        }

    finally:
        db.close()


# =========================================================
# Analytics
# =========================================================

@app.get("/analytics")
def get_analytics():
    db = SessionLocal()

    try:
        customers = db.query(models.Customer).all()
        products = db.query(models.Product).all()
        orders = db.query(models.Order).all()

        summary = get_order_summary(orders)
        low_stock_products = get_low_stock_products(products)

        product_performance = []

        for product in products:
            matching_orders = [
                order for order in orders
                if (
                    order.product == product.name
                    and order_status(order) == "completed"
                )
            ]

            product_performance.append({
                "product": product.name,
                "sales": len(matching_orders),
                "revenue": sum(
                    order.amount or 0
                    for order in matching_orders
                ),
                "status": (
                    "Low Stock"
                    if (product.stock or 0) < 10
                    else "In Stock"
                ),
            })

        return {
            "total_revenue": summary["total_revenue"],
            "total_orders": summary["total_orders"],
            "total_customers": len(customers),
            "average_order_value": summary["average_order_value"],
            "order_status": {
                "completed": summary["completed_orders"],
                "pending": summary["pending_orders"],
                "cancelled": summary["cancelled_orders"],
            },
            "monthly_revenue": get_monthly_revenue(orders),
            "product_performance": product_performance,
            "low_stock_products": [
                {
                    "name": product.name,
                    "stock": product.stock or 0,
                }
                for product in low_stock_products
            ],
            "pending_sales": summary["pending_sales"],
            "cancelled_sales": summary["cancelled_sales"],
            "total_order_value": summary["total_order_value"],
        }

    finally:
        db.close()


# =========================================================
# Customers
# =========================================================

@app.get("/customers")
def get_customers():
    db = SessionLocal()

    try:
        customers = db.query(models.Customer).all()
        orders = db.query(models.Order).all()

        summary = get_order_summary(orders)

        customer_order_counts = {}
        customer_completed_spending = {}

        for order in orders:
            customer_name = order.customer

            customer_order_counts[customer_name] = (
                customer_order_counts.get(customer_name, 0) + 1
            )

            if order_status(order) == "completed":
                customer_completed_spending[customer_name] = (
                    customer_completed_spending.get(customer_name, 0)
                    + (order.amount or 0)
                )

        customer_data = [
            {
                "id": customer.id,
                "name": customer.name,
                "email": customer.email,
                "total_orders": customer_order_counts.get(
                    customer.name, 0
                ),
                "total_spent": customer_completed_spending.get(
                    customer.name, 0
                ),
            }
            for customer in customers
        ]

        return {
            "total_customers": len(customers),
            "total_revenue": summary["total_revenue"],
            "customers": customer_data,
        }

    finally:
        db.close()


# =========================================================
# Sales
# =========================================================

@app.get("/sales")
def get_sales():
    db = SessionLocal()

    try:
        orders = db.query(models.Order).all()
        summary = get_order_summary(orders)
        sorted_orders = get_sorted_orders(orders)

        return {
            "total_sales": summary["total_sales"],
            "total_revenue": summary["total_revenue"],
            "pending_sales": summary["pending_sales"],
            "cancelled_sales": summary["cancelled_sales"],
            "total_order_value": summary["total_order_value"],
            "total_orders": summary["total_orders"],
            "completed_orders": summary["completed_orders"],
            "pending_orders": summary["pending_orders"],
            "cancelled_orders": summary["cancelled_orders"],
            "average_order_value": summary["average_order_value"],
            "orders": [
                serialize_order(order)
                for order in sorted_orders
            ],
        }

    finally:
        db.close()


# =========================================================
# Products
# =========================================================

@app.get("/products")
def get_products():
    db = SessionLocal()

    try:
        products = db.query(models.Product).all()
        low_stock_products = get_low_stock_products(products)

        total_inventory = sum(
            product.stock or 0 for product in products
        )

        inventory_value = sum(
            (product.price or 0) * (product.stock or 0)
            for product in products
        )

        product_data = [
            {
                "id": product.id,
                "name": product.name,
                "category": product.category,
                "price": product.price or 0,
                "stock": product.stock or 0,
            }
            for product in products
        ]

        return {
            "total_products": len(products),
            "total_inventory": total_inventory,
            "low_stock_products": len(low_stock_products),
            "inventory_value": inventory_value,
            "products": product_data,
        }

    finally:
        db.close()


# =========================================================
# AI Insights
# =========================================================

@app.get("/ai-insights")
def get_ai_insights():
    db = SessionLocal()

    try:
        customers = db.query(models.Customer).all()
        products = db.query(models.Product).all()
        orders = db.query(models.Order).all()

        summary = get_order_summary(orders)
        low_stock_products = get_low_stock_products(products)

        total_orders = summary["total_orders"]

        completion_rate = (
            summary["completed_orders"] / total_orders * 100
            if total_orders
            else 0
        )

        insights = [
            {
                "type": "revenue",
                "title": "Completed Revenue",
                "message": (
                    f"Your business has generated "
                    f"₹{summary['total_revenue']:,.2f} from "
                    f"{summary['completed_orders']} completed orders."
                ),
            },
            {
                "type": "sales",
                "title": "Average Order Value",
                "message": (
                    f"The average completed order value is "
                    f"₹{summary['average_order_value']:,.2f}."
                ),
            },
            {
                "type": "orders",
                "title": "Order Completion",
                "message": (
                    f"{summary['completed_orders']} of {total_orders} "
                    f"orders are completed ({completion_rate:.1f}%)."
                ),
            },
        ]

        if summary["pending_orders"] > 0:
            insights.append({
                "type": "warning",
                "title": "Pending Orders",
                "message": (
                    f"{summary['pending_orders']} pending order(s) "
                    f"represent ₹{summary['pending_sales']:,.2f}. "
                    "Review them to determine the next action."
                ),
            })

        if summary["cancelled_orders"] > 0:
            insights.append({
                "type": "warning",
                "title": "Cancelled Orders",
                "message": (
                    f"{summary['cancelled_orders']} order(s) totalling "
                    f"₹{summary['cancelled_sales']:,.2f} were cancelled "
                    "and are excluded from revenue."
                ),
            })

        if low_stock_products:
            product_names = ", ".join(
                product.name for product in low_stock_products
            )

            insights.append({
                "type": "inventory",
                "title": "Low Stock Alert",
                "message": (
                    f"Review stock levels for: {product_names}."
                ),
            })

        insights.append({
            "type": "customers",
            "title": "Customer Base",
            "message": (
                f"Your platform currently has "
                f"{len(customers)} customers."
            ),
        })

        return {
            "summary": {
                "total_revenue": summary["total_revenue"],
                "total_orders": summary["total_orders"],
                "total_customers": len(customers),
                "average_order_value": summary["average_order_value"],
                "completed_orders": summary["completed_orders"],
                "pending_orders": summary["pending_orders"],
                "cancelled_orders": summary["cancelled_orders"],
                "pending_sales": summary["pending_sales"],
                "cancelled_sales": summary["cancelled_sales"],
                "total_order_value": summary["total_order_value"],
            },
            "insights": insights,
            "low_stock_products": [
                {
                    "name": product.name,
                    "stock": product.stock or 0,
                }
                for product in low_stock_products
            ],
        }

    finally:
        db.close()

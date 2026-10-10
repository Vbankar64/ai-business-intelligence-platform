import React, { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./App.css";

const API_URL = "http://127.0.0.1:8000";

async function fetchJson(endpoint) {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `${endpoint} returned ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);

    throw new Error(
      `${endpoint}: ${error.message || "Unable to fetch data"}`
    );
  }
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return `₹${number.toLocaleString("en-IN")}`;
}

function formatNumber(value) {
  const number = Number(value || 0);
  return number.toLocaleString("en-IN");
}

function formatPercentage(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getStatusClass(status) {
  if (!status) return "status";

  const normalizedStatus = String(status).toLowerCase();

  if (normalizedStatus === "completed") {
    return "status completed";
  }

  if (normalizedStatus === "pending") {
    return "status pending";
  }

  if (normalizedStatus === "cancelled") {
    return "status cancelled";
  }

  return "status";
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [dashboard, setDashboard] = useState({});
  const [analytics, setAnalytics] = useState({});
  const [customers, setCustomers] = useState({});
  const [sales, setSales] = useState({});
  const [products, setProducts] = useState({});
  const [aiInsights, setAiInsights] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiErrors, setApiErrors] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setError("");
    setApiErrors([]);

    const endpoints = [
      {
        name: "Dashboard",
        endpoint: "/dashboard",
        setter: setDashboard,
      },
      {
        name: "Analytics",
        endpoint: "/analytics",
        setter: setAnalytics,
      },
      {
        name: "Customers",
        endpoint: "/customers",
        setter: setCustomers,
      },
      {
        name: "Sales",
        endpoint: "/sales",
        setter: setSales,
      },
      {
        name: "Products",
        endpoint: "/products",
        setter: setProducts,
      },
      {
        name: "AI Insights",
        endpoint: "/ai-insights",
        setter: setAiInsights,
      },
    ];

    const errors = [];

    try {
      const healthResponse = await fetchJson("/health");

      console.log("Backend health:", healthResponse);

      if (healthResponse?.status !== "healthy") {
        throw new Error("Backend health check did not return healthy.");
      }

      const results = await Promise.allSettled(
        endpoints.map((item) => fetchJson(item.endpoint))
      );

      results.forEach((result, index) => {
        const item = endpoints[index];

        if (result.status === "fulfilled") {
          item.setter(result.value || {});
        } else {
          const message =
            result.reason?.message || `Unable to load ${item.name}`;

          console.error(`${item.name} error:`, message);

          errors.push(`${item.endpoint} → ${message}`);
        }
      });

      if (errors.length > 0) {
        setApiErrors(errors);
      }
    } catch (err) {
      console.error("Backend health check failed:", err);

      setError(
        err?.message || "Unable to connect to the FastAPI backend."
      );
    } finally {
      setLoading(false);
    }
  }

  const revenueOverview = Array.isArray(dashboard.revenue_overview)
    ? dashboard.revenue_overview
    : [];

  const productList = Array.isArray(products.products)
    ? products.products
    : Array.isArray(products)
      ? products
      : [];

  const customerList = Array.isArray(customers.customers)
    ? customers.customers
    : Array.isArray(customers)
      ? customers
      : [];

  const salesList = Array.isArray(sales.orders)
    ? sales.orders
    : Array.isArray(sales.sales)
      ? sales.sales
      : Array.isArray(sales)
        ? sales
        : [];

  const productPerformanceList = Array.isArray(
    analytics.product_performance
  )
    ? analytics.product_performance
    : Array.isArray(products.product_performance)
      ? products.product_performance
      : [];

  const dashboardRevenue = Number(
    dashboard.total_revenue ?? 0
  );

  const dashboardCustomers = Number(
    dashboard.total_customers ?? customerList.length
  );

  const dashboardOrders = Number(
    dashboard.total_orders ?? salesList.length
  );

  const dashboardConversion = Number(
    dashboard.conversion_rate ?? 0
  );

  const lowStockProducts = productList.filter(
    (product) => Number(product.stock ?? 0) <= 10
  );

  const lowStockCount = Number(
    dashboard.low_stock_count ??
      products.low_stock_products ??
      lowStockProducts.length
  );

  const totalInventory = productList.reduce(
    (total, product) =>
      total + Number(product.stock ?? 0),
    0
  );

  const healthyStockProducts = productList.filter(
    (product) => Number(product.stock ?? 0) > 10
  ).length;

  const calculatedInventoryValue = productList.reduce(
    (total, product) => {
      const price = Number(product.price ?? 0);
      const stock = Number(product.stock ?? 0);

      return total + price * stock;
    },
    0
  );

  const inventoryValue = Number(
    products.inventory_value ??
      products.total_inventory_value ??
      calculatedInventoryValue
  );

  const salesTotal = Number(
    sales.total_sales ??
      sales.total_orders ??
      salesList.length ??
      0
  );

  const salesCompleted = Number(
    sales.completed_orders ??
      sales.completed ??
      sales.completed_sales ??
      salesList.filter(
        (sale) =>
          String(sale.status || "").toLowerCase() ===
          "completed"
      ).length
  );

  const salesPending = Number(
    sales.pending_orders ??
      sales.pending ??
      sales.pending_sales ??
      salesList.filter(
        (sale) =>
          String(sale.status || "").toLowerCase() ===
          "pending"
      ).length
  );

  const salesCancelled = Number(
    sales.cancelled_orders ??
      sales.cancelled ??
      sales.cancelled_sales ??
      salesList.filter(
        (sale) =>
          String(sale.status || "").toLowerCase() ===
          "cancelled"
      ).length
  );

  const calculatedAOV =
    salesCompleted > 0
      ? dashboardRevenue / salesCompleted
      : 0;

  const averageOrderValue = Number(
    analytics.average_order_value ??
      analytics.aov ??
      calculatedAOV
  );

  const aiSummary = aiInsights.summary || {};

  const aiPendingOrders = Number(
    aiSummary.pending_orders ??
      aiInsights.pending_orders ??
      salesPending
  );

  const aiCompletedOrders = Number(
    aiSummary.completed_orders ??
      aiInsights.completed_orders ??
      salesCompleted
  );

  const aiTotalOrders = Number(
    aiSummary.total_orders ??
      aiInsights.total_orders ??
      dashboardOrders
  );

  const aiCompletionRate =
    aiTotalOrders > 0
      ? (aiCompletedOrders / aiTotalOrders) * 100
      : 0;

  function getCustomerName(customer) {
    return (
      customer?.name ||
      customer?.customer_name ||
      customer?.customer ||
      "Unknown Customer"
    );
  }

  function getProductName(product) {
    return (
      product?.name ||
      product?.product_name ||
      product?.product ||
      "Unknown Product"
    );
  }

  function getOrderCustomer(order) {
    return (
      order?.customer ||
      order?.customer_name ||
      "Unknown Customer"
    );
  }

  function getOrderProduct(order) {
    return (
      order?.product ||
      order?.product_name ||
      "Unknown Product"
    );
  }

  function getRevenueHealth() {
    if (dashboardRevenue > 0) {
      return {
        className: "good",
        text: "Healthy",
      };
    }

    return {
      className: "danger",
      text: "Needs Attention",
    };
  }

  function getInventoryHealth() {
    if (lowStockCount === 0) {
      return {
        className: "good",
        text: "Healthy",
      };
    }

    if (lowStockCount <= 2) {
      return {
        className: "warning",
        text: "Monitor",
      };
    }

    return {
      className: "danger",
      text: "Needs Attention",
    };
  }

  function getOrderHealth() {
    if (salesPending === 0) {
      return {
        className: "good",
        text: "Healthy",
      };
    }

    return {
      className: "warning",
      text: `${salesPending} Pending`,
    };
  }

  function getCompletionHealth() {
    if (aiCompletionRate >= 70) {
      return {
        className: "good",
        text: "Strong",
      };
    }

    if (aiCompletionRate >= 40) {
      return {
        className: "warning",
        text: "Moderate",
      };
    }

    return {
      className: "danger",
      text: "Low",
    };
  }

  function renderDashboard() {
    const revenueHealth = getRevenueHealth();
    const inventoryHealth = getInventoryHealth();
    const orderHealth = getOrderHealth();
    const completionHealth = getCompletionHealth();

    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Business Dashboard</h1>
            <p>
              Monitor your business performance, revenue,
              customers, sales and inventory.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Total Revenue</span>
              <h2>{formatCurrency(dashboardRevenue)}</h2>
              <p>Revenue from completed orders</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Total Customers</span>
              <h2>{formatNumber(dashboardCustomers)}</h2>
              <p>Registered customers</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Total Orders</span>
              <h2>{formatNumber(dashboardOrders)}</h2>
              <p>All recorded orders</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Conversion Rate</span>
              <h2>{formatPercentage(dashboardConversion)}</h2>
              <p>Completed orders ratio</p>
            </div>
          </div>
        </div>

        <div className="revenue-section">
          <div className="revenue-chart-card">
            <div className="card-header">
              <div>
                <h2>Monthly Revenue</h2>
                <p>Revenue performance throughout the year</p>
              </div>
            </div>

            <div className="revenue-chart">
              {revenueOverview.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={revenueOverview}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString("en-IN")}`
                      }
                    />

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  No revenue data available.
                </div>
              )}
            </div>
          </div>

          <div className="revenue-summary-card">
            <div className="card-header">
              <div>
                <h2>Revenue Performance</h2>
                <p>Key revenue indicators</p>
              </div>
            </div>

            <div className="summary-list">
              <div className="summary-row">
                <span>Total Revenue</span>
                <strong>
                  {formatCurrency(dashboardRevenue)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Completed Orders</span>
                <strong>
                  {formatNumber(salesCompleted)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Pending Orders</span>
                <strong>
                  {formatNumber(salesPending)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Cancelled Orders</span>
                <strong>
                  {formatNumber(salesCancelled)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Avg. Completed Order</span>
                <strong>
                  {formatCurrency(averageOrderValue)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="inventory-section">
          <div className="inventory-overview-card">
            <div className="card-header">
              <div>
                <h2>Inventory Intelligence</h2>
                <p>Monitor products and stock levels</p>
              </div>
            </div>

            <div className="inventory-stats">
              <div className="inventory-stat">
                <span>Total Products</span>
                <strong>
                  {formatNumber(productList.length)}
                </strong>
              </div>

              <div className="inventory-stat">
                <span>Total Inventory</span>
                <strong>
                  {formatNumber(totalInventory)}
                </strong>
              </div>

              <div className="inventory-stat warning">
                <span>Low Stock</span>
                <strong>
                  {formatNumber(lowStockCount)}
                </strong>
              </div>

              <div className="inventory-stat healthy">
                <span>Healthy Stock</span>
                <strong>
                  {formatNumber(healthyStockProducts)}
                </strong>
              </div>

              <div className="inventory-stat">
                <span>Inventory Value</span>
                <strong>
                  {formatCurrency(inventoryValue)}
                </strong>
              </div>
            </div>
          </div>

          <div className="low-stock-card">
            <div className="card-header">
              <div>
                <h2>Low Stock Alerts</h2>
                <p>Products that need attention</p>
              </div>
            </div>

            {lowStockProducts.length > 0 ? (
              <div className="low-stock-list">
                {lowStockProducts.map((product, index) => (
                  <div
                    className="low-stock-item"
                    key={
                      product.id ??
                      product.product_id ??
                      index
                    }
                  >
                    <div className="low-stock-info">
                      <div className="low-stock-icon">!</div>

                      <div>
                        <strong>
                          {getProductName(product)}
                        </strong>

                        <span>
                          {formatNumber(product.stock ?? 0)}{" "}
                          units remaining
                        </span>
                      </div>
                    </div>

                    <div className="low-stock-action">
                      <span className="stock-warning">
                        Low Stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="inventory-success">
                <strong>Inventory is healthy</strong>

                <p>
                  No products currently require immediate
                  restocking.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="content-grid">
          <div className="content-card">
            <div className="card-header">
              <div>
                <h2>Business Health</h2>
                <p>Overall operational health</p>
              </div>
            </div>

            <div className="business-health">
              <div className="health-item">
                <div className="health-item-left">
                  <span
                    className={`health-indicator ${revenueHealth.className}`}
                  ></span>
                  <span>Revenue Performance</span>
                </div>

                <strong>{revenueHealth.text}</strong>
              </div>

              <div className="health-item">
                <div className="health-item-left">
                  <span
                    className={`health-indicator ${inventoryHealth.className}`}
                  ></span>
                  <span>Inventory</span>
                </div>

                <strong>{inventoryHealth.text}</strong>
              </div>

              <div className="health-item">
                <div className="health-item-left">
                  <span
                    className={`health-indicator ${orderHealth.className}`}
                  ></span>
                  <span>Order Processing</span>
                </div>

                <strong>{orderHealth.text}</strong>
              </div>

              <div className="health-item">
                <div className="health-item-left">
                  <span
                    className={`health-indicator ${completionHealth.className}`}
                  ></span>
                  <span>Order Completion</span>
                </div>

                <strong>{completionHealth.text}</strong>
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <div>
                <h2>Business Summary</h2>
                <p>Current business snapshot</p>
              </div>
            </div>

            <div className="summary-list">
              <div className="summary-row">
                <span>Customers</span>
                <strong>
                  {formatNumber(dashboardCustomers)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Orders</span>
                <strong>
                  {formatNumber(dashboardOrders)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Revenue</span>
                <strong>
                  {formatCurrency(dashboardRevenue)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Inventory Units</span>
                <strong>
                  {formatNumber(totalInventory)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Low Stock Products</span>
                <strong>
                  {formatNumber(lowStockCount)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>AI Business Insights</h2>
              <p>
                Data-driven insights generated from your
                business information
              </p>
            </div>
          </div>

          <div className="ai-insights-grid">
            <div className="ai-insight-card">
              <h3>Revenue Insight</h3>
              <p>
                Your business has generated{" "}
                <strong>
                  {formatCurrency(dashboardRevenue)}
                </strong>{" "}
                in realized revenue from completed orders.
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Order Performance</h3>
              <p>
                Out of{" "}
                <strong>{formatNumber(aiTotalOrders)}</strong>{" "}
                recorded orders,{" "}
                <strong>
                  {formatNumber(aiCompletedOrders)}
                </strong>{" "}
                have been completed.
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Inventory Alert</h3>
              <p>
                {lowStockCount > 0
                  ? `${lowStockCount} product(s) currently have low stock and may require restocking.`
                  : "All products currently have healthy stock levels."}
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Conversion Insight</h3>
              <p>
                The current order completion rate is{" "}
                <strong>
                  {formatPercentage(aiCompletionRate)}
                </strong>
                . Improving pending orders could increase
                realized revenue.
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Pending Orders</h3>
              <p>
                There are{" "}
                <strong>
                  {formatNumber(aiPendingOrders)}
                </strong>{" "}
                pending order(s). Reviewing these orders may
                help prevent revenue delays.
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Inventory Value</h3>
              <p>
                Current estimated inventory value is{" "}
                <strong>
                  {formatCurrency(inventoryValue)}
                </strong>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Recent Orders</h2>
              <p>Latest business transactions</p>
            </div>
          </div>

          {Array.isArray(dashboard.recent_orders) &&
          dashboard.recent_orders.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.recent_orders.map(
                    (order, index) => (
                      <tr
                        key={
                          order.id ??
                          order.order_id ??
                          index
                        }
                      >
                        <td>
                          <strong>
                            {order.order_id || "N/A"}
                          </strong>
                        </td>

                        <td>{getOrderCustomer(order)}</td>

                        <td>{getOrderProduct(order)}</td>

                        <td>
                          {formatCurrency(order.amount)}
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              order.status
                            )}
                          >
                            {order.status || "Unknown"}
                          </span>
                        </td>

                        <td>
                          {order.order_date
                            ? new Date(
                                order.order_date
                              ).toLocaleDateString("en-IN")
                            : "N/A"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              No recent orders available.
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderAnalytics() {
    const analyticsRevenue = Number(
      analytics.total_revenue ?? dashboardRevenue
    );

    const analyticsOrders = Number(
      analytics.total_orders ?? dashboardOrders
    );

    const analyticsCustomers = Number(
      analytics.total_customers ?? dashboardCustomers
    );

    const analyticsAOV = Number(
      analytics.average_order_value ??
        analytics.aov ??
        averageOrderValue
    );

    const analyticsRevenueOverview =
      Array.isArray(analytics.monthly_revenue)
        ? analytics.monthly_revenue
        : revenueOverview;

    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Analytics</h1>
            <p>
              Analyze your business performance and key
              metrics.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Revenue</span>
              <h2>
                {formatCurrency(analyticsRevenue)}
              </h2>
              <p>Total realized revenue</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Orders</span>
              <h2>{formatNumber(analyticsOrders)}</h2>
              <p>Total recorded orders</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Customers</span>
              <h2>
                {formatNumber(analyticsCustomers)}
              </h2>
              <p>Total customers</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">
                Average Order
              </span>
              <h2>{formatCurrency(analyticsAOV)}</h2>
              <p>Average completed order value</p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Revenue Analysis</h2>
              <p>Monthly revenue performance</p>
            </div>
          </div>

          <div className="revenue-chart">
            {analyticsRevenueOverview.length > 0 ? (
              <ResponsiveContainer width="100%" height={360}>
                <LineChart
                  data={analyticsRevenueOverview}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="month" />

                  <YAxis
                    tickFormatter={(value) =>
                      `₹${Number(value).toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                No analytics data available.
              </div>
            )}
          </div>
        </div>

        <div className="content-grid">
          <div className="content-card">
            <div className="card-header">
              <div>
                <h2>Sales Performance</h2>
              </div>
            </div>

            <div className="summary-list">
              <div className="summary-row">
                <span>Completed</span>
                <strong>
                  {formatNumber(salesCompleted)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Pending</span>
                <strong>
                  {formatNumber(salesPending)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Cancelled</span>
                <strong>
                  {formatNumber(salesCancelled)}
                </strong>
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <div>
                <h2>Inventory Performance</h2>
              </div>
            </div>

            <div className="summary-list">
              <div className="summary-row">
                <span>Total Products</span>
                <strong>
                  {formatNumber(productList.length)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Total Units</span>
                <strong>
                  {formatNumber(totalInventory)}
                </strong>
              </div>

              <div className="summary-row">
                <span>Low Stock</span>
                <strong>
                  {formatNumber(lowStockCount)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderCustomers() {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Customers</h1>
            <p>
              View customer information and purchase
              activity.
            </p>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Customer List</h2>
              <p>
                {formatNumber(customerList.length)} customers
              </p>
            </div>
          </div>

          {customerList.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>

                <tbody>
                  {customerList.map(
                    (customer, index) => (
                      <tr
                        key={customer.id ?? index}
                      >
                        <td>
                          {customer.id ?? index + 1}
                        </td>

                        <td>
                          <strong>
                            {getCustomerName(customer)}
                          </strong>
                        </td>

                        <td>
                          {customer.email || "N/A"}
                        </td>

                        <td>
                          {formatNumber(
                            customer.total_orders ??
                              customer.orders ??
                              0
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            customer.total_spent ??
                              customer.spent ??
                              0
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              No customers available.
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderSales() {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Sales</h1>
            <p>
              Monitor sales transactions and order status.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Total Sales</span>
              <h2>{formatCurrency(salesTotal)}</h2>
              <p>Total sales value</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Completed</span>
              <h2>{formatNumber(salesCompleted)}</h2>
              <p>Successfully completed</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Pending</span>
              <h2>{formatNumber(salesPending)}</h2>
              <p>Awaiting processing</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Cancelled</span>
              <h2>{formatNumber(salesCancelled)}</h2>
              <p>Cancelled transactions</p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Sales Transactions</h2>
              <p>Complete sales history</p>
            </div>
          </div>

          {salesList.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {salesList.map((sale, index) => (
                    <tr
                      key={
                        sale.id ??
                        sale.order_id ??
                        index
                      }
                    >
                      <td>
                        <strong>
                          {sale.order_id ||
                            sale.id ||
                            "N/A"}
                        </strong>
                      </td>

                      <td>{getOrderCustomer(sale)}</td>

                      <td>{getOrderProduct(sale)}</td>

                      <td>
                        {formatCurrency(
                          sale.amount ??
                            sale.total ??
                            sale.revenue ??
                            0
                        )}
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            sale.status
                          )}
                        >
                          {sale.status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        {sale.order_date
                          ? new Date(
                              sale.order_date
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              No sales data available.
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderProducts() {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Products</h1>
            <p>
              Monitor product performance, pricing and
              inventory.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">
                Total Products
              </span>
              <h2>
                {formatNumber(productList.length)}
              </h2>
              <p>Products in catalog</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">
                Inventory Units
              </span>
              <h2>
                {formatNumber(totalInventory)}
              </h2>
              <p>Total available units</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Low Stock</span>
              <h2>
                {formatNumber(lowStockCount)}
              </h2>
              <p>Products needing attention</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">
                Inventory Value
              </span>
              <h2>
                {formatCurrency(inventoryValue)}
              </h2>
              <p>Estimated current value</p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Product Inventory</h2>
              <p>
                Current product and stock information
              </p>
            </div>
          </div>

          {productList.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {productList.map(
                    (product, index) => {
                      const stock = Number(
                        product.stock ?? 0
                      );

                      return (
                        <tr
                          key={
                            product.id ??
                            product.product_id ??
                            index
                          }
                        >
                          <td>
                            {product.id ?? index + 1}
                          </td>

                          <td>
                            <strong>
                              {getProductName(product)}
                            </strong>
                          </td>

                          <td>
                            {product.category || "N/A"}
                          </td>

                          <td>
                            {formatCurrency(
                              product.price
                            )}
                          </td>

                          <td>{formatNumber(stock)}</td>

                          <td>
                            {stock <= 10 ? (
                              <span className="status pending">
                                Low Stock
                              </span>
                            ) : (
                              <span className="status completed">
                                Healthy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              No products available.
            </div>
          )}
        </div>

        {productPerformanceList.length > 0 && (
          <div className="content-card">
            <div className="card-header">
              <div>
                <h2>Product Performance</h2>
                <p>
                  Sales performance by product
                </p>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Sales</th>
                    <th>Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {productPerformanceList.map(
                    (product, index) => (
                      <tr
                        key={
                          product.id ??
                          product.product ??
                          index
                        }
                      >
                        <td>
                          <strong>
                            {getProductName(product)}
                          </strong>
                        </td>

                        <td>
                          {formatNumber(
                            product.sales ??
                              product.total_sales ??
                              0
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            product.revenue ??
                              product.total_revenue ??
                              0
                          )}
                        </td>

                        <td>
                          {product.status || "N/A"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderAIInsights() {
    const backendInsights = Array.isArray(
      aiInsights.insights
    )
      ? aiInsights.insights
      : Array.isArray(aiInsights.ai_insights)
        ? aiInsights.ai_insights
        : Array.isArray(dashboard.ai_insights)
          ? dashboard.ai_insights
          : [];

    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>AI Insights</h1>
            <p>
              AI-powered analysis to help understand
              business performance and opportunities.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Revenue</span>
              <h2>
                {formatCurrency(dashboardRevenue)}
              </h2>
              <p>Realized business revenue</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">
                Completion Rate
              </span>
              <h2>
                {formatPercentage(aiCompletionRate)}
              </h2>
              <p>Completed order ratio</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">
                Pending Orders
              </span>
              <h2>
                {formatNumber(aiPendingOrders)}
              </h2>
              <p>Orders requiring attention</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-accent"></div>
            <div className="stat-card-content">
              <span className="stat-label">Low Stock</span>
              <h2>
                {formatNumber(lowStockCount)}
              </h2>
              <p>Products requiring monitoring</p>
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Business Intelligence</h2>
              <p>
                Key insights derived from your current
                business data
              </p>
            </div>
          </div>

          <div className="ai-insights-grid">
            <div className="ai-insight-card">
              <h3>Revenue Performance</h3>
              <p>
                Your current realized revenue is{" "}
                <strong>
                  {formatCurrency(dashboardRevenue)}
                </strong>
                .
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Order Completion</h3>
              <p>
                The business has completed{" "}
                <strong>
                  {formatNumber(aiCompletedOrders)}
                </strong>{" "}
                out of{" "}
                <strong>
                  {formatNumber(aiTotalOrders)}
                </strong>{" "}
                recorded orders.
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Pending Revenue Opportunity</h3>
              <p>
                There are{" "}
                <strong>
                  {formatNumber(aiPendingOrders)}
                </strong>{" "}
                pending order(s). Converting pending
                orders can improve realized revenue.
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Inventory Risk</h3>
              <p>
                {lowStockCount > 0
                  ? `${lowStockCount} product(s) are currently below the healthy stock threshold.`
                  : "No products are currently below the healthy stock threshold."}
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Customer Base</h3>
              <p>
                The platform currently tracks{" "}
                <strong>
                  {formatNumber(dashboardCustomers)}
                </strong>{" "}
                customers.
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Inventory Value</h3>
              <p>
                The estimated value of current inventory
                is{" "}
                <strong>
                  {formatCurrency(inventoryValue)}
                </strong>
                .
              </p>
            </div>
          </div>
        </div>

        {backendInsights.length > 0 && (
          <div className="content-card">
            <div className="card-header">
              <div>
                <h2>Backend AI Insights</h2>
                <p>
                  Insights returned directly by the
                  analytics backend
                </p>
              </div>
            </div>

            <div className="ai-insights-grid">
              {backendInsights.map(
                (insight, index) => (
                  <div
                    className="ai-insight-card"
                    key={index}
                  >
                    <h3>
                      {insight.title ||
                        `Insight ${index + 1}`}
                    </h3>

                    <p>
                      {insight.message ||
                        insight.description ||
                        insight.text ||
                        "No additional information available."}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Recommended Actions</h2>
              <p>
                Suggested actions based on current
                business conditions
              </p>
            </div>
          </div>

          <div className="ai-insights-grid">
            {lowStockCount > 0 && (
              <div className="ai-insight-card">
                <h3>Restock Low Inventory</h3>
                <p>
                  Review the{" "}
                  <strong>
                    {formatNumber(lowStockCount)}
                  </strong>{" "}
                  low-stock product(s) and consider
                  replenishing them.
                </p>
              </div>
            )}

            {aiPendingOrders > 0 && (
              <div className="ai-insight-card">
                <h3>Review Pending Orders</h3>
                <p>
                  Follow up on{" "}
                  <strong>
                    {formatNumber(aiPendingOrders)}
                  </strong>{" "}
                  pending order(s) to reduce delays and
                  improve revenue realization.
                </p>
              </div>
            )}

            <div className="ai-insight-card">
              <h3>Monitor Revenue</h3>
              <p>
                Continue tracking monthly revenue trends
                to identify high-performing periods and
                products.
              </p>
            </div>

            <div className="ai-insight-card">
              <h3>Analyze Product Performance</h3>
              <p>
                Compare product sales and revenue regularly
                to identify products that contribute most
                to business growth.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Settings</h1>
            <p>
              Manage your dashboard and application
              configuration.
            </p>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Application Information</h2>
              <p>Current platform configuration</p>
            </div>
          </div>

          <div className="summary-list">
            <div className="summary-row">
              <span>Platform</span>
              <strong>
                AI Business Intelligence
              </strong>
            </div>

            <div className="summary-row">
              <span>Frontend</span>
              <strong>React + Vite</strong>
            </div>

            <div className="summary-row">
              <span>Backend</span>
              <strong>FastAPI</strong>
            </div>

            <div className="summary-row">
              <span>Database</span>
              <strong>PostgreSQL / SQLite</strong>
            </div>

            <div className="summary-row">
              <span>Analytics</span>
              <strong>Business Intelligence</strong>
            </div>

            <div className="summary-row">
              <span>AI Layer</span>
              <strong>AI Business Insights</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderLogout() {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Logout</h1>
            <p>
              You are ready to leave the dashboard.
            </p>
          </div>
        </div>

        <div className="content-card">
          <div className="logout-content">
            <h2>Logout</h2>

            <p>
              This demo dashboard does not currently
              have authentication enabled.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setActivePage("Dashboard")
              }
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderActivePage() {
    switch (activePage) {
      case "Dashboard":
        return renderDashboard();

      case "Analytics":
        return renderAnalytics();

      case "Customers":
        return renderCustomers();

      case "Sales":
        return renderSales();

      case "Products":
        return renderProducts();

      case "AI Insights":
        return renderAIInsights();

      case "Settings":
        return renderSettings();

      case "Logout":
        return renderLogout();

      default:
        return renderDashboard();
    }
  }

  if (loading) {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h2>AI Business</h2>
            <span>Intelligence</span>
          </div>
        </aside>

        <main className="main-content">
          <div className="loading-screen">
            <div className="loading-spinner"></div>

            <h2>Loading Dashboard</h2>

            <p>
              Connecting to your business intelligence
              platform...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h2>AI Business</h2>
            <span>Intelligence</span>
          </div>
        </aside>

        <main className="main-content">
          <div className="error-screen">
            <div className="error-icon">!</div>

            <h2>Backend Connection Error</h2>

            <p>{error}</p>

            <button
              className="primary-button"
              onClick={loadAllData}
            >
              Retry Connection
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>AI Business</h2>
          <span>Intelligence</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={
              activePage === "Dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("Dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className={
              activePage === "Analytics"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("Analytics")
            }
          >
            Analytics
          </button>

          <button
            className={
              activePage === "Customers"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("Customers")
            }
          >
            Customers
          </button>

          <button
            className={
              activePage === "Sales"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("Sales")
            }
          >
            Sales
          </button>

          <button
            className={
              activePage === "Products"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("Products")
            }
          >
            Products
          </button>

          <button
            className={
              activePage === "AI Insights"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("AI Insights")
            }
          >
            AI Insights
          </button>

          <button
            className={
              activePage === "Settings"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("Settings")
            }
          >
            Settings
          </button>

          <button
            className={
              activePage === "Logout"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("Logout")
            }
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h2>{activePage}</h2>
          </div>

          <div className="topbar-right">
            <div className="connection-status">
              <span className="connection-dot"></span>

              <span>Backend Connected</span>
            </div>
          </div>
        </header>

        {apiErrors.length > 0 && (
          <div
            style={{
              margin: "15px 20px 0",
              padding: "12px 16px",
              borderRadius: "8px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              fontSize: "14px",
            }}
          >
            <strong>
              Some data could not be loaded:
            </strong>

            <ul
              style={{
                margin: "8px 0 0 20px",
              }}
            >
              {apiErrors.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>

            <button
              className="primary-button"
              style={{
                marginTop: "10px",
              }}
              onClick={loadAllData}
            >
              Retry Data Loading
            </button>
          </div>
        )}

        {renderActivePage()}
      </main>
    </div>
  );
}

export default App;
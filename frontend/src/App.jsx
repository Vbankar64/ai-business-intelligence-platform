
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const ENDPOINTS = [
  { key: "dashboard", name: "Dashboard", path: "/dashboard" },
  { key: "analytics", name: "Analytics", path: "/analytics" },
  { key: "customers", name: "Customers", path: "/customers" },
  { key: "sales", name: "Sales", path: "/sales" },
  { key: "products", name: "Products", path: "/products" },
  { key: "aiInsights", name: "AI Insights", path: "/ai-insights" },
];

const NAV_ITEMS = [
  "Dashboard",
  "Analytics",
  "Customers",
  "Sales",
  "Products",
  "AI Insights",
  "Settings",
  "Logout",
];

const EMPTY_DATA = {
  dashboard: {},
  analytics: {},
  customers: {},
  sales: {},
  products: {},
  aiInsights: {},
};

async function fetchJson(endpoint) {
  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`);
  } catch (error) {
    throw new Error(
      `Cannot reach ${API_URL}. Check that the backend is running and CORS is configured.`
    );
  }

  if (!response.ok) {
    let detail = "";

    try {
      const body = await response.json();
      detail = body.detail
        ? ` — ${typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail)}`
        : "";
    } catch {
      // The response may not contain JSON.
    }

    throw new Error(
      `${endpoint} returned ${response.status} ${response.statusText}${detail}`
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`${endpoint} returned an invalid JSON response.`);
  }
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getList(data, ...keys) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function firstNumber(values, fallback = 0) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
  }

  return fallback;
}

function formatCurrency(value) {
  return `₹${toNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value) {
  return toNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatPercentage(value) {
  return `${toNumber(value).toFixed(1)}%`;
}

function getStatus(status) {
  const value = String(status || "Unknown").toLowerCase();

  if (["completed", "complete", "delivered", "success"].includes(value)) {
    return "completed";
  }

  if (["pending", "processing", "in progress"].includes(value)) {
    return "pending";
  }

  if (["cancelled", "canceled", "failed"].includes(value)) {
    return "cancelled";
  }

  return "";
}

function getStatusClass(status) {
  const statusClass = getStatus(status);
  return statusClass ? `status ${statusClass}` : "status";
}

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
  if (typeof order?.customer === "object" && order.customer !== null) {
    return getCustomerName(order.customer);
  }

  return order?.customer_name || order?.customer || "Unknown Customer";
}

function getOrderProduct(order) {
  if (typeof order?.product === "object" && order.product !== null) {
    return getProductName(order.product);
  }

  return order?.product_name || order?.product || "Unknown Product";
}

function getOrderAmount(order) {
  return firstNumber([
    order?.amount,
    order?.total_amount,
    order?.total,
    order?.revenue,
    order?.price,
  ]);
}

function getOrderDate(order) {
  const value = order?.order_date || order?.date || order?.created_at;

  if (!value) return "N/A";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("en-IN");
}

function isCompleted(order) {
  return getStatus(order?.status) === "completed";
}

function isPending(order) {
  return getStatus(order?.status) === "pending";
}

function isCancelled(order) {
  return getStatus(order?.status) === "cancelled";
}

function StatCard({ label, value, description }) {
  return (
    <div className="stat-card">
      <div className="stat-card-accent" />
      <div className="stat-card-content">
        <span className="stat-label">{label}</span>
        <h2>{value}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InsightCard({ title, children }) {
  return (
    <div className="ai-insight-card">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function PageHeader({ title, description }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}

function DataTable({ columns, rows, emptyMessage = "No data available." }) {
  if (!rows.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? row.order_id ?? row.product_id ?? index}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row, index)
                    : row[column.key] ?? "N/A"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RevenueChart({ data, height = 320 }) {
  if (!data.length) {
    return <div className="empty-state">No revenue data available.</div>;
  }

  return (
    <div className="revenue-chart">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis
            tickFormatter={(value) =>
              `₹${Number(value).toLocaleString("en-IN")}`
            }
          />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [apiErrors, setApiErrors] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAllData = useCallback(async () => {
    setRefreshing(true);
    setConnectionError("");
    setApiErrors([]);

    try {
      const health = await fetchJson("/health");

      if (
        health?.status &&
        !["healthy", "ok"].includes(String(health.status).toLowerCase())
      ) {
        throw new Error(
          `Backend health check returned status: ${health.status}`
        );
      }

      setBackendConnected(true);

      const results = await Promise.allSettled(
        ENDPOINTS.map((item) => fetchJson(item.path))
      );

      const nextData = { ...EMPTY_DATA };
      const errors = [];

      results.forEach((result, index) => {
        const item = ENDPOINTS[index];

        if (result.status === "fulfilled") {
          nextData[item.key] = result.value ?? {};
        } else {
          errors.push({
            name: item.name,
            endpoint: item.path,
            message:
              result.reason?.message || "Unable to load this endpoint.",
          });
        }
      });

      // Keep successful results, even when one endpoint fails.
      setData((previous) => {
        const merged = { ...previous };

        ENDPOINTS.forEach((item) => {
          const resultIndex = ENDPOINTS.findIndex(
            (endpoint) => endpoint.key === item.key
          );

          if (results[resultIndex].status === "fulfilled") {
            merged[item.key] = nextData[item.key];
          }
        });

        return merged;
      });

      setApiErrors(errors);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Backend connection error:", error);
      setBackendConnected(false);
      setConnectionError(
        error?.message || "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const dashboard = asObject(data.dashboard);
  const analytics = asObject(data.analytics);
  const customers = asObject(data.customers);
  const sales = asObject(data.sales);
  const products = asObject(data.products);
  const aiInsights = asObject(data.aiInsights);

  const customerList = getList(customers, "customers", "data", "items");
  const productList = getList(products, "products", "data", "items");
  const salesList = getList(sales, "orders", "sales", "transactions", "data", "items");

  const revenueOverview = getList(
    dashboard,
    "revenue_overview",
    "monthly_revenue"
  );

  const analyticsRevenueOverview = getList(
    analytics,
    "monthly_revenue",
    "revenue_overview"
  );

  const chartData = analyticsRevenueOverview.length
    ? analyticsRevenueOverview
    : revenueOverview;

  const productPerformanceList = getList(
    analytics,
    "product_performance",
    "products"
  );

  const completedOrders = salesList.filter(isCompleted);
  const pendingOrders = salesList.filter(isPending);
  const cancelledOrders = salesList.filter(isCancelled);

  const dashboardRevenue = firstNumber([
    dashboard.total_revenue,
    analytics.total_revenue,
    sales.total_revenue,
  ]);

  const dashboardCustomers = firstNumber([
    dashboard.total_customers,
    analytics.total_customers,
    customers.total_customers,
  ], customerList.length);

  const dashboardOrders = firstNumber([
    dashboard.total_orders,
    analytics.total_orders,
    sales.total_orders,
    sales.total_sales_count,
  ], salesList.length);

  const dashboardConversion = firstNumber([
    dashboard.conversion_rate,
    analytics.conversion_rate,
  ]);

  const salesCompleted = firstNumber([
    sales.completed_orders,
    sales.completed,
    sales.completed_sales,
  ], completedOrders.length);

  const salesPending = firstNumber([
    sales.pending_orders,
    sales.pending,
    sales.pending_sales,
  ], pendingOrders.length);

  const salesCancelled = firstNumber([
    sales.cancelled_orders,
    sales.cancelled,
    sales.cancelled_sales,
  ], cancelledOrders.length);

  const salesTotal = firstNumber([
    sales.total_sales_value,
    sales.total_revenue,
    sales.sales_value,
  ], salesList.reduce((total, sale) => total + getOrderAmount(sale), 0));

  const lowStockProducts = productList.filter(
    (product) => toNumber(product.stock ?? product.quantity) <= 10
  );

  const lowStockCount = firstNumber([
    dashboard.low_stock_count,
    products.low_stock_count,
  ], lowStockProducts.length);

  const totalInventory = productList.reduce(
    (total, product) =>
      total + toNumber(product.stock ?? product.quantity),
    0
  );

  const healthyStockProducts = productList.filter(
    (product) => toNumber(product.stock ?? product.quantity) > 10
  ).length;

  const calculatedInventoryValue = productList.reduce(
    (total, product) =>
      total +
      toNumber(product.price ?? product.unit_price) *
        toNumber(product.stock ?? product.quantity),
    0
  );

  const inventoryValue = firstNumber([
    products.inventory_value,
    products.total_inventory_value,
    dashboard.inventory_value,
  ], calculatedInventoryValue);

  const averageOrderValue = firstNumber([
    analytics.average_order_value,
    analytics.aov,
    dashboard.average_order_value,
  ], salesCompleted > 0 ? dashboardRevenue / salesCompleted : 0);

  const aiSummary = asObject(aiInsights.summary);

  const aiPendingOrders = firstNumber([
    aiSummary.pending_orders,
    aiInsights.pending_orders,
  ], salesPending);

  const aiCompletedOrders = firstNumber([
    aiSummary.completed_orders,
    aiInsights.completed_orders,
  ], salesCompleted);

  const aiTotalOrders = firstNumber([
    aiSummary.total_orders,
    aiInsights.total_orders,
  ], dashboardOrders);

  const aiCompletionRate =
    aiTotalOrders > 0 ? (aiCompletedOrders / aiTotalOrders) * 100 : 0;

  const recentOrders = getList(dashboard, "recent_orders").length
    ? getList(dashboard, "recent_orders")
    : salesList.slice(0, 5);

  const backendInsights = getList(
    aiInsights,
    "insights",
    "ai_insights",
    "recommendations"
  );

  const revenueHealth =
    dashboardRevenue > 0
      ? { className: "good", text: "Revenue Recorded" }
      : { className: "warning", text: "No Revenue Recorded" };

  const inventoryHealth =
    lowStockCount === 0
      ? { className: "good", text: "Healthy" }
      : lowStockCount <= 2
        ? { className: "warning", text: "Monitor" }
        : { className: "danger", text: "Needs Attention" };

  const orderHealth =
    salesPending === 0
      ? { className: "good", text: "No Pending Orders" }
      : { className: "warning", text: `${salesPending} Pending` };

  const completionHealth =
    aiCompletionRate >= 70
      ? { className: "good", text: "Strong" }
      : aiCompletionRate >= 40
        ? { className: "warning", text: "Moderate" }
        : { className: "danger", text: "Low" };

  const recentOrderColumns = [
    {
      key: "order_id",
      label: "Order ID",
      render: (row) => row.order_id || row.id || "N/A",
    },
    {
      key: "customer",
      label: "Customer",
      render: (row) => getOrderCustomer(row),
    },
    {
      key: "product",
      label: "Product",
      render: (row) => getOrderProduct(row),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => formatCurrency(getOrderAmount(row)),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={getStatusClass(row.status)}>
          {row.status || "Unknown"}
        </span>
      ),
    },
    {
      key: "order_date",
      label: "Date",
      render: (row) => getOrderDate(row),
    },
  ];

  function renderDashboard() {
    return (
      <div className="page-content">
        <PageHeader
          title="Business Dashboard"
          description="Monitor revenue, customers, sales, inventory, and business performance."
        />

        <div className="stats-grid">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(dashboardRevenue)}
            description="Revenue reported by the backend"
          />
          <StatCard
            label="Total Customers"
            value={formatNumber(dashboardCustomers)}
            description="Registered customers"
          />
          <StatCard
            label="Total Orders"
            value={formatNumber(dashboardOrders)}
            description="Recorded orders"
          />
          <StatCard
            label="Conversion Rate"
            value={formatPercentage(dashboardConversion)}
            description="Backend-reported conversion rate"
          />
        </div>

        <div className="revenue-section">
          <div className="revenue-chart-card">
            <div className="card-header">
              <div>
                <h2>Monthly Revenue</h2>
                <p>Revenue performance over time</p>
              </div>
            </div>
            <RevenueChart data={chartData} />
          </div>

          <div className="revenue-summary-card">
            <div className="card-header">
              <div>
                <h2>Revenue Performance</h2>
                <p>Key sales indicators</p>
              </div>
            </div>
            <div className="summary-list">
              <SummaryRow label="Total Revenue" value={formatCurrency(dashboardRevenue)} />
              <SummaryRow label="Completed Orders" value={formatNumber(salesCompleted)} />
              <SummaryRow label="Pending Orders" value={formatNumber(salesPending)} />
              <SummaryRow label="Cancelled Orders" value={formatNumber(salesCancelled)} />
              <SummaryRow label="Average Order Value" value={formatCurrency(averageOrderValue)} />
            </div>
          </div>
        </div>

        <div className="inventory-section">
          <div className="inventory-overview-card">
            <div className="card-header">
              <div>
                <h2>Inventory Intelligence</h2>
                <p>Current product and stock indicators</p>
              </div>
            </div>
            <div className="inventory-stats">
              <div className="inventory-stat">
                <span>Total Products</span>
                <strong>{formatNumber(productList.length)}</strong>
              </div>
              <div className="inventory-stat">
                <span>Total Units</span>
                <strong>{formatNumber(totalInventory)}</strong>
              </div>
              <div className="inventory-stat warning">
                <span>Low Stock</span>
                <strong>{formatNumber(lowStockCount)}</strong>
              </div>
              <div className="inventory-stat healthy">
                <span>Healthy Stock</span>
                <strong>{formatNumber(healthyStockProducts)}</strong>
              </div>
              <div className="inventory-stat">
                <span>Inventory Value</span>
                <strong>{formatCurrency(inventoryValue)}</strong>
              </div>
            </div>
          </div>

          <div className="low-stock-card">
            <div className="card-header">
              <div>
                <h2>Low Stock Alerts</h2>
                <p>Products with 10 or fewer units</p>
              </div>
            </div>

            {lowStockProducts.length ? (
              <div className="low-stock-list">
                {lowStockProducts.map((product, index) => (
                  <div
                    className="low-stock-item"
                    key={product.id ?? product.product_id ?? index}
                  >
                    <div className="low-stock-info">
                      <div className="low-stock-icon">!</div>
                      <div>
                        <strong>{getProductName(product)}</strong>
                        <span>
                          {formatNumber(product.stock ?? product.quantity)} units remaining
                        </span>
                      </div>
                    </div>
                    <div className="low-stock-action">
                      <span className="stock-warning">Low Stock</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="inventory-success">
                <strong>No low-stock products detected</strong>
                <p>Based on the currently loaded product data.</p>
              </div>
            )}
          </div>
        </div>

        <div className="content-grid">
          <div className="content-card">
            <div className="card-header">
              <div>
                <h2>Business Health</h2>
                <p>Indicators based on loaded data</p>
              </div>
            </div>
            <div className="business-health">
              {[
                ["Revenue Performance", revenueHealth],
                ["Inventory", inventoryHealth],
                ["Order Processing", orderHealth],
                ["Order Completion", completionHealth],
              ].map(([label, health]) => (
                <div className="health-item" key={label}>
                  <div className="health-item-left">
                    <span className={`health-indicator ${health.className}`} />
                    <span>{label}</span>
                  </div>
                  <strong>{health.text}</strong>
                </div>
              ))}
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
              <SummaryRow label="Customers" value={formatNumber(dashboardCustomers)} />
              <SummaryRow label="Orders" value={formatNumber(dashboardOrders)} />
              <SummaryRow label="Revenue" value={formatCurrency(dashboardRevenue)} />
              <SummaryRow label="Inventory Units" value={formatNumber(totalInventory)} />
              <SummaryRow label="Low Stock Products" value={formatNumber(lowStockCount)} />
            </div>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Business Insights</h2>
              <p>Rule-based observations derived from currently loaded metrics</p>
            </div>
          </div>
          <div className="ai-insights-grid">
            <InsightCard title="Revenue">
              Reported revenue is {formatCurrency(dashboardRevenue)}.
              Compare this figure across periods to identify growth or decline.
            </InsightCard>
            <InsightCard title="Order Completion">
              {formatNumber(aiCompletedOrders)} of {formatNumber(aiTotalOrders)} recorded
              orders are completed based on the available order data.
            </InsightCard>
            <InsightCard title="Inventory">
              {lowStockCount > 0
                ? `${formatNumber(lowStockCount)} product(s) may need restocking.`
                : "No low-stock products were detected in the loaded data."}
            </InsightCard>
            <InsightCard title="Pending Orders">
              {formatNumber(aiPendingOrders)} order(s) are pending. Review them to avoid
              processing delays.
            </InsightCard>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Recent Orders</h2>
              <p>Latest available business transactions</p>
            </div>
          </div>
          <DataTable
            columns={recentOrderColumns}
            rows={recentOrders}
            emptyMessage="No recent orders are available."
          />
        </div>
      </div>
    );
  }

  function renderAnalytics() {
    const analyticsRevenue = firstNumber([
      analytics.total_revenue,
      dashboard.total_revenue,
    ]);

    const analyticsOrders = firstNumber([
      analytics.total_orders,
      dashboard.total_orders,
    ], salesList.length);

    const analyticsCustomers = firstNumber([
      analytics.total_customers,
      dashboard.total_customers,
    ], customerList.length);

    const analyticsAOV = firstNumber([
      analytics.average_order_value,
      analytics.aov,
    ], averageOrderValue);

    return (
      <div className="page-content">
        <PageHeader
          title="Analytics"
          description="Explore revenue trends and key business performance indicators."
        />

        <div className="stats-grid">
          <StatCard label="Revenue" value={formatCurrency(analyticsRevenue)} description="Reported revenue" />
          <StatCard label="Orders" value={formatNumber(analyticsOrders)} description="Recorded orders" />
          <StatCard label="Customers" value={formatNumber(analyticsCustomers)} description="Recorded customers" />
          <StatCard label="Average Order Value" value={formatCurrency(analyticsAOV)} description="Backend value or calculated fallback" />
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Revenue Analysis</h2>
              <p>Monthly revenue performance</p>
            </div>
          </div>
          <RevenueChart data={chartData} height={360} />
        </div>

        <div className="content-grid">
          <div className="content-card">
            <div className="card-header"><h2>Sales Performance</h2></div>
            <div className="summary-list">
              <SummaryRow label="Completed Orders" value={formatNumber(salesCompleted)} />
              <SummaryRow label="Pending Orders" value={formatNumber(salesPending)} />
              <SummaryRow label="Cancelled Orders" value={formatNumber(salesCancelled)} />
              <SummaryRow label="Sales Value" value={formatCurrency(salesTotal)} />
            </div>
          </div>

          <div className="content-card">
            <div className="card-header"><h2>Inventory Performance</h2></div>
            <div className="summary-list">
              <SummaryRow label="Products" value={formatNumber(productList.length)} />
              <SummaryRow label="Total Units" value={formatNumber(totalInventory)} />
              <SummaryRow label="Low Stock Products" value={formatNumber(lowStockCount)} />
              <SummaryRow label="Inventory Value" value={formatCurrency(inventoryValue)} />
            </div>
          </div>
        </div>

        {productPerformanceList.length > 0 && (
          <div className="content-card">
            <div className="card-header">
              <div><h2>Product Performance</h2><p>Performance data returned by the backend</p></div>
            </div>
            <DataTable
              rows={productPerformanceList}
              columns={[
                { key: "product", label: "Product", render: (row) => getProductName(row) },
                { key: "sales", label: "Sales", render: (row) => formatNumber(row.sales ?? row.total_sales) },
                { key: "revenue", label: "Revenue", render: (row) => formatCurrency(row.revenue ?? row.total_revenue) },
                { key: "status", label: "Status", render: (row) => row.status || "N/A" },
              ]}
            />
          </div>
        )}
      </div>
    );
  }

  function renderCustomers() {
    return (
      <div className="page-content">
        <PageHeader
          title="Customers"
          description="Review customer information and purchase activity."
        />

        <div className="content-card">
          <div className="card-header">
            <div><h2>Customer List</h2><p>{formatNumber(customerList.length)} loaded customers</p></div>
          </div>
          <DataTable
            rows={customerList}
            emptyMessage="No customers are available from the backend."
            columns={[
              { key: "id", label: "ID", render: (row, index) => row.id ?? row.customer_id ?? index + 1 },
              { key: "name", label: "Name", render: (row) => <strong>{getCustomerName(row)}</strong> },
              { key: "email", label: "Email", render: (row) => row.email || "N/A" },
              { key: "orders", label: "Total Orders", render: (row) => formatNumber(row.total_orders ?? row.orders) },
              { key: "spent", label: "Total Spent", render: (row) => formatCurrency(row.total_spent ?? row.spent) },
            ]}
          />
        </div>
      </div>
    );
  }

  function renderSales() {
    return (
      <div className="page-content">
        <PageHeader
          title="Sales"
          description="Monitor transactions, sales value, and order status."
        />

        <div className="stats-grid">
          <StatCard label="Sales Value" value={formatCurrency(salesTotal)} description="Reported or calculated transaction value" />
          <StatCard label="Completed" value={formatNumber(salesCompleted)} description="Completed orders" />
          <StatCard label="Pending" value={formatNumber(salesPending)} description="Orders awaiting processing" />
          <StatCard label="Cancelled" value={formatNumber(salesCancelled)} description="Cancelled orders" />
        </div>

        <div className="content-card">
          <div className="card-header">
            <div><h2>Sales Transactions</h2><p>Available sales history</p></div>
          </div>
          <DataTable
            rows={salesList}
            emptyMessage="No sales transactions are available."
            columns={recentOrderColumns}
          />
        </div>
      </div>
    );
  }

  function renderProducts() {
    return (
      <div className="page-content">
        <PageHeader
          title="Products"
          description="Review product details, pricing, and inventory levels."
        />

        <div className="stats-grid">
          <StatCard label="Total Products" value={formatNumber(productList.length)} description="Products in catalog" />
          <StatCard label="Inventory Units" value={formatNumber(totalInventory)} description="Units recorded in stock" />
          <StatCard label="Low Stock" value={formatNumber(lowStockCount)} description="Products requiring review" />
          <StatCard label="Inventory Value" value={formatCurrency(inventoryValue)} description="Estimated value of current stock" />
        </div>

        <div className="content-card">
          <div className="card-header">
            <div><h2>Product Inventory</h2><p>Product and stock information</p></div>
          </div>
          <DataTable
            rows={productList}
            emptyMessage="No products are available from the backend."
            columns={[
              { key: "id", label: "ID", render: (row, index) => row.id ?? row.product_id ?? index + 1 },
              { key: "name", label: "Product", render: (row) => <strong>{getProductName(row)}</strong> },
              { key: "category", label: "Category", render: (row) => row.category || "N/A" },
              { key: "price", label: "Price", render: (row) => formatCurrency(row.price ?? row.unit_price) },
              { key: "stock", label: "Stock", render: (row) => formatNumber(row.stock ?? row.quantity) },
              {
                key: "status",
                label: "Status",
                render: (row) =>
                  toNumber(row.stock ?? row.quantity) <= 10
                    ? <span className="status pending">Low Stock</span>
                    : <span className="status completed">Healthy</span>,
              },
            ]}
          />
        </div>

        {productPerformanceList.length > 0 && (
          <div className="content-card">
            <div className="card-header"><h2>Product Performance</h2></div>
            <DataTable
              rows={productPerformanceList}
              columns={[
                { key: "product", label: "Product", render: (row) => getProductName(row) },
                { key: "sales", label: "Sales", render: (row) => formatNumber(row.sales ?? row.total_sales) },
                { key: "revenue", label: "Revenue", render: (row) => formatCurrency(row.revenue ?? row.total_revenue) },
                { key: "status", label: "Status", render: (row) => row.status || "N/A" },
              ]}
            />
          </div>
        )}
      </div>
    );
  }

  function renderAIInsights() {
    const hasBackendInsights = backendInsights.length > 0;

    return (
      <div className="page-content">
        <PageHeader
          title="AI Insights"
          description="Understand business signals, operational risks, and recommended actions."
        />

        <div className="stats-grid">
          <StatCard label="Revenue" value={formatCurrency(dashboardRevenue)} description="Reported business revenue" />
          <StatCard label="Completion Rate" value={formatPercentage(aiCompletionRate)} description="Completed orders divided by total orders" />
          <StatCard label="Pending Orders" value={formatNumber(aiPendingOrders)} description="Orders requiring review" />
          <StatCard label="Low Stock" value={formatNumber(lowStockCount)} description="Products at or below 10 units" />
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Business Intelligence</h2>
              <p>Rule-based observations from current business metrics</p>
            </div>
          </div>

          <div className="ai-insights-grid">
            <InsightCard title="Revenue Performance">
              Reported revenue is {formatCurrency(dashboardRevenue)}. Compare it against
              previous periods before concluding whether revenue is growing.
            </InsightCard>
            <InsightCard title="Order Completion">
              {formatNumber(aiCompletedOrders)} of {formatNumber(aiTotalOrders)} recorded
              orders are completed. This calculation depends on the data available to the frontend.
            </InsightCard>
            <InsightCard title="Pending Orders">
              {aiPendingOrders > 0
                ? `Review the ${formatNumber(aiPendingOrders)} pending order(s) to identify processing delays.`
                : "No pending orders were reported in the currently loaded data."}
            </InsightCard>
            <InsightCard title="Inventory Risk">
              {lowStockCount > 0
                ? `${formatNumber(lowStockCount)} product(s) may need restocking. Confirm demand and supplier lead times first.`
                : "No low-stock products were detected in the currently loaded product data."}
            </InsightCard>
            <InsightCard title="Customer Base">
              The platform currently reports {formatNumber(dashboardCustomers)} customer(s).
              Track repeat purchases and customer spending to understand retention.
            </InsightCard>
            <InsightCard title="Inventory Value">
              The estimated current inventory value is {formatCurrency(inventoryValue)}.
              This estimate uses backend values when provided, otherwise price multiplied by stock.
            </InsightCard>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Recommended Actions</h2>
              <p>Practical actions suggested from the available metrics</p>
            </div>
          </div>

          <div className="ai-insights-grid">
            {lowStockCount > 0 && (
              <InsightCard title="Review Low Stock">
                Inspect the low-stock list and decide which products need replenishment.
              </InsightCard>
            )}
            {aiPendingOrders > 0 && (
              <InsightCard title="Follow Up on Pending Orders">
                Check pending orders for payment, fulfilment, or customer communication issues.
              </InsightCard>
            )}
            <InsightCard title="Monitor Revenue">
              Compare monthly revenue with prior periods and investigate unusual changes.
            </InsightCard>
            <InsightCard title="Review Product Performance">
              Compare product sales and revenue to understand which products contribute most.
            </InsightCard>
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h2>Backend-Provided Insights</h2>
              <p>Messages returned by the /ai-insights API</p>
            </div>
          </div>

          {hasBackendInsights ? (
            <div className="ai-insights-grid">
              {backendInsights.map((insight, index) => {
                const item = typeof insight === "string"
                  ? { message: insight }
                  : asObject(insight);

                return (
                  <InsightCard
                    key={item.id ?? index}
                    title={item.title || item.category || `Backend Insight ${index + 1}`}
                  >
                    {item.message || item.description || item.text || JSON.stringify(item)}
                  </InsightCard>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              The backend did not return any separate insight messages. The metric-based
              observations above are frontend rules, not proof of an AI model response.
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="page-content">
        <PageHeader
          title="Settings"
          description="Review the current application configuration."
        />

        <div className="content-card">
          <div className="card-header"><h2>Application Information</h2></div>
          <div className="summary-list">
            <SummaryRow label="Platform" value="AI Business Intelligence" />
            <SummaryRow label="Frontend" value="React + Vite" />
            <SummaryRow label="Backend" value="FastAPI" />
            <SummaryRow label="Database" value="Configured by backend" />
            <SummaryRow label="Charts" value="Recharts" />
            <SummaryRow label="API URL" value={API_URL} />
            <SummaryRow
              label="Connection"
              value={backendConnected ? "Connected" : "Disconnected"}
            />
            <SummaryRow
              label="Last successful data refresh"
              value={lastUpdated ? lastUpdated.toLocaleString("en-IN") : "Not available"}
            />
          </div>
        </div>
      </div>
    );
  }

  function renderLogout() {
    return (
      <div className="page-content">
        <PageHeader
          title="Logout"
          description="Return to the dashboard."
        />
        <div className="content-card">
          <div className="logout-content">
            <h2>Demo Application</h2>
            <p>
              Authentication is not implemented in this demo. This button only returns
              you to the dashboard; it does not log out of an account.
            </p>
            <button
              className="primary-button"
              onClick={() => setActivePage("Dashboard")}
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
      case "Dashboard": return renderDashboard();
      case "Analytics": return renderAnalytics();
      case "Customers": return renderCustomers();
      case "Sales": return renderSales();
      case "Products": return renderProducts();
      case "AI Insights": return renderAIInsights();
      case "Settings": return renderSettings();
      case "Logout": return renderLogout();
      default: return renderDashboard();
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
            <div className="loading-spinner" />
            <h2>Loading Dashboard</h2>
            <p>Connecting to your business intelligence platform...</p>
          </div>
        </main>
      </div>
    );
  }

  if (connectionError) {
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
            <p>{connectionError}</p>
            <p>Confirm that FastAPI is running at {API_URL}.</p>
            <button
              className="primary-button"
              onClick={loadAllData}
              disabled={refreshing}
            >
              {refreshing ? "Connecting..." : "Retry Connection"}
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
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className={activePage === item ? "nav-item active" : "nav-item"}
              onClick={() => setActivePage(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h2>{activePage}</h2>
          </div>

          <div className="topbar-right">
            <div className="connection-status">
              <span
                className="connection-dot"
                style={{
                  background: backendConnected ? "#16a34a" : "#dc2626",
                }}
              />
              <span>
                {backendConnected ? "Backend Connected" : "Backend Disconnected"}
              </span>
            </div>

            <button
              className="primary-button"
              onClick={loadAllData}
              disabled={refreshing}
              title="Reload data from the backend"
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </header>

        {apiErrors.length > 0 && (
          <div
            role="alert"
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
            <strong>Some data could not be loaded:</strong>
            <ul style={{ margin: "8px 0 0 20px" }}>
              {apiErrors.map((item) => (
                <li key={item.endpoint}>
                  <strong>{item.name} ({item.endpoint}):</strong> {item.message}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: "8px" }}>
              Other pages may still display successfully loaded data.
            </p>
          </div>
        )}

        {lastUpdated && (
          <div
            style={{
              margin: "8px 20px 0",
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            Last refreshed: {lastUpdated.toLocaleString("en-IN")}
          </div>
        )}

        {renderActivePage()}
      </main>
    </div>
  );
}

export default App;

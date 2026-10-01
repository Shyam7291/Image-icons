import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ============================================================================
// STONERATE ADMIN USERS & PARTNERS DIRECTORY
// File: StoneRateAdminUsersPartners.js
// ============================================================================

/**
 * Role Definitions & Color Schemes
 */
const ROLES = [
  {
    key: "buyer",
    label: "Buyers",
    singular: "Buyer",
    icon: "user",
    avatarBg: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    accentColor: "#2563eb",
    softBg: "rgba(37, 99, 235, 0.08)",
    badgeColor: "#1d4ed8",
    fieldLabel: "Business / Entity",
  },
  {
    key: "stone_seller",
    label: "Stone Sellers",
    singular: "Stone Seller",
    icon: "cube",
    avatarBg: "linear-gradient(135deg, #f97316, #c2560b)",
    accentColor: "#f97316",
    softBg: "rgba(249, 115, 22, 0.08)",
    badgeColor: "#c2560b",
    fieldLabel: "Plant or Business",
  },
  {
    key: "sand_seller",
    label: "Sand Sellers",
    singular: "Sand Seller",
    icon: "layers",
    avatarBg: "linear-gradient(135deg, #d97706, #b45309)",
    accentColor: "#d97706",
    softBg: "rgba(217, 119, 6, 0.08)",
    badgeColor: "#b45309",
    fieldLabel: "Sand Yard",
  },
  {
    key: "transporter",
    label: "Transporters",
    singular: "Transporter",
    icon: "truck",
    avatarBg: "linear-gradient(135deg, #10b981, #047857)",
    accentColor: "#10b981",
    softBg: "rgba(16, 185, 129, 0.08)",
    badgeColor: "#047857",
    fieldLabel: "Agency Name",
  },
  {
    key: "admin",
    label: "Admins",
    singular: "Admin",
    icon: "shield",
    avatarBg: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    accentColor: "#8b5cf6",
    softBg: "rgba(139, 92, 246, 0.08)",
    badgeColor: "#6d28d9",
    fieldLabel: "Admin Role",
  },
];

/**
 * Comprehensive Mock Data for Standalone & Fallback Execution
 */
const MOCK_DATA = {
  buyer: {
    summary: { total: 200, pastMonth: 94, locations: 18 },
    records: [
      {
        publicId: "BYR-260104-028",
        role: "buyer",
        name: "Sri Venkateshwara Infra",
        businessName: "SVI Developers Ltd",
        city: "Bengaluru",
        state: "Karnataka",
        joinedAt: "2026-09-28T10:30:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "BYR-260104-031",
        role: "buyer",
        name: "Apex Buildtech Projects",
        businessName: "Apex Infra Consortium",
        city: "Hoskote",
        state: "Karnataka",
        joinedAt: "2026-09-27T14:15:00.000Z",
        status: "verified",
        phoneVerified: true,
      },
      {
        publicId: "BYR-260103-019",
        role: "buyer",
        name: "Shyam Sundar Constructions",
        businessName: "Shyam Group",
        city: "Sonbhadra",
        state: "Uttar Pradesh",
        joinedAt: "2026-09-25T08:45:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "BYR-260102-014",
        role: "buyer",
        name: "Nandi Developers & Highway Works",
        businessName: "Nandi Roads LLP",
        city: "Tumkur",
        state: "Karnataka",
        joinedAt: "2026-09-20T11:20:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "BYR-260098-009",
        role: "buyer",
        name: "GMR Southern Logistics Hub",
        businessName: "GMR Infra",
        city: "Hyderabad",
        state: "Telangana",
        joinedAt: "2026-09-15T16:00:00.000Z",
        status: "verified",
        phoneVerified: true,
      },
      {
        publicId: "BYR-260091-002",
        role: "buyer",
        name: "Kaveri Stone Works & ReadyMix",
        businessName: "Kaveri RMC Pvt Ltd",
        city: "Mysuru",
        state: "Karnataka",
        joinedAt: "2026-09-10T09:10:00.000Z",
        status: "pending",
        phoneVerified: false,
      },
      {
        publicId: "BYR-260085-045",
        role: "buyer",
        name: "Vandana Urban Projects",
        businessName: "Vandana Homes",
        city: "Pune",
        state: "Maharashtra",
        joinedAt: "2026-09-02T13:40:00.000Z",
        status: "inactive",
        phoneVerified: true,
      },
      {
        publicId: "BYR-260079-012",
        role: "buyer",
        name: "Mahalaxmi Aggregates User",
        businessName: "Mahalaxmi Builders",
        city: "Nagpur",
        state: "Maharashtra",
        joinedAt: "2026-08-28T17:30:00.000Z",
        status: "active",
        phoneVerified: true,
      },
    ],
  },
  stone_seller: {
    summary: { total: 86, pastMonth: 23, locations: 12 },
    records: [
      {
        publicId: "SEL-014",
        role: "stone_seller",
        name: "Ramesh Reddy",
        businessName: "StoneHub Supplies Unit 1",
        city: "Bengaluru",
        state: "Karnataka",
        joinedAt: "2026-09-28T09:00:00.000Z",
        status: "verified",
        phoneVerified: true,
      },
      {
        publicId: "SEL-031",
        role: "stone_seller",
        name: "Vineeth Kumar",
        businessName: "Vineeth Crushing Plant",
        city: "Hoskote",
        state: "Karnataka",
        joinedAt: "2026-09-26T12:00:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "SEL-055",
        role: "stone_seller",
        name: "Rajeshwar Rao",
        businessName: "BuildRock Aggregates Quarry",
        city: "Malur",
        state: "Karnataka",
        joinedAt: "2026-09-24T15:20:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "SEL-072",
        role: "stone_seller",
        name: "Shyam Narayan Yadav",
        businessName: "Shyam Stone Yards & Crushers",
        city: "Sonbhadra",
        state: "Uttar Pradesh",
        joinedAt: "2026-09-21T11:10:00.000Z",
        status: "verified",
        phoneVerified: true,
      },
      {
        publicId: "SEL-089",
        role: "stone_seller",
        name: "Anand Murthy",
        businessName: "Bidadi Blue Metal Crushers",
        city: "Ramanagara",
        state: "Karnataka",
        joinedAt: "2026-09-18T10:45:00.000Z",
        status: "pending",
        phoneVerified: true,
      },
      {
        publicId: "SEL-104",
        role: "stone_seller",
        name: "Gajendra Singh",
        businessName: "Mirzapur Granite Quarry 4",
        city: "Mirzapur",
        state: "Uttar Pradesh",
        joinedAt: "2026-09-14T14:30:00.000Z",
        status: "active",
        phoneVerified: true,
      },
    ],
  },
  sand_seller: {
    summary: { total: 34, pastMonth: 9, locations: 8 },
    records: [
      {
        publicId: "SND-004",
        role: "sand_seller",
        name: "Manjunath Gowda",
        businessName: "Cauvery River Sand Depot",
        city: "Mandya",
        state: "Karnataka",
        joinedAt: "2026-09-26T08:15:00.000Z",
        status: "verified",
        phoneVerified: true,
      },
      {
        publicId: "SND-012",
        role: "sand_seller",
        name: "Birendra Tiwari",
        businessName: "Sone River Sand Yards",
        city: "Sonbhadra",
        state: "Uttar Pradesh",
        joinedAt: "2026-09-23T16:20:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "SND-019",
        role: "sand_seller",
        name: "Prakash Hegde",
        businessName: "Coastal M-Sand Washing Yard",
        city: "Mangaluru",
        state: "Karnataka",
        joinedAt: "2026-09-19T10:00:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "SND-027",
        role: "sand_seller",
        name: "Maheshwar Prasad",
        businessName: "Betwa Sand Pit Depot",
        city: "Jhansi",
        state: "Uttar Pradesh",
        joinedAt: "2026-09-12T13:45:00.000Z",
        status: "pending",
        phoneVerified: false,
      },
    ],
  },
  transporter: {
    summary: { total: 58, pastMonth: 16, locations: 11 },
    records: [
      {
        publicId: "TRN-008",
        role: "transporter",
        name: "Suresh Agrawal",
        businessName: "Agrawal Heavy Transport Fleet",
        city: "Bengaluru",
        state: "Karnataka",
        joinedAt: "2026-09-28T07:30:00.000Z",
        status: "verified",
        phoneVerified: true,
      },
      {
        publicId: "TRN-014",
        role: "transporter",
        name: "Karthik Swamy",
        businessName: "Metro Tipper Fleet Logistics",
        city: "Hoskote",
        state: "Karnataka",
        joinedAt: "2026-09-25T11:40:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "TRN-021",
        role: "transporter",
        name: "Vikram Chauhan",
        businessName: "Rapid Route Heavy Haulers",
        city: "Whitefield",
        state: "Karnataka",
        joinedAt: "2026-09-22T09:10:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "TRN-033",
        role: "transporter",
        name: "Dharmendra Bind",
        businessName: "Vindhya Dumpers & Logistics",
        city: "Sonbhadra",
        state: "Uttar Pradesh",
        joinedAt: "2026-09-17T15:25:00.000Z",
        status: "verified",
        phoneVerified: true,
      },
      {
        publicId: "TRN-042",
        role: "transporter",
        name: "Balwinder Singh",
        businessName: "Sher-e-Punjab Tipper Transport",
        city: "Nagpur",
        state: "Maharashtra",
        joinedAt: "2026-09-11T14:00:00.000Z",
        status: "inactive",
        phoneVerified: true,
      },
    ],
  },
  admin: {
    summary: { total: 4, active: 4, superAdmins: 1 },
    records: [
      {
        publicId: "ADM-001",
        role: "admin",
        name: "Wuying Admin (You)",
        businessName: "Super Administrator · StoneRate Core",
        city: "Bengaluru",
        state: "Karnataka",
        joinedAt: "2026-01-10T00:00:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "ADM-002",
        role: "admin",
        name: "Pooja Hegde",
        businessName: "Regional Operations Admin (South)",
        city: "Bengaluru",
        state: "Karnataka",
        joinedAt: "2026-03-15T09:30:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "ADM-003",
        role: "admin",
        name: "Amitabh Verma",
        businessName: "Regional Operations Admin (North)",
        city: "Varanasi",
        state: "Uttar Pradesh",
        joinedAt: "2026-05-20T11:00:00.000Z",
        status: "active",
        phoneVerified: true,
      },
      {
        publicId: "ADM-004",
        role: "admin",
        name: "Raghavendra Rao",
        businessName: "Logistics & Dispatch Operations",
        city: "Hoskote",
        state: "Karnataka",
        joinedAt: "2026-07-04T14:20:00.000Z",
        status: "active",
        phoneVerified: true,
      },
    ],
  },
};

/**
 * API Service helper with live backend call and graceful fallback
 */
async function fetchUsersAndPartners({
  role = "buyer",
  search = "",
  status = "",
  city = "",
  state = "",
  sort = "newest",
  page = 1,
  limit = 20,
}) {
  const query = new URLSearchParams({
    role,
    search: search.trim(),
    status,
    city,
    state,
    sort,
    page: String(page),
    limit: String(limit),
  }).toString();

  try {
    const res = await fetch(`/api/admin/users-partners?${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return data;
      }
    }
  } catch (err) {
    // Backend API unavailable, smoothly fall back to enriched mock dataset
  }

  // Fallback Mock Filtering Logic
  const roleData = MOCK_DATA[role] || { summary: {}, records: [] };
  let filtered = [...roleData.records];

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.businessName && r.businessName.toLowerCase().includes(q)) ||
        r.publicId.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q)
    );
  }

  if (status) {
    filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());
  }

  if (city) {
    filtered = filtered.filter((r) => r.city.toLowerCase() === city.toLowerCase());
  }

  if (state) {
    filtered = filtered.filter((r) => r.state.toLowerCase() === state.toLowerCase());
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sort === "newest") return new Date(b.joinedAt) - new Date(a.joinedAt);
    if (sort === "oldest") return new Date(a.joinedAt) - new Date(b.joinedAt);
    if (sort === "name_asc") return a.name.localeCompare(b.name);
    if (sort === "name_desc") return b.name.localeCompare(a.name);
    if (sort === "city_asc") return a.city.localeCompare(b.city);
    return 0;
  });

  const totalRecords = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const startIndex = (page - 1) * limit;
  const paginatedRecords = filtered.slice(0, startIndex + limit);

  return {
    success: true,
    role,
    summary: roleData.summary,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages,
    },
    records: paginatedRecords,
  };
}

/**
 * Standard Icon Component (matching AdminRateRequestDetails.js icon system)
 */
function Icon({ name, size = 18, className = "" }) {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };

  const p = {
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h10" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6 9a7 7 0 0 1 12-2l2 2M4 15l2 2a7 7 0 0 0 12-2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    cube: (
      <>
        <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" />
        <path d="m4 6.5 8 4.5 8-4.5M12 11v9" />
      </>
    ),
    layers: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </>
    ),
    truck: (
      <>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.24-4.05A1 1 0 0 0 17.76 8H14v10" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    right: <path d="m9 18 6-6-6-6" />,
    down: <path d="m6 9 6 6 6-6" />,
    close: <path d="m7 7 10 10M17 7 7 17" />,
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <path d="M12 3 3 20h18L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    filter: (
      <>
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </>
    ),
    sort: (
      <>
        <path d="m3 16 4 4 4-4" />
        <path d="M7 20V4" />
        <path d="m21 8-4-4-4 4" />
        <path d="M17 4v16" />
      </>
    ),
    badgeCheck: (
      <>
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
      </>
    ),
    arrowUpRight: (
      <>
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </>
    ),
  };

  return <svg {...c}>{p[name] || p.cube}</svg>;
}

/**
 * Format Helpers
 */
const formatDate = (isoString) => {
  if (!isoString) return "Not available";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return isoString;
  }
};

const getInitials = (name) => {
  if (!name) return "SR";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

/**
 * Main Component
 */
export default function StoneRateAdminUsersPartners({
  onBack,
  onNewRegistration,
  onViewUserDetails,
  initialRole = "buyer",
  currentAdmin,
  onRefresh,
}) {
  // State variables
  const [selectedRole, setSelectedRole] = useState(initialRole || "buyer");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalRecords: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState("");

  // Search & Filter controls
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Active Role configuration
  const currentRoleConfig = useMemo(() => {
    return ROLES.find((r) => r.key === selectedRole) || ROLES[0];
  }, [selectedRole]);

  // Toast notification helper
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }, []);

  // Fetch directory records
  const loadRecords = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const response = await fetchUsersAndPartners({
          role: selectedRole,
          search: debouncedSearch,
          status: statusFilter,
          sort: sortBy,
          page: pageToLoad,
          limit: 20,
        });

        if (response && response.success) {
          if (append) {
            setRecords((prev) => [...prev, ...response.records]);
          } else {
            setRecords(response.records || []);
          }
          setSummary(response.summary || {});
          setPagination(response.pagination || { page: pageToLoad, limit: 20, totalRecords: 0, totalPages: 1 });
        } else {
          setError("Failed to retrieve directory data from backend.");
        }
      } catch (err) {
        setError(err.message || "An unexpected error occurred while loading records.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedRole, debouncedSearch, statusFilter, sortBy]
  );

  // Initial load & filter trigger
  useEffect(() => {
    loadRecords(1, false);
  }, [loadRecords]);

  // Tab change handler
  const handleRoleChange = (roleKey) => {
    if (roleKey === selectedRole) return;
    setSelectedRole(roleKey);
    setSearchText("");
    setStatusFilter("");
    setSortBy("newest");
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    loadRecords(1, false);
    if (onRefresh) onRefresh();
    showToast(`Refreshed ${currentRoleConfig.label}`);
  };

  // Load More handler
  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !loadingMore) {
      loadRecords(pagination.page + 1, true);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    const s = String(status || "ACTIVE").toUpperCase();
    let badgeClass = "badge-active";
    if (s === "VERIFIED") badgeClass = "badge-verified";
    if (s === "PENDING") badgeClass = "badge-pending";
    if (s === "INACTIVE" || s === "SUSPENDED") badgeClass = "badge-inactive";

    return (
      <span className={`status-pill ${badgeClass}`}>
        <span className="status-dot" />
        {s}
      </span>
    );
  };

  return (
    <div className="sr-directory-root">
      {/* Dynamic Scoped CSS Stylesheet */}
      <style>{DIRECTORY_CSS}</style>

      {/* Atmospheric Background Glows matching AdminRateRequestDetails.js */}
      <div className="bg-canvas" aria-hidden="true">
        <i className="grid-overlay" />
        <b className="glow-orb-orange" />
        <span className="glow-orb-blue" />
        <em className="glow-orb-teal" />
      </div>

      {/* Page Header */}
      <header className="sr-header">
        <div className="sr-container">
          <div className="header-top-bar">
            <button
              type="button"
              className="sr-icon-btn back-btn"
              onClick={() => onBack?.()}
              aria-label="Back to Admin Dashboard"
              title="Back"
            >
              <Icon name="back" size={18} />
            </button>

            <div className="header-brand-group">
              <strong className="brand-logo-mark">
                <Icon name="users" size={18} />
              </strong>
              <div className="brand-text">
                <span className="brand-eyebrow">USERS & PARTNERS</span>
                <h1 className="brand-title">Platform Directory</h1>
              </div>
            </div>

            <div className="header-actions">
              <button
                type="button"
                className="sr-icon-btn refresh-btn"
                onClick={handleManualRefresh}
                aria-label="Refresh Directory"
                title="Refresh Records"
              >
                <Icon name="refresh" size={17} />
              </button>
            </div>
          </div>

          <p className="header-subtitle">
            Manage Buyers, Sellers, Sand Sellers, Transporters, and Admin accounts across the StoneRate network.
          </p>

          {/* Horizontally Scrollable Role Tabs */}
          <nav className="role-tabs-container" aria-label="Partner Categories">
            <div className="role-tabs-scroll">
              {ROLES.map((role) => {
                const isActive = role.key === selectedRole;
                const count = MOCK_DATA[role.key]?.summary?.total || 0;
                return (
                  <button
                    key={role.key}
                    type="button"
                    className={`role-tab-item ${isActive ? "active" : ""}`}
                    onClick={() => handleRoleChange(role.key)}
                    aria-selected={isActive}
                    role="tab"
                  >
                    <span className="tab-icon-wrap">
                      <Icon name={role.icon} size={15} />
                    </span>
                    <span className="tab-label">{role.label}</span>
                    <span className="tab-count-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="sr-container sr-main">
        {/* Dynamic Role Summary Cards */}
        <section className="summary-metrics-grid" aria-label="Category Summary">
          {selectedRole === "admin" ? (
            <>
              <div className="metric-card metric-admin-total">
                <div className="metric-header">
                  <span className="metric-tag">TOTAL ADMINS</span>
                  <span className="metric-icon-bubble">
                    <Icon name="shield" size={16} />
                  </span>
                </div>
                <div className="metric-body">
                  <strong className="metric-value">{loading ? "--" : summary.total || 4}</strong>
                  <span className="metric-desc">System Operators</span>
                </div>
              </div>

              <div className="metric-card metric-admin-active">
                <div className="metric-header">
                  <span className="metric-tag">ACTIVE ADMINS</span>
                  <span className="metric-icon-bubble">
                    <Icon name="check" size={16} />
                  </span>
                </div>
                <div className="metric-body">
                  <strong className="metric-value">{loading ? "--" : summary.active || 4}</strong>
                  <span className="metric-desc">Authorised session status</span>
                </div>
              </div>

              <div className="metric-card metric-admin-super">
                <div className="metric-header">
                  <span className="metric-tag">SUPER ADMINS</span>
                  <span className="metric-icon-bubble">
                    <Icon name="badgeCheck" size={16} />
                  </span>
                </div>
                <div className="metric-body">
                  <strong className="metric-value">{loading ? "--" : summary.superAdmins || 1}</strong>
                  <span className="metric-desc">Full security tier</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="metric-card metric-role-total">
                <div className="metric-header">
                  <span className="metric-tag">TOTAL</span>
                  <span className="metric-icon-bubble">
                    <Icon name={currentRoleConfig.icon} size={16} />
                  </span>
                </div>
                <div className="metric-body">
                  <strong className="metric-value">{loading ? "--" : summary.total || records.length}</strong>
                  <span className="metric-desc">Registered {currentRoleConfig.label}</span>
                </div>
              </div>

              <div className="metric-card metric-role-recent">
                <div className="metric-header">
                  <span className="metric-tag">PAST 1 MONTH</span>
                  <span className="metric-icon-bubble">
                    <Icon name="clock" size={16} />
                  </span>
                </div>
                <div className="metric-body">
                  <strong className="metric-value">{loading ? "--" : summary.pastMonth || 0}</strong>
                  <span className="metric-desc">New verified registrations</span>
                </div>
              </div>

              <div className="metric-card metric-role-locations">
                <div className="metric-header">
                  <span className="metric-tag">LOCATIONS</span>
                  <span className="metric-icon-bubble">
                    <Icon name="pin" size={16} />
                  </span>
                </div>
                <div className="metric-body">
                  <strong className="metric-value">{loading ? "--" : summary.locations || 0}</strong>
                  <span className="metric-desc">Cities represented</span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Action Call-to-Action Bar */}
        <section className="registration-cta-section">
          <button
            type="button"
            className="sr-primary-btn new-reg-btn"
            onClick={() => onNewRegistration?.(selectedRole)}
            style={{
              background: `linear-gradient(135deg, var(--o), var(--o2))`,
            }}
          >
            <span className="btn-icon">
              <Icon name="plus" size={18} />
            </span>
            <span className="btn-text">Register New {currentRoleConfig.singular}</span>
          </button>
        </section>

        {/* Search, Filter & Sort Toolbar */}
        <section className="toolbar-panel">
          <div className="search-input-wrapper">
            <span className="search-icon">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              className="sr-search-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, agency, city, state, phone, or ID"
              aria-label="Search directory"
            />
            {searchText && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchText("")}
                aria-label="Clear search"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-controls-group">
            {/* Sort Control */}
            <div className="select-wrapper">
              <span className="select-icon">
                <Icon name="sort" size={14} />
              </span>
              <select
                className="sr-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort records"
              >
                <option value="newest">Newest joined</option>
                <option value="oldest">Oldest joined</option>
                <option value="name_asc">Name A to Z</option>
                <option value="name_desc">Name Z to A</option>
                <option value="city_asc">City A to Z</option>
              </select>
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              className={`filter-toggle-btn ${statusFilter || showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
            >
              <Icon name="filter" size={14} />
              <span>Filters</span>
              {statusFilter && <span className="active-filter-indicator" />}
            </button>
          </div>
        </section>

        {/* Expandable Filter Drawer */}
        {showFilters && (
          <section className="filter-drawer-panel">
            <div className="filter-drawer-head">
              <span className="drawer-title">Filter by Account Status</span>
              {statusFilter && (
                <button
                  type="button"
                  className="reset-filter-btn"
                  onClick={() => setStatusFilter("")}
                >
                  Reset Status
                </button>
              )}
            </div>
            <div className="filter-chips-list">
              {["", "active", "verified", "pending", "inactive"].map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  className={`filter-chip ${statusFilter === statusKey ? "active" : ""}`}
                  onClick={() => setStatusFilter(statusKey)}
                >
                  {statusKey === "" ? "All Statuses" : statusKey.toUpperCase()}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Records Directory Section */}
        <section className="records-list-panel">
          <div className="records-panel-header">
            <div className="records-title-group">
              <h2 className="records-title">Registered {currentRoleConfig.label}</h2>
              <span className="records-count-chip">
                {pagination.totalRecords} {pagination.totalRecords === 1 ? "record" : "records"}
              </span>
            </div>
            {debouncedSearch && (
              <span className="search-feedback-note">
                Filtered by "<em>{debouncedSearch}</em>"
              </span>
            )}
          </div>

          {/* Conditional Rendering: Loading, Error, Empty, or Table */}
          {loading ? (
            /* Skeleton Loading State */
            <div className="skeleton-container" aria-busy="true">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="skeleton-row">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-content">
                    <div className="skeleton-line title" />
                    <div className="skeleton-line subtitle" />
                  </div>
                  <div className="skeleton-pill" />
                  <div className="skeleton-btn" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Professional Error State */
            <div className="state-card error-state-card">
              <div className="state-icon-box error">
                <Icon name="alert" size={28} />
              </div>
              <h3 className="state-title">Unable to load users and partners</h3>
              <p className="state-desc">{error || "Check the connection and try again."}</p>
              <button
                type="button"
                className="sr-secondary-btn"
                onClick={() => loadRecords(1, false)}
              >
                <Icon name="refresh" size={15} />
                <span>Retry</span>
              </button>
            </div>
          ) : records.length === 0 ? (
            /* Role-Specific Empty State */
            <div className="state-card empty-state-card">
              <div className="state-icon-box empty">
                <Icon name={currentRoleConfig.icon} size={32} />
              </div>
              <h3 className="state-title">No {currentRoleConfig.label} found</h3>
              <p className="state-desc">
                {debouncedSearch || statusFilter
                  ? "No matching records found with current filters. Try clearing search criteria."
                  : `New ${currentRoleConfig.singular} accounts will appear here after registration.`}
              </p>
              <button
                type="button"
                className="sr-primary-btn"
                onClick={() => onNewRegistration?.(selectedRole)}
              >
                <Icon name="plus" size={16} />
                <span>Register New {currentRoleConfig.singular}</span>
              </button>
            </div>
          ) : (
            <>
              {/* DESKTOP & TABLET TABLE VIEW (Sticky Header) */}
              <div className="table-responsive-wrapper">
                <table className="sr-data-table">
                  <thead>
                    <tr>
                      <th className="th-sno">S.NO</th>
                      <th className="th-name">NAME</th>
                      {selectedRole !== "buyer" && selectedRole !== "admin" && (
                        <th className="th-business">{currentRoleConfig.fieldLabel.toUpperCase()}</th>
                      )}
                      {selectedRole === "admin" && <th className="th-business">ADMIN ROLE</th>}
                      <th className="th-location">LOCATION</th>
                      <th className="th-id">ID</th>
                      <th className="th-joined">JOINED DATE</th>
                      <th className="th-status">STATUS</th>
                      <th className="th-action">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => {
                      const sno = String(index + 1).padStart(2, "0");
                      const initials = getInitials(record.name);

                      return (
                        <tr
                          key={record.publicId || index}
                          className="table-data-row"
                          onClick={() =>
                            onViewUserDetails?.({
                              role: selectedRole,
                              publicId: record.publicId,
                              record,
                            })
                          }
                        >
                          <td className="td-sno">
                            <span className="sno-text">{sno}</span>
                          </td>
                          <td className="td-name">
                            <div className="user-name-cell">
                              <div
                                className="user-avatar"
                                style={{ background: currentRoleConfig.avatarBg }}
                              >
                                {initials}
                              </div>
                              <div className="user-name-info">
                                <strong className="user-primary-name">{record.name}</strong>
                                {record.businessName && selectedRole === "buyer" && (
                                  <span className="user-subtext">{record.businessName}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          {selectedRole !== "buyer" && selectedRole !== "admin" && (
                            <td className="td-business">
                              <span className="business-name-text">
                                {record.businessName || "--"}
                              </span>
                            </td>
                          )}
                          {selectedRole === "admin" && (
                            <td className="td-business">
                              <span className="admin-role-tag">
                                {record.businessName || "System Administrator"}
                              </span>
                            </td>
                          )}
                          <td className="td-location">
                            <div className="location-cell">
                              <Icon name="pin" size={13} className="location-pin-icon" />
                              <span className="location-text">
                                {record.city ? `${record.city}, ${record.state}` : record.state || "--"}
                              </span>
                            </div>
                          </td>
                          <td className="td-id">
                            <span className="id-monospace-pill">{record.publicId}</span>
                          </td>
                          <td className="td-joined">
                            <span className="joined-date-text">{formatDate(record.joinedAt)}</span>
                          </td>
                          <td className="td-status">{renderStatusBadge(record.status)}</td>
                          <td className="td-action">
                            <button
                              type="button"
                              className="view-details-table-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewUserDetails?.({
                                  role: selectedRole,
                                  publicId: record.publicId,
                                  record,
                                });
                              }}
                            >
                              <span>View Details</span>
                              <Icon name="right" size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE ADAPTIVE RECORD CARDS (< 640px) */}
              <div className="mobile-cards-list">
                {records.map((record, index) => {
                  const sno = String(index + 1).padStart(2, "0");
                  const initials = getInitials(record.name);

                  return (
                    <article
                      key={record.publicId || index}
                      className="mobile-record-card"
                      onClick={() =>
                        onViewUserDetails?.({
                          role: selectedRole,
                          publicId: record.publicId,
                          record,
                        })
                      }
                    >
                      <div className="mobile-card-top">
                        <span className="mobile-sno-badge">{sno}</span>
                        <div
                          className="mobile-avatar"
                          style={{ background: currentRoleConfig.avatarBg }}
                        >
                          {initials}
                        </div>
                        <div className="mobile-user-title">
                          <strong className="mobile-name">{record.name}</strong>
                          <span className="mobile-role-label">
                            {currentRoleConfig.singular}
                          </span>
                        </div>
                        <div className="mobile-status-wrap">
                          {renderStatusBadge(record.status)}
                        </div>
                      </div>

                      <div className="mobile-card-middle">
                        {record.businessName && (
                          <div className="mobile-info-row business">
                            <Icon name="building" size={14} />
                            <span>{record.businessName}</span>
                          </div>
                        )}
                        <div className="mobile-meta-grid">
                          <div className="mobile-meta-item">
                            <span className="meta-label">ID</span>
                            <span className="id-monospace-pill">{record.publicId}</span>
                          </div>
                          <div className="mobile-meta-item">
                            <span className="meta-label">Location</span>
                            <span className="meta-val location">
                              <Icon name="pin" size={12} />
                              {record.city ? `${record.city}, ${record.state}` : "--"}
                            </span>
                          </div>
                          <div className="mobile-meta-item full">
                            <span className="meta-label">Joined</span>
                            <span className="meta-val">
                              <Icon name="clock" size={12} />
                              {formatDate(record.joinedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mobile-card-bottom">
                        <button
                          type="button"
                          className="mobile-view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewUserDetails?.({
                              role: selectedRole,
                              publicId: record.publicId,
                              record,
                            });
                          }}
                        >
                          <span>View Details</span>
                          <Icon name="right" size={14} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Load More Pagination */}
              {pagination.page < pagination.totalPages && (
                <div className="load-more-section">
                  <span className="load-more-counter">
                    Showing {records.length} of {pagination.totalRecords} {currentRoleConfig.label}
                  </span>
                  <button
                    type="button"
                    className="load-more-btn"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <span className="btn-spinner" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <>
                        <span>Load More {currentRoleConfig.label}</span>
                        <Icon name="down" size={15} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Floating Toast Notification */}
      <div className={`sr-toast ${toast ? "show" : ""}`} role="status">
        <Icon name="check" size={15} />
        <span>{toast}</span>
      </div>
    </div>
  );
}

// ============================================================================
// STYLESHEET (THEME EXTRACTED & EXPANDED FROM AdminRateRequestDetails.js)
// ============================================================================

const DIRECTORY_CSS = `
/* CSS Custom Properties & Design Tokens */
.sr-directory-root {
  --o: #f97316;
  --o2: #c2560b;
  --soft: rgba(249, 115, 22, 0.11);
  --green: #1f9463;
  --red: #d64545;
  --ink: #141a24;
  --muted: #6b7687;
  --faint: #96a0af;
  --line: #e9edf3;
  --line2: #dbe2ec;
  --card-bg: #ffffff;
  --panel-bg: #f8fafc;
  
  min-height: 100vh;
  height: auto;
  padding-bottom: 80px;
  color: var(--ink);
  background: #f4f7fb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.sr-directory-root * {
  box-sizing: border-box;
}

.sr-directory-root button,
.sr-directory-root input,
.sr-directory-root select {
  font: inherit;
}

/* Atmospheric Ambient Background */
.bg-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-canvas > .grid-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 0 31px, rgba(24, 42, 72, 0.035) 31px 32px),
              linear-gradient(90deg, transparent 0 31px, rgba(24, 42, 72, 0.035) 31px 32px);
  background-size: 32px 32px;
  mask-image: radial-gradient(120% 85% at 50% 0%, #000 20%, transparent 78%);
}

.bg-canvas > b,
.bg-canvas > span,
.bg-canvas > em {
  position: absolute;
  border-radius: 50%;
  filter: blur(58px);
  opacity: 0.45;
}

.bg-canvas > .glow-orb-orange {
  width: 44vw;
  height: 44vw;
  left: -9vw;
  top: -16vw;
  background: radial-gradient(circle, rgba(255, 168, 74, 0.55), transparent 66%);
}

.bg-canvas > .glow-orb-blue {
  width: 40vw;
  height: 40vw;
  right: -10vw;
  top: -6vw;
  background: radial-gradient(circle, rgba(80, 140, 255, 0.42), transparent 66%);
}

.bg-canvas > .glow-orb-teal {
  width: 36vw;
  height: 36vw;
  left: 34vw;
  top: 26vw;
  background: radial-gradient(circle, rgba(13, 148, 136, 0.24), transparent 68%);
}

/* Layout Container */
.sr-container {
  width: min(100%, 1080px);
  margin: 0 auto;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

/* Header Section */
.sr-header {
  position: relative;
  z-index: 10;
  border-bottom: 1px solid rgba(16, 28, 50, 0.06);
  background: rgba(244, 247, 251, 0.85);
  backdrop-filter: blur(8px);
  padding: 14px 0 16px;
}

.header-top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sr-icon-btn {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line2);
  border-radius: 11px;
  background: #ffffff;
  color: var(--ink);
  cursor: pointer;
  transition: all 0.16s ease;
  flex-shrink: 0;
}

.sr-icon-btn:hover {
  background: #fdfefe;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.sr-icon-btn:active {
  transform: translateY(0);
}

.header-brand-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.brand-logo-mark {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--o), var(--o2));
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-eyebrow {
  color: var(--o2);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand-title {
  margin: 0;
  color: var(--ink);
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.header-subtitle {
  margin: 8px 0 14px;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.45;
}

/* Horizontally Scrollable Role Tabs */
.role-tabs-container {
  margin-top: 10px;
}

.role-tabs-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 2px 8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.role-tabs-scroll::-webkit-scrollbar {
  display: none;
}

.role-tab-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--line2);
  border-radius: 12px;
  background: #ffffff;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;
  flex-shrink: 0;
}

.role-tab-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: var(--ink);
}

.role-tab-item.active {
  border-color: rgba(249, 115, 22, 0.65);
  background: #fff7ed;
  color: var(--o2);
  box-shadow: 0 3px 10px rgba(249, 115, 22, 0.12);
  font-weight: 750;
}

.tab-icon-wrap {
  display: grid;
  place-items: center;
  color: inherit;
}

.tab-count-badge {
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  background: #f1f5f9;
  color: var(--muted);
}

.role-tab-item.active .tab-count-badge {
  background: rgba(249, 115, 22, 0.15);
  color: var(--o2);
}

/* Main Content Section */
.sr-main {
  margin-top: 16px;
}

/* Summary Metrics Grid */
.summary-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.metric-card {
  padding: 13px 15px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--card-bg);
  box-shadow: 0 4px 14px rgba(20, 26, 36, 0.03);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: transform 0.16s ease;
}

.metric-card:hover {
  transform: translateY(-1px);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-tag {
  color: var(--faint);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.metric-icon-bubble {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f8fafc;
  color: var(--muted);
}

.metric-role-total .metric-icon-bubble {
  background: var(--soft);
  color: var(--o2);
}

.metric-role-recent .metric-icon-bubble {
  background: rgba(37, 99, 235, 0.09);
  color: #2563eb;
}

.metric-role-locations .metric-icon-bubble {
  background: rgba(31, 148, 99, 0.09);
  color: var(--green);
}

.metric-body {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
}

.metric-value {
  color: var(--ink);
  font-size: 22px;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.metric-desc {
  margin-top: 1px;
  color: var(--muted);
  font-size: 11px;
}

/* Registration CTA Button Section */
.registration-cta-section {
  margin-bottom: 14px;
}

.sr-primary-btn {
  width: 100%;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border: 0;
  border-radius: 12px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(249, 115, 22, 0.22);
  transition: all 0.16s ease;
}

.sr-primary-btn:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(249, 115, 22, 0.28);
}

.sr-primary-btn:active {
  transform: translateY(0);
}

/* Toolbar Panel */
.toolbar-panel {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
  min-width: 0;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--line2);
  border-radius: 12px;
  background: #ffffff;
  color: var(--muted);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.search-input-wrapper:focus-within {
  border-color: rgba(249, 115, 22, 0.65);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  color: var(--o2);
}

.sr-search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font-size: 12.5px;
}

.clear-search-btn {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: #f1f5f9;
  color: var(--muted);
  cursor: pointer;
}

.clear-search-btn:hover {
  background: #e2e8f0;
  color: var(--ink);
}

.toolbar-controls-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select-icon {
  position: absolute;
  left: 10px;
  pointer-events: none;
  color: var(--muted);
}

.sr-select {
  height: 42px;
  padding: 0 12px 0 30px;
  border: 1px solid var(--line2);
  border-radius: 12px;
  background: #ffffff;
  color: var(--ink);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  outline: 0;
}

.sr-select:focus {
  border-color: rgba(249, 115, 22, 0.65);
}

.filter-toggle-btn {
  height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  border: 1px solid var(--line2);
  border-radius: 12px;
  background: #ffffff;
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  position: relative;
  transition: all 0.16s ease;
}

.filter-toggle-btn:hover,
.filter-toggle-btn.active {
  border-color: rgba(249, 115, 22, 0.45);
  background: #fff8f1;
  color: var(--o2);
}

.active-filter-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--o);
}

/* Expandable Filter Drawer */
.filter-drawer-panel {
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #ffffff;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(20, 26, 36, 0.03);
}

.filter-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.drawer-title {
  color: var(--faint);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.reset-filter-btn {
  border: 0;
  background: transparent;
  color: var(--o2);
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
}

.filter-chips-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 11px;
  border: 1px solid var(--line2);
  border-radius: 8px;
  background: #f8fafc;
  color: var(--muted);
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-chip.active {
  border-color: rgba(249, 115, 22, 0.6);
  background: #fff7ed;
  color: var(--o2);
  font-weight: 750;
}

/* Records List Panel */
.records-list-panel {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(20, 26, 36, 0.03);
  overflow: hidden;
}

.records-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
  background: #fafbfd;
}

.records-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.records-title {
  margin: 0;
  color: var(--ink);
  font-size: 14px;
  font-weight: 800;
}

.records-count-chip {
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--soft);
  color: var(--o2);
  font-size: 10px;
  font-weight: 800;
}

.search-feedback-note {
  color: var(--muted);
  font-size: 11px;
}

.search-feedback-note em {
  color: var(--o2);
  font-style: normal;
  font-weight: 700;
}

/* Data Table Styling (Desktop / Tablet) */
.table-responsive-wrapper {
  overflow-x: auto;
  max-width: 100%;
}

.sr-data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
}

.sr-data-table thead {
  position: sticky;
  top: 0;
  z-index: 5;
  background: #f8fafc;
}

.sr-data-table th {
  padding: 11px 14px;
  border-bottom: 1px solid var(--line2);
  color: var(--faint);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.sr-data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  font-size: 12px;
  vertical-align: middle;
}

.table-data-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.table-data-row:hover {
  background: #fbfcfe;
}

.table-data-row:last-child td {
  border-bottom: 0;
}

.th-sno, .td-sno {
  width: 48px;
  text-align: center;
}

.sno-text {
  color: var(--faint);
  font-size: 10.5px;
  font-weight: 750;
  font-family: ui-monospace, monospace;
}

.user-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 850;
  flex-shrink: 0;
}

.user-name-info {
  display: flex;
  flex-direction: column;
}

.user-primary-name {
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 750;
}

.user-subtext {
  color: var(--muted);
  font-size: 10.5px;
}

.business-name-text {
  color: var(--ink);
  font-weight: 600;
  font-size: 12px;
}

.admin-role-tag {
  color: #6d28d9;
  font-weight: 700;
  font-size: 11px;
}

.location-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--muted);
}

.location-pin-icon {
  color: var(--faint);
}

.location-text {
  font-size: 11.5px;
  white-space: nowrap;
}

.id-monospace-pill {
  display: inline-block;
  padding: 3px 7px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10.5px;
  font-weight: 750;
  letter-spacing: 0.02em;
}

.joined-date-text {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}

/* Status Pills */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.badge-active {
  background: #dcfce7;
  color: #15803d;
}

.badge-verified {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge-pending {
  background: #fef3c7;
  color: #92400e;
}

.badge-inactive {
  background: #f1f5f9;
  color: #64748b;
}

/* Action Button */
.view-details-table-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid var(--line2);
  border-radius: 8px;
  background: #ffffff;
  color: var(--o2);
  font-size: 11px;
  font-weight: 750;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.view-details-table-btn:hover {
  border-color: rgba(249, 115, 22, 0.5);
  background: #fff8f1;
}

/* Mobile Record Cards (< 640px) */
.mobile-cards-list {
  display: none;
  padding: 12px;
  gap: 10px;
}

.mobile-record-card {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(20, 26, 36, 0.02);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-card-top {
  display: flex;
  align-items: center;
  gap: 9px;
}

.mobile-sno-badge {
  font-family: ui-monospace, monospace;
  color: var(--faint);
  font-size: 10px;
  font-weight: 800;
}

.mobile-avatar {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 850;
  flex-shrink: 0;
}

.mobile-user-title {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.mobile-name {
  color: var(--ink);
  font-size: 13px;
  font-weight: 750;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-role-label {
  color: var(--faint);
  font-size: 9.5px;
}

.mobile-status-wrap {
  flex-shrink: 0;
}

.mobile-card-middle {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 9px;
  background: #f8fafc;
}

.mobile-info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ink);
  font-size: 11.5px;
  font-weight: 650;
}

.mobile-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.mobile-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-meta-item.full {
  grid-column: 1 / -1;
}

.meta-label {
  color: var(--faint);
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
}

.meta-val {
  color: var(--muted);
  font-size: 10.5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-val.location {
  color: var(--ink);
  font-weight: 600;
}

.mobile-view-btn {
  width: 100%;
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--line2);
  border-radius: 9px;
  background: #ffffff;
  color: var(--o2);
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}

.mobile-view-btn:active {
  background: #fff7ed;
}

/* Load More Pagination */
.load-more-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--line);
  background: #fafbfd;
}

.load-more-counter {
  color: var(--muted);
  font-size: 11.5px;
}

.load-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border: 1px solid var(--line2);
  border-radius: 10px;
  background: #ffffff;
  color: var(--ink);
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  transition: all 0.16s ease;
}

.load-more-btn:hover:not(:disabled) {
  border-color: rgba(249, 115, 22, 0.5);
  color: var(--o2);
  background: #fff8f1;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(249, 115, 22, 0.3);
  border-top-color: var(--o);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* State Cards (Empty, Error, Loading) */
.state-card {
  padding: 44px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.state-icon-box {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  margin-bottom: 12px;
}

.state-icon-box.empty {
  background: var(--soft);
  color: var(--o2);
}

.state-icon-box.error {
  background: rgba(214, 69, 69, 0.1);
  color: var(--red);
}

.state-title {
  margin: 0 0 6px;
  color: var(--ink);
  font-size: 15px;
  font-weight: 800;
}

.state-desc {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 12px;
  max-width: 380px;
  line-height: 1.5;
}

.sr-secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--line2);
  border-radius: 10px;
  background: #ffffff;
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

/* Skeleton Loading Shimmer */
.skeleton-container {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
}

.skeleton-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #e2e8f0;
  animation: pulse 1.5s infinite;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  height: 10px;
  border-radius: 4px;
  background: #e2e8f0;
  animation: pulse 1.5s infinite;
}

.skeleton-line.title {
  width: 45%;
}

.skeleton-line.subtitle {
  width: 25%;
}

.skeleton-pill {
  width: 70px;
  height: 20px;
  border-radius: 999px;
  background: #e2e8f0;
  animation: pulse 1.5s infinite;
}

.skeleton-btn {
  width: 90px;
  height: 28px;
  border-radius: 6px;
  background: #e2e8f0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.25; }
}

/* Toast Message */
.sr-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(40px);
  z-index: 999;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  background: #141a24;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  opacity: 0;
  pointer-events: none;
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.sr-toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

/* Responsive Media Queries */
@media (max-width: 768px) {
  .summary-metrics-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .metric-card {
    padding: 10px 12px;
  }
  
  .metric-value {
    font-size: 18px;
  }
  
  .metric-desc {
    font-size: 9.5px;
  }
  
  .toolbar-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-controls-group {
    justify-content: space-between;
  }
  
  .select-wrapper {
    flex: 1;
  }
  
  .sr-select {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .table-responsive-wrapper {
    display: none;
  }
  
  .mobile-cards-list {
    display: flex;
    flex-direction: column;
  }
  
  .summary-metrics-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
`;

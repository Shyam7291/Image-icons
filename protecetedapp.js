import React, { useState } from "react";
import "./style.css";

import AdminDashboard from "./pages/AdminDashboard";
import AdminRateRequests from "./pages/AdminRateRequests";
import AdminActiveOrders from "./pages/AdminActiveOrders";
import AdminActiveOrderDetails from "./pages/AdminActiveOrderDetails";
import AdminRateRequestDetails from "./pages/AdminRateRequestDetails";
import AdminSamples from "./pages/AdminSamples";
import AdminSettings from "./pages/AdminSettings";
import SellerInformationPage from "./pages/SellerInformationPage";
import SellerMySamplesPage from "./pages/SellerMySamplesPage";
import SellerSamplesPage from "./pages/SellerSamplesPage";
import SellerOrdersPage from "./pages/SellerOrdersPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import SellerSalesReportPage from "./pages/SellerSalesReportPage";
import SellerTransporterContactsPage from "./pages/SellerTransporterContactsPage";
import SellerGuidePage from "./pages/SellerGuidePage";
import SellerTermsPrivacyPage from "./pages/SellerTermsPrivacyPage";
import AboutStoneRatePage from "./pages/AboutStoneRatePage";
import HowStoneRateWorksPage from "./pages/HowStoneRateWorksPage";

import StoneRateSandSellerHome from "./pages/StoneRateSandSellerHome";
import StoneRateSellerQueuePage from "./pages/StoneRateSellerQueuePage";
import SandSellerSamplePage from "./pages/SandSellerSamplePage";
import SandSellerMySamplePage from "./pages/SandSellerMySamplePage";
import SandSellerProfilePage from "./pages/SandSellerProfilePage";
import SandSellerAboutStoneRate from "./pages/SandSellerAboutStoneRate";
import SandSellerHowStoneRateWorks from "./pages/SandSellerHowStoneRateWorks";
import SandSellerTermsAndConditions from "./pages/SandSellerTermsAndConditions";


import Page1 from "./pages/Page1";
import Page2 from "./pages/Page2";
import Page3 from "./pages/Page3";
import Page4 from "./pages/Page4";
import Page5 from "./pages/Page5";
import Page6 from "./pages/Page6";
import Page7 from "./pages/Page7";
import Page8 from "./pages/Page8";
import Page9 from "./pages/Page9";
import Page10 from "./pages/Page10";
import SellerHomePage from "./pages/SellerHomePage";

const SAND_NOTIFICATIONS = [
  {
    id: "notification-1",
    title: "New StoneRate Order",
    message: "A new M-Sand request has been received.",
    type: "new_order",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    read: false,
    tokenNumber: null,
    source: "stonerate",
  },
  {
    id: "notification-2",
    title: "Queue Update Required",
    message: "Token Q-018 is approaching its estimated loading time.",
    type: "queue",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    read: false,
    tokenNumber: "Q-018",
    source: "stonerate",
  },
  {
    id: "notification-3",
    title: "Manual Entry Added",
    message: "Manual order for truck KA 01 AB 4521 was added.",
    type: "manual",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    read: true,
    tokenNumber: null,
    source: "manual",
  },
];

const SAND_HOME_DATA = {
  totalMaterialOrders: [
    { id: "m-sand", materialName: "M-Sand", buckets: 1850, trucks: 42 },
    { id: "p-sand", materialName: "P-Sand", buckets: 940, trucks: 21 },
    { id: "river-sand", materialName: "River Sand", buckets: 520, trucks: 11 },
  ],
  todaySummary: {
    totalOrders: 24,
    totalTrucks: 20,
    totalBuckets: 1080,
    pendingToLoad: 9,
    pendingTrucks: 8,
    pendingBuckets: 400,
    loadedOrders: 15,
    loadedTrucks: 12,
    loadedBuckets: 680,
    pendingRequests: 6,
  },
  upcomingLoading: [
    {
      id: "loading-1",
      truckNumber: "KA 53 MG 4821",
      customerName: "Sri Ganesh Traders",
      quantityBuckets: 50,
      tokenNumber: "Q-018",
      estimatedTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      source: "stonerate",
      status: "next",
    },
    {
      id: "loading-2",
      truckNumber: "KA 01 AB 4521",
      customerName: "Lakshmi Constructions",
      quantityBuckets: 40,
      tokenNumber: "Q-019",
      estimatedTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      source: "manual",
      status: "waiting",
    },
    {
      id: "loading-3",
      truckNumber: "KA 40 MN 9087",
      customerName: "Venkateshwara Infra",
      quantityBuckets: 60,
      tokenNumber: "Q-020",
      estimatedTime: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
      source: "stonerate",
      status: "waiting",
    },
  ],
};


function readStoredSeller() {
  try {
    const storedSeller = window.localStorage.getItem(
      "stonerate_current_seller"
    );

    return storedSeller
      ? JSON.parse(storedSeller)
      : null;
  } catch (error) {
    console.error(
      "Unable to read the stored Seller account:",
      error
    );
    return null;
  }
}

function getSellerProductType(seller) {
  return String(
    seller?.sellerProductType ||
    seller?.seller_product_type ||
    seller?.productType ||
    seller?.sellerType ||
    "stones"
  ).trim().toLowerCase();
}

function getInitialPage() {
  const storedSeller = readStoredSeller();

  if (
    storedSeller?.role === "seller" &&
    storedSeller?.phoneVerified === true
  ) {
    return getSellerProductType(storedSeller) === "sand"
      ? "sandSellerHome"
      : "sellerHome";
  }

  return "page1";
}

export default function App() {
  const [currentPage, setCurrentPage] =
  useState(getInitialPage);
  const [orderDraft, setOrderDraft] = useState(null);
  const [openOrderCartOnLoad, setOpenOrderCartOnLoad] =
    useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ordersInitialFilter, setOrdersInitialFilter] =
    useState("all");
  const [ordersInitialStatus, setOrdersInitialStatus] =
    useState("all");
  const [sellerOrdersInitialView, setSellerOrdersInitialView] =
    useState("active");
  const [sellerOpenUpload, setSellerOpenUpload] =
    useState(false);
  const [currentSeller, setCurrentSeller] =
    useState(readStoredSeller);
  const [sandOpenSampleUploadOnLoad, setSandOpenSampleUploadOnLoad] = useState(false);
  const [sandNotifications, setSandNotifications] = useState(SAND_NOTIFICATIONS);
  const [sandLoading, setSandLoading] = useState(false);
  const [sandError, setSandError] = useState("");

  const sellerDisplayName =
    currentSeller?.name ||
    currentSeller?.plantName ||
    "StoneRate Seller";

  const sandSeller = {
    ownerName: currentSeller?.name || currentSeller?.ownerName || "Sand Seller",
    name: currentSeller?.name || currentSeller?.ownerName || "Sand Seller",
    yardName: currentSeller?.plantName || currentSeller?.yardName || "Sand Yard",
    plantName: currentSeller?.plantName || currentSeller?.yardName || "Sand Yard",
    sellerId: currentSeller?.publicId || currentSeller?.sellerId || "",
    publicId: currentSeller?.publicId || currentSeller?.sellerId || "",
    role: "seller",
    phone: currentSeller?.phone || currentSeller?.contactNumber || "",
    primaryPhone: currentSeller?.phone || currentSeller?.contactNumber || "",
    alternatePhone: currentSeller?.alternatePhone || currentSeller?.alternateContactNumber || "",
    address: currentSeller?.address || currentSeller?.plantAddress || "",
    city: currentSeller?.city || "",
    state: currentSeller?.state || "",
    pincode: currentSeller?.pincode || "",
    email: currentSeller?.email || "",
    gstin: currentSeller?.gstin || "",
    joinedAt: currentSeller?.joinedAt || currentSeller?.createdAt || "",
    aadhaarVerified: currentSeller?.aadhaarVerified === true,
    adminVerified: currentSeller?.adminVerified === true,
  };
  const openSandMarketSamples = () => {
    setSandOpenSampleUploadOnLoad(false);
    setCurrentPage("sandSellerSamples");
  };
  const openSandMySamples = () => {
    setSandOpenSampleUploadOnLoad(false);
    setCurrentPage("sandSellerMySamples");
  };
  const openSandSampleUpload = () => {
    setSandOpenSampleUploadOnLoad(true);
    setCurrentPage("sandSellerMySamples");
  };
  const sandNavigation = {
    onOpenHome: () => { setSandOpenSampleUploadOnLoad(false); setCurrentPage("sandSellerHome"); },
    onOpenQueue: () => { setSandOpenSampleUploadOnLoad(false); setCurrentPage("sandSellerQueue"); },
    onOpenSamples: openSandMarketSamples,
    onOpenSampleUpload: openSandSampleUpload,
    onOpenPendingRequests: () => setCurrentPage("sandSellerQueue"),
    onOpenManualEntry: () => setCurrentPage("sandSellerQueue"),
    onOpenMySamples: openSandMySamples,
    onOpenProfile: () => setCurrentPage("sandSellerProfile"),
    onOpenAboutStoneRate: () => setCurrentPage("sandSellerAbout"),
    onOpenHowStoneRateWorks: () => setCurrentPage("sandSellerHowItWorks"),
    onOpenTermsAndConditions: () => setCurrentPage("sandSellerTerms"),
  };
  const handleSandNotificationClick = (selectedNotification) => {
    setSandNotifications((items) => items.map((item) =>
      item.id === selectedNotification.id ? { ...item, read: true } : item
    ));
  };
  const markAllSandNotificationsRead = () => {
    setSandNotifications((items) => items.map((item) => ({ ...item, read: true })));
  };
  const refreshSandDashboard = async () => {
    setSandLoading(true);
    setSandError("");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
    } catch (error) {
      setSandError("Unable to refresh sand seller data.");
    } finally {
      setSandLoading(false);
    }
  };

  const openFreshSignInPage = () => {
    window.localStorage.removeItem("stonerate_signin_phone");
    window.localStorage.removeItem("stonerate_auth_mode");
    window.localStorage.removeItem("stonerate_pending_role");
    window.localStorage.removeItem("stonerate_pending_seller_product_type");
    window.localStorage.removeItem("stonerate_development_otp");
    window.localStorage.removeItem("stonerate_current_user");
    window.localStorage.removeItem("stonerate_current_seller");
    setCurrentSeller(null);

    setOrderDraft(null);
    setSelectedOrder(null);
    setOpenOrderCartOnLoad(false);
    setSandOpenSampleUploadOnLoad(false);
    setSandNotifications(SAND_NOTIFICATIONS);
    setCurrentPage("page3");
  };

  const openOrdersPage = (
    orderType = "all",
    orderStatus = "all"
  ) => {
    setOrdersInitialFilter(orderType);
    setOrdersInitialStatus(orderStatus);
    setCurrentPage("page9");
  };

  const goToAdminDashboard = () => {
    setCurrentPage("adminDashboard");
  };

  const goToAdminRateRequests = () => {
    setCurrentPage("adminRateRequests");
  };

  const goToAdminActiveOrders = () => {
    setCurrentPage("adminActiveOrders");
  };

  const goToAdminSamples = () => {
    setCurrentPage("adminSamples");
  };
  const goToAdminSettings = () => {
    setCurrentPage("adminSettings");
  };
  const goToSellerInformation = () => {
    setCurrentPage("sellerInformationAdmin");
  };

  const goToAdminTransporterBidding = () => {
    // Temporary fallback until the Transporter Bidding page is connected.
    setCurrentPage("adminDashboard");
  };
  if (currentPage === "sandSellerAbout") {
    return <SandSellerAboutStoneRate onBack={() => setCurrentPage("sandSellerHome")} />;
  }
  if (currentPage === "sandSellerHowItWorks") {
    return <SandSellerHowStoneRateWorks onBack={() => setCurrentPage("sandSellerHome")} />;
  }
  if (currentPage === "sandSellerTerms") {
    return <SandSellerTermsAndConditions onBack={() => setCurrentPage("sandSellerHome")} />;
  }
  if (currentPage === "sandSellerSamples") {
    return (
      <SandSellerSamplePage
        seller={sandSeller}
        notifications={sandNotifications}
        pendingRequests={SAND_HOME_DATA.todaySummary.pendingRequests}
        {...sandNavigation}
        onNotificationClick={handleSandNotificationClick}
        onMarkAllNotificationsRead={markAllSandNotificationsRead}
      />
    );
  }
  if (currentPage === "sandSellerMySamples") {
    return (
      <SandSellerMySamplePage
        seller={sandSeller}
        openUploadOnLoad={sandOpenSampleUploadOnLoad}
        onUploadOpened={() => setSandOpenSampleUploadOnLoad(false)}
        {...sandNavigation}
      />
    );
  }
  if (currentPage === "sandSellerProfile") {
    return (
      <SandSellerProfilePage
        seller={sandSeller}
        sellerName={sandSeller.ownerName}
        {...sandNavigation}
        onNavigate={(target) => {
          if (target === "home") setCurrentPage("sandSellerHome");
          else if (target === "queue") setCurrentPage("sandSellerQueue");
          else if (target === "samples") openSandMarketSamples();
          else if (target === "mySamples") openSandMySamples();
          else if (target === "sampleUpload") openSandSampleUpload();
          else if (target === "profile") setCurrentPage("sandSellerProfile");
        }}
        onSignOut={openFreshSignInPage}
        onProfileUpdated={(updatedSeller) => {
          if (updatedSeller) setCurrentSeller((current) => ({ ...current, ...updatedSeller }));
        }}
      />
    );
  }
  if (currentPage === "sandSellerQueue") {
    return (
      <StoneRateSellerQueuePage
        seller={sandSeller}
        notifications={sandNotifications}
        loading={sandLoading}
        error={sandError}
        {...sandNavigation}
        onNotificationClick={handleSandNotificationClick}
        onMarkAllNotificationsRead={markAllSandNotificationsRead}
        onRefresh={refreshSandDashboard}
      />
    );
  }
  if (currentPage === "sandSellerHome") {
    return (
      <StoneRateSandSellerHome
        seller={sandSeller}
        notifications={sandNotifications}
        totalMaterialOrders={SAND_HOME_DATA.totalMaterialOrders}
        todaySummary={SAND_HOME_DATA.todaySummary}
        upcomingLoading={SAND_HOME_DATA.upcomingLoading}
        loading={sandLoading}
        error={sandError}
        {...sandNavigation}
        onOpenLoadingDetails={() => setCurrentPage("sandSellerQueue")}
        onNotificationClick={handleSandNotificationClick}
        onMarkAllNotificationsRead={markAllSandNotificationsRead}
        onRefresh={refreshSandDashboard}
      />
    );
  }

  if (currentPage === "sellerGuide") {
    return (
      <SellerGuidePage onBack={() => setCurrentPage("sellerHome")} />
    );
  }
  if (currentPage === "sellerTermsPrivacy") {
    return (
      <SellerTermsPrivacyPage onBack={() => setCurrentPage("sellerHome")} />
    );
  }
  if (currentPage === "aboutStoneRate") {
    return (
      <AboutStoneRatePage
        onBack={() => setCurrentPage("sellerHome")}
      />
    );
  }
  if (currentPage === "howStoneRateWorks") {
    return (
      <HowStoneRateWorksPage
        onBack={() => setCurrentPage("sellerHome")}
      />
    );
  }
  if (currentPage === "sellerTransporterContacts") {
    return (
      <SellerTransporterContactsPage
        sellerName={sellerDisplayName}
        onBack={() => setCurrentPage("sellerHome")}
      />
    );
  }
  if (currentPage === "sellerSalesReport") {
    return (
      <SellerSalesReportPage
        sellerName={sellerDisplayName}
        onBack={() => setCurrentPage("sellerHome")}
      />
    );
  }
  if (currentPage === "sellerProfile") {
    return (
      <SellerProfilePage
        sellerName={sellerDisplayName}
        onNavigate={(target) => {
          console.log("Seller Profile navigation:", target);

          if (target === "profile") {
            setCurrentPage("sellerProfile");
          }

          if (target === "home") {
            setCurrentPage("sellerHome");
          }

          if (target === "orders") {
            setSellerOrdersInitialView("active");
            setCurrentPage("sellerOrders");
          }

          if (target === "samples") {
            setCurrentPage("sellerSamples");
          }

          if (target === "mySamples") {
            setSellerOpenUpload(false);
            setCurrentPage("sellerMySamples");
          }
        }}
        onSignOut={openFreshSignInPage}
        onProfileUpdated={(updatedSeller) => {
          setCurrentSeller(updatedSeller);
        }}
      />
    );
  }
  if (currentPage === "sellerOrders") {
    return (
      <SellerOrdersPage
        key={`seller-orders-${sellerOrdersInitialView}`}
        sellerName={sellerDisplayName}
        initialView={sellerOrdersInitialView}
        onNavigate={(target) => {
          console.log("Seller Orders navigation:", target);
          if (target === "orders") {
            setSellerOrdersInitialView("active");
            setCurrentPage("sellerOrders");
          }
          if (target === "home") {
            setCurrentPage("sellerHome");
          }
          if (target === "samples") {
            setCurrentPage("sellerSamples");
          }
          if (target === "mySamples") {
            setSellerOpenUpload(false);
            setCurrentPage("sellerMySamples");
          }
          if (target === "profile") {
            setCurrentPage("sellerProfile");
          }
        }}
      />
    );
  }

  if (currentPage === "sellerSamples") {
    return (
      <SellerSamplesPage
        sellerName={sellerDisplayName}
        onNavigate={(target) => {
          console.log("Seller Samples navigation:", target);

          if (target === "samples") {
            setCurrentPage("sellerSamples");
          }

          if (target === "home") {
            setCurrentPage("sellerHome");
          }

          if (target === "mySamples") {
            setSellerOpenUpload(false);
            setCurrentPage("sellerMySamples");
          }

          if (target === "orders") {
            setSellerOrdersInitialView("active");
            setCurrentPage("sellerOrders");
          }

          if (target === "profile") {
            setCurrentPage("sellerProfile");
          }
        }}
      />
    );
  }
  if (currentPage === "sellerMySamples") {
    return (
      <SellerMySamplesPage
        sellerName={sellerDisplayName}
        openUploadOnLoad={sellerOpenUpload}
        onUploadOpened={() => setSellerOpenUpload(false)}
        onNavigate={(target) => {
          console.log(
            "Seller My Samples navigation:",
            target
          );
  
          if (target === "home") {
            setCurrentPage("sellerHome");
          }
  
          if (target === "mySamples") {
            setSellerOpenUpload(false);
            setCurrentPage("sellerMySamples");
          }
  
          if (target === "samples") {
            setCurrentPage("sellerSamples");
          }
  
          if (target === "orders") {
            setSellerOrdersInitialView("active");
            setCurrentPage("sellerOrders");
          }
  
          if (target === "profile") {
            setCurrentPage("sellerProfile");
          }
        }}
      />
    );
  }
  if (currentPage === "sellerHome") {
    return (
      <SellerHomePage
        sellerName={sellerDisplayName}
        initialAvailability="accepting"
        onNavigate={(target) => {
          console.log(
            "Seller navigation:",
            target
          );
  
          if (target === "home") {
            setCurrentPage("sellerHome");
          }
  
          // Temporary connections while other
          // seller pages are being developed.
          if (target === "orders") {
            setSellerOrdersInitialView("active");
            setCurrentPage("sellerOrders");
          }
  
          if (target === "samples") {
            setCurrentPage("sellerSamples");
          }

          if (target === "orderHistory") {
            setSellerOrdersInitialView("history");
            setCurrentPage("sellerOrders");
          }

          if (target === "salesReport") {
            setCurrentPage("sellerSalesReport");
          }

          if (target === "transporterContacts") {
            setCurrentPage("sellerTransporterContacts");
          }
          if (target === "about") {
            setCurrentPage("aboutStoneRate");
          }
          if (target === "howItWorks") {
            setCurrentPage("howStoneRateWorks");
          }
          if (target === "sellerGuide") {
            setCurrentPage("sellerGuide");
          }
          if (target === "terms") {
            setCurrentPage("sellerTermsPrivacy");
          }
  
          if (target === "mySamples") {
            setSellerOpenUpload(false);
            setCurrentPage("sellerMySamples");
          }
  
          if (target === "profile") {
            setCurrentPage("sellerProfile");
          }
  
          if (target === "upload") {
            setSellerOpenUpload(true);
            setCurrentPage("sellerMySamples");
          }
  
          if (target === "rates") {
            console.log(
              "Update Rates page is not connected yet."
            );
          }
  
          if (target === "availability") {
            console.log(
              "Availability control selected."
            );
          }
        }}
        onOpenOrder={(order) => {
          console.log(
            "Selected seller delivery:",
            order
          );
        }}
      />
    );
  }

  if (currentPage === "adminSettings") {
    return (
      <AdminSettings
        onBack={goToAdminDashboard}
        onHome={goToAdminDashboard}
        onSellerInformation={goToSellerInformation}
      />
    );
  }

  if (currentPage === "sellerInformationAdmin") {
    return (
      <SellerInformationPage
        onBack={goToAdminSettings}
      />
    );
  }

  if (currentPage === "adminSamples") {
    return (
      <AdminSamples
        onHome={goToAdminDashboard}
        onRateRequests={goToAdminRateRequests}
        onConfirmedOrders={goToAdminActiveOrders}
        onTransporterBidding={goToAdminTransporterBidding}
      />
    );
  }
  if (currentPage === "adminActiveOrderDetails") {
    return (
      <AdminActiveOrderDetails
        selectedOrder={selectedOrder}
        onBack={goToAdminActiveOrders}
        onUpdated={(updatedOrder) => {
          console.log("Active order updated:", updatedOrder);
          setSelectedOrder(updatedOrder);
        }}
      />
    );
  }

  if (currentPage === "adminRateRequestDetails") {
    return (
      <AdminRateRequestDetails
        selectedRequest={selectedOrder}
        onBack={goToAdminRateRequests}
        onOpenSamples={(selectionContext) => {
          console.log(
            "Open samples in selection mode:",
            selectionContext
          );
          goToAdminSamples();
        }}
        onPublished={(quotation) => {
          console.log("Published quotation:", quotation);
          goToAdminRateRequests();
        }}
        onRejected={(rejection) => {
          console.log("Rejected request:", rejection);
          goToAdminRateRequests();
        }}
      />
    );
  }

  if (currentPage === "adminActiveOrders") {
    return (
      <AdminActiveOrders
        onBack={goToAdminDashboard}
        onHome={goToAdminDashboard}
        onSamples={goToAdminSamples}
        onTransporterBidding={goToAdminTransporterBidding}
        onRateRequests={goToAdminRateRequests}
        onConfirmedOrders={goToAdminActiveOrders}
        onOrders={goToAdminActiveOrders}
        onOpenOrder={(order) => {
          console.log("Selected active order:", order);
          setSelectedOrder(order);
          setCurrentPage("adminActiveOrderDetails");
        }}
      />
    );
  }

  if (currentPage === "adminRateRequests") {
    return (
      <AdminRateRequests
        onBack={goToAdminDashboard}
        onHome={goToAdminDashboard}
        onSamples={goToAdminSamples}
        onTransporterBidding={goToAdminTransporterBidding}
        onRateRequests={goToAdminRateRequests}
        onConfirmedOrders={goToAdminActiveOrders}
        onOrders={goToAdminActiveOrders}
        onOpenRequest={(request) => {
          console.log("Selected rate request:", request);
          setSelectedOrder(request);
          setCurrentPage("adminRateRequestDetails");
        }}
      />
    );
  }

  if (currentPage === "adminDashboard") {
    return (
      <AdminDashboard
        onSamples={goToAdminSamples}
        onTransporterBidding={goToAdminTransporterBidding}
        onHome={goToAdminDashboard}
        onRateRequests={goToAdminRateRequests}
        onConfirmedOrders={goToAdminActiveOrders}
        onSettings={goToAdminSettings}
      />
    );
  }

  if (currentPage === "page10") {
    return (
      <Page10
        goToPage4={() => setCurrentPage("page4")}
        goToPage9={() => openOrdersPage("all", "all")}
      />
    );
  }

  if (currentPage === "page9") {
    return (
      <Page9
        key={`page9-${ordersInitialFilter}-${ordersInitialStatus}`}
        initialOrderType={ordersInitialFilter}
        initialOrderStatus={ordersInitialStatus}
        goToPage4={() => setCurrentPage("page4")}
        goToPage7={(order) => {
          setSelectedOrder(order);
          setCurrentPage("page7");
        }}
        goToPage8={(order) => {
          setSelectedOrder(order);
          setCurrentPage("page8");
        }}
        goToProfile={() => setCurrentPage("page10")}
      />
    );
  }

  if (currentPage === "page8") {
    return (
      <Page8
        selectedOrder={selectedOrder}
        goToPage4={() => setCurrentPage("page4")}
        goToPage7={() => setCurrentPage("page7")}
        goToPage9={() => openOrdersPage("all", "all")}
      />
    );
  }

  if (currentPage === "page7") {
    return (
      <Page7
        selectedOrder={selectedOrder}
        goToPage4={() => setCurrentPage("page4")}
        goToPage9={() => openOrdersPage("all", "all")}
        goToPage8={() => setCurrentPage("page8")}
      />
    );
  }

  if (currentPage === "page6") {
    return (
      <Page6
        orderDraft={orderDraft}
        goToPage5={() => {
          setOpenOrderCartOnLoad(false);
          setCurrentPage("page5");
        }}
        editOrder={() => {
          setOpenOrderCartOnLoad(true);
          setCurrentPage("page5");
        }}
        goToPage7={() => {
          setSelectedOrder(null);
          openOrdersPage("all", "all");
        }}
      />
    );
  }

  if (currentPage === "page5") {
    return (
      <Page5
        existingOrderDraft={orderDraft}
        openCartOnLoad={openOrderCartOnLoad}
        onCartOpened={() => setOpenOrderCartOnLoad(false)}
        goToPage4={() => {
          setOpenOrderCartOnLoad(false);
          setCurrentPage("page4");
        }}
        goToPage6={(draft) => {
          setOrderDraft(draft);
          setOpenOrderCartOnLoad(false);
          setCurrentPage("page6");
        }}
      />
    );
  }

  if (currentPage === "page4") {
    return (
      <Page4
        goToPlaceOrder={() => {
          setOrderDraft(null);
          setSelectedOrder(null);
          setOpenOrderCartOnLoad(false);
          setCurrentPage("page5");
        }}
        goToOrders={() => openOrdersPage("all", "all")}
        goToRateRequests={() => openOrdersPage("rate", "all")}
        goToActiveOrders={() => openOrdersPage("active", "all")}
        goToReorders={() =>
          openOrdersPage("delivery", "delivered")
        }
        goToProfile={() => setCurrentPage("page10")}
      />
    );
  }

  if (currentPage === "page3") {
    return (
      <Page3
        goToPage1={() => setCurrentPage("page1")}
        goToPage2={() => setCurrentPage("page2")}
        goToPage4={() => setCurrentPage("page4")}
        goToAdminDashboard={goToAdminDashboard}
        goToSellerHome={(seller) => {
          const verifiedSeller =
            seller || readStoredSeller();

          if (verifiedSeller) {
            setCurrentSeller(verifiedSeller);

            window.localStorage.setItem(
              "stonerate_current_seller",
              JSON.stringify(verifiedSeller)
            );

            window.localStorage.setItem(
              "stonerate_current_user",
              JSON.stringify(verifiedSeller)
            );
          }

          const isSandSeller =
            getSellerProductType(verifiedSeller) === "sand";
          setCurrentPage(isSandSeller ? "sandSellerHome" : "sellerHome");
        }}
      />
    );
  }

  if (currentPage === "page2") {
    return (
      <Page2
        goToPage1={() => setCurrentPage("page1")}
        goToPage3={() => setCurrentPage("page3")}
        goToPage4={() => setCurrentPage("page4")}
      />
    );
  }

  return (
    <Page1
      goToPage2={() => setCurrentPage("page2")}
      goToPage3={openFreshSignInPage}
    />
  );
}

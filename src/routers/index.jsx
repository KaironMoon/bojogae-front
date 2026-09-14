import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/home";
import Info from "../pages/info";
import NotFound from "../pages/error/NotFound";
import PageLayout from "../pages/PageLayout";
import LoginPage from "../pages/auth/LoginPage";
import ApprovalPendingPage from "../pages/auth/ApprovalPendingPage";
import AccessRestrictedPage from "../pages/auth/AccessRestrictedPage";
import UsersPage from "../pages/admin/UsersPage";
import SignupCompletePage from "../pages/auth/SignupCompletePage";
import EmailVerificationPage from "../pages/auth/EmailVerificationPage";
import ProfilePage from "../pages/profile/ProfilePage";
import EmailChangeVerificationPage from "../pages/profile/EmailChangeVerificationPage";
import PromptsPage from "../pages/prompts/PromptsPage";
import ProposalsPage from "../pages/proposals/ProposalsPage";
import AdminProposalsPage from "../pages/admin/ProposalsPage";
import UsagePage from "../pages/admin/UsagePage";
import ProposalSettingsPage from "../pages/admin/ProposalSettingsPage";
import PointsPage from "../pages/admin/PointsPage";
import {
  ActiveUserRoute,
  AdminRoute,
  PendingUserRoute,
  PublicOnlyRoute,
  RestrictedUserRoute,
} from "../auth/RouteGuards";

const ProductLayout = lazy(() => import("../pages/product/ProductLayout"));
const ProductList = lazy(() => import("../pages/product"));
const ProductDetail = lazy(() => import("../pages/product/ProductDetail"));

const ProductRouter = [
  {
    path: "/product",
    element: <ProductLayout />,
    children: [
      {
        path: "/product",
        element: <ProductList />,
      },
      {
        path: "/product/:id",
        element: <ProductDetail />,
      },
    ],
  },
];

const router = createBrowserRouter([
  {
    path: "/signup/complete",
    element: <SignupCompletePage />,
  },
  {
    path: "/signup/verify",
    element: <EmailVerificationPage />,
  },
  {
    path: "/profile/email/verify",
    element: <EmailChangeVerificationPage />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <PendingUserRoute />,
    children: [{ path: "/approval-pending", element: <ApprovalPendingPage /> }],
  },
  {
    element: <RestrictedUserRoute />,
    children: [{ path: "/access-restricted", element: <AccessRestrictedPage /> }],
  },
  {
    element: <ActiveUserRoute />,
    children: [
      {
        element: <PageLayout />,
        children: [
          {
            path: "/home",
            element: <Home />,
          },
          {
            path: "/info",
            element: <Info />,
          },
          {
            path: "/profile",
            element: <ProfilePage />,
          },
          {
            path: "/proposals",
            element: <ProposalsPage />,
          },
          ...ProductRouter,
        ],
      },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      {
        element: <PageLayout />,
        children: [
          { path: "/admin/users", element: <UsersPage /> },
          { path: "/admin/points", element: <PointsPage /> },
          { path: "/admin/prompts", element: <PromptsPage /> },
          { path: "/admin/proposals", element: <AdminProposalsPage /> },
          { path: "/admin/usage", element: <UsagePage /> },
          { path: "/admin/proposal-settings", element: <ProposalSettingsPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;

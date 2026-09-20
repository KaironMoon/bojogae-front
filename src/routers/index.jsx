import RefundCreatePage from "../pages/document-requests/RefundCreatePage";
import SuggestionCreatePage from "../pages/document-requests/SuggestionCreatePage";
import RequestHistoryPage from "../pages/document-requests/RequestHistoryPage";
import GroupsPage from "../pages/groups/GroupsPage";
import MyCoinsPage from "../pages/groups/MyCoinsPage";
import GroupPasswordPage from "../pages/auth/GroupPasswordPage";
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
import DashboardBannersPage from "../pages/admin/DashboardBannersPage";
import GroupInquiriesPage from "../pages/admin/GroupInquiriesPage";
import BoardListPage from "../pages/boards/BoardListPage";
import BoardPostPage from "../pages/boards/BoardPostPage";
import BoardEditorPage from "../pages/boards/BoardEditorPage";
import {
  ActiveUserRoute,
  AdminRoute,
  PendingUserRoute,
  PublicOnlyRoute,
  RestrictedUserRoute,
} from "../auth/RouteGuards";
import LandingPage from "../pages/landing/LandingPage";

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
  { path: "/board/posts/:postId", element: <BoardPostPage /> },
  { path: "/group/change-password", element: <GroupPasswordPage /> },
  { path: "/group/password-reset", element: <GroupPasswordPage /> },
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
        element: <LandingPage />,
      },
      {
        path: "/login",
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
            path: "/profile",
            element: <ProfilePage />,
          },
          {
            path: "/proposals",
            element: <ProposalsPage />,
          },
          { path: "/proposals/:generationId/refund", element: <RefundCreatePage /> },
          { path: "/refund-requests", element: <RequestHistoryPage key="refund-user" kind="refund" /> },
          { path: "/document-suggestions", element: <RequestHistoryPage key="suggestion-user" kind="suggestion" /> },
          { path: "/document-suggestions/new", element: <SuggestionCreatePage key="new-suggestion" /> },
          { path: "/document-suggestions/:requestId/edit", element: <SuggestionCreatePage key="edit-suggestion" /> },
          { path: "/group", element: <GroupsPage /> },
          { path: "/group/:groupId", element: <GroupsPage /> },
          { path: "/my-coins", element: <MyCoinsPage /> },
          { path: "/boards/:boardType", element: <BoardListPage /> },
          { path: "/boards/:boardType/:postId", element: <BoardPostPage embedded /> },
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
          { path: "/admin/info", element: <Info /> },
          { path: "/admin/groups", element: <GroupsPage /> },
          { path: "/admin/groups/:groupId", element: <GroupsPage /> },
          { path: "/admin/refund-requests", element: <RequestHistoryPage key="refund-admin" kind="refund" admin /> },
          { path: "/admin/document-suggestions", element: <RequestHistoryPage key="suggestion-admin" kind="suggestion" admin /> },
          { path: "/admin/users", element: <UsersPage /> },
          { path: "/admin/points", element: <PointsPage /> },
          { path: "/admin/prompts", element: <PromptsPage /> },
          { path: "/admin/proposals", element: <AdminProposalsPage /> },
          { path: "/admin/usage", element: <UsagePage /> },
          { path: "/admin/proposal-settings", element: <ProposalSettingsPage /> },
          { path: "/admin/dashboard-banners", element: <DashboardBannersPage /> },
          { path: "/admin/group-inquiries", element: <GroupInquiriesPage /> },
          { path: "/admin/boards/:boardType", element: <BoardListPage admin /> },
          { path: "/admin/boards/:boardType/new", element: <BoardEditorPage /> },
          { path: "/admin/boards/:boardType/:postId", element: <BoardPostPage admin /> },
          { path: "/admin/boards/:boardType/:postId/edit", element: <BoardEditorPage /> },
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
